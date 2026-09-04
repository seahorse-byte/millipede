mod telemetry;
use axum::response::sse::{Event, KeepAlive, Sse};
use axum::extract::{Query, State};
use axum::{http::StatusCode, routing::{get, post}, Json, Router};
use axum_server::tls_rustls::RustlsConfig;
use futures_util::StreamExt;
use millipede_tls_common::{
    build_mtls_server_config, certs_dir, ensure_crypto_provider, mtls_enabled,
};
use rdkafka::config::ClientConfig;
use rdkafka::consumer::{Consumer, StreamConsumer};
use rdkafka::message::Message;
use redis::AsyncCommands;
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use std::convert::Infallible;
use std::{collections::HashMap, env, net::SocketAddr, sync::Arc, time::Duration};
use tokio_stream::wrappers::ReceiverStream;
use tower_http::cors::{Any, CorsLayer};
use tracing::{error, info, warn};

#[derive(Clone)]
struct AppState {
    pool: PgPool,
    redis: Option<redis::Client>,
    kafka_topic: String,
    direct_reports: Vec<DirectReport>,
}

#[derive(Clone, Serialize, Deserialize)]
struct DirectReport {
    id: String,
    name: String,
    email: String,
    github: String,
    gitlab: String,
    slack_user_id: String,
    jira_account_id: String,
}

#[derive(Deserialize)]
struct RosterFile {
    direct_reports: Vec<DirectReport>,
}

#[derive(Deserialize)]
struct EventsQuery {
    direct_report: Option<String>,
    #[serde(default)]
    source: Vec<String>,
    limit: Option<i64>,
}

#[derive(Deserialize)]
struct PullRequestsQuery {
    direct_report: Option<String>,
    source: Option<String>,
    #[serde(default)]
    state: Vec<String>,
    repo: Option<String>,
    sort: Option<String>,
    limit: Option<i64>,
}

#[derive(Serialize, sqlx::FromRow)]
struct EventItem {
    id: String,
    source: String,
    actor_id: Option<String>,
    actor_name: Option<String>,
    title: Option<String>,
    event_type: Option<String>,
    sentiment: Option<f32>,
    risk_score: Option<f32>,
    created_at: String,
}

#[derive(Serialize, sqlx::FromRow)]
struct PullRequestItem {
    id: String,
    source: String,
    repo: String,
    pr_number: i32,
    title: String,
    url: Option<String>,
    state: String,
    author_id: Option<String>,
    author_name: Option<String>,
    updated_at: String,
    merged_at: Option<String>,
    draft: bool,
    blocked: bool,
}

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    service: &'static str,
    kafka_topic: String,
    database: &'static str,
    redis: &'static str,
}

#[derive(Serialize)]
struct ManagerKpis {
    avg_sentiment: f64,
    high_risk_count: i64,
    friction_index: f64,
    eval_pass_rate: Option<f64>,
}

#[derive(Serialize)]
struct MetricsSummary {
    total_events: i64,
    events_by_source: HashMap<String, i64>,
    latest_by_source: HashMap<String, String>,
    kpis: ManagerKpis,
}

#[derive(Serialize)]
struct BrainRefreshResponse {
    status: &'static str,
    message: &'static str,
    command: &'static str,
}

#[derive(Deserialize)]
struct RawEvent {
    id: String,
    source: String,
    payload: serde_json::Value,
    sentiment: Option<f64>,
    risk_score: Option<f64>,
    enriched_at: Option<String>,
    event_type: Option<String>,
    actor_id: Option<String>,
    actor_name: Option<String>,
    title: Option<String>,
    repo: Option<String>,
    pr_number: Option<i32>,
    pr_state: Option<String>,
    url: Option<String>,
    merged_at: Option<String>,
    pr_draft: Option<bool>,
    pr_blocked: Option<bool>,
    pr_updated_at: Option<String>,
}

async fn health(State(state): State<AppState>) -> Json<HealthResponse> {
    let db_ok = sqlx::query("SELECT 1").execute(&state.pool).await.is_ok();
    let redis_ok = if let Some(client) = &state.redis {
        match client.get_multiplexed_tokio_connection().await {
            Ok(mut conn) => redis::cmd("PING")
                .query_async::<()>(&mut conn)
                .await
                .is_ok(),
            Err(_) => false,
        }
    } else {
        false
    };

    Json(HealthResponse {
        status: "ok",
        service: "millipede-analyzer",
        kafka_topic: state.kafka_topic.clone(),
        database: if db_ok { "connected" } else { "unavailable" },
        redis: if redis_ok {
            "connected"
        } else if state.redis.is_some() {
            "unavailable"
        } else {
            "disabled"
        },
    })
}

async fn metrics_summary(
    State(state): State<AppState>,
) -> Result<Json<MetricsSummary>, axum::http::StatusCode> {
    let _latency = telemetry::LatencyGuard::metrics();
    let rows: Vec<(String, i64)> = sqlx::query_as(
        "SELECT source, COUNT(*)::BIGINT FROM team_events GROUP BY source ORDER BY source",
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut events_by_source = HashMap::new();
    let mut total_events = 0i64;
    for (source, count) in rows {
        total_events += count;
        events_by_source.insert(source, count);
    }

    let mut latest_by_source = HashMap::new();
    if let Some(client) = &state.redis {
        if let Ok(mut conn) = client.get_multiplexed_tokio_connection().await {
            if let Ok(map) = conn
                .hgetall::<_, HashMap<String, String>>("team_radar:latest_by_source")
                .await
            {
                latest_by_source = map;
            }
        }
    }

    let kpi_row: (Option<f64>, i64, Option<f64>) = sqlx::query_as(
        r#"
        SELECT
            AVG(sentiment)::float8,
            COUNT(*) FILTER (WHERE risk_score >= 0.5)::BIGINT,
            AVG(risk_score)::float8
        FROM team_events
        "#,
    )
    .fetch_one(&state.pool)
    .await
    .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    let avg_sentiment = kpi_row.0.unwrap_or(0.5);
    let avg_risk = kpi_row.2.unwrap_or(0.0);
    let friction_index =
        ((1.0 - avg_sentiment) * 0.6 + avg_risk * 0.4).clamp(0.0, 1.0);

    let eval_pass_rate: Option<f64> = sqlx::query_scalar(
        r#"
        SELECT value::float8
        FROM team_metrics
        WHERE metric_type = 'eval_pass_rate'
        ORDER BY computed_at DESC
        LIMIT 1
        "#,
    )
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(MetricsSummary {
        total_events,
        events_by_source,
        latest_by_source,
        kpis: ManagerKpis {
            avg_sentiment,
            high_risk_count: kpi_row.1,
            friction_index: (friction_index * 1000.0).round() / 1000.0,
            eval_pass_rate,
        },
    }))
}

async fn telemetry_summary() -> Json<telemetry::TelemetrySummary> {
    Json(telemetry::summary())
}

fn load_direct_reports() -> Vec<DirectReport> {
    let path = env::var("DIRECT_REPORTS_CONFIG")
        .unwrap_or_else(|_| "config/direct-reports.json".into());
    match std::fs::read_to_string(&path) {
        Ok(contents) => match serde_json::from_str::<RosterFile>(&contents) {
            Ok(roster) => {
                info!(count = roster.direct_reports.len(), path = %path, "loaded direct reports roster");
                roster.direct_reports
            }
            Err(err) => {
                warn!(error = %err, path = %path, "failed to parse direct reports roster");
                Vec::new()
            }
        },
        Err(err) => {
            warn!(error = %err, path = %path, "direct reports roster not found");
            Vec::new()
        }
    }
}

async fn ensure_schema(pool: &PgPool) {
    let statements = [
        "ALTER TABLE team_events ADD COLUMN IF NOT EXISTS actor_id TEXT",
        "ALTER TABLE team_events ADD COLUMN IF NOT EXISTS actor_name TEXT",
        "ALTER TABLE team_events ADD COLUMN IF NOT EXISTS title TEXT",
        "ALTER TABLE team_events ADD COLUMN IF NOT EXISTS event_type TEXT",
        "ALTER TABLE team_events ADD COLUMN IF NOT EXISTS repo TEXT",
        "ALTER TABLE team_events ADD COLUMN IF NOT EXISTS pr_number INTEGER",
        "ALTER TABLE team_events ADD COLUMN IF NOT EXISTS pr_state TEXT",
        "ALTER TABLE team_events ADD COLUMN IF NOT EXISTS url TEXT",
        "ALTER TABLE team_events ADD COLUMN IF NOT EXISTS merged_at TEXT",
        "ALTER TABLE team_events ADD COLUMN IF NOT EXISTS pr_draft BOOLEAN DEFAULT FALSE",
        "ALTER TABLE team_events ADD COLUMN IF NOT EXISTS pr_blocked BOOLEAN DEFAULT FALSE",
        "ALTER TABLE team_events ADD COLUMN IF NOT EXISTS pr_updated_at TEXT",
        "CREATE INDEX IF NOT EXISTS idx_team_events_actor_id ON team_events(actor_id)",
        "CREATE INDEX IF NOT EXISTS idx_team_events_event_type ON team_events(event_type)",
        "CREATE INDEX IF NOT EXISTS idx_team_events_pr ON team_events(event_type, repo, pr_number) WHERE event_type = 'pr'",
    ];
    for sql in statements {
        if let Err(err) = sqlx::query(sql).execute(pool).await {
            warn!(error = %err, sql, "schema migration step failed");
        }
    }
}

async fn list_direct_reports(State(state): State<AppState>) -> Json<Vec<DirectReport>> {
    Json(state.direct_reports.clone())
}

/// Stub for future Kafka consumer or subprocess trigger — run brain-writer locally today.
async fn brain_refresh_stub() -> Json<BrainRefreshResponse> {
    Json(BrainRefreshResponse {
        status: "stub",
        message: "Team Brain refresh is not wired in-process yet; run the local writer script.",
        command: "pnpm brain:refresh",
    })
}

async fn list_events(
    State(state): State<AppState>,
    Query(params): Query<EventsQuery>,
) -> Result<Json<Vec<EventItem>>, StatusCode> {
    let limit = params.limit.unwrap_or(50).clamp(1, 200);
    let sources = params.source;

    let rows: Vec<EventItem> = if sources.is_empty() {
        sqlx::query_as(
            r#"
            SELECT id, source, actor_id, actor_name, title, event_type, sentiment, risk_score, created_at
            FROM team_events
            WHERE ($1::TEXT IS NULL OR actor_id = $1)
              AND COALESCE(event_type, 'activity') != 'pr'
            ORDER BY created_at DESC
            LIMIT $2
            "#,
        )
        .bind(params.direct_report.as_deref())
        .bind(limit)
        .fetch_all(&state.pool)
        .await
    } else {
        sqlx::query_as(
            r#"
            SELECT id, source, actor_id, actor_name, title, event_type, sentiment, risk_score, created_at
            FROM team_events
            WHERE ($1::TEXT IS NULL OR actor_id = $1)
              AND source = ANY($2)
              AND COALESCE(event_type, 'activity') != 'pr'
            ORDER BY created_at DESC
            LIMIT $3
            "#,
        )
        .bind(params.direct_report.as_deref())
        .bind(&sources)
        .bind(limit)
        .fetch_all(&state.pool)
        .await
    }
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(rows))
}

async fn list_pull_requests(
    State(state): State<AppState>,
    Query(params): Query<PullRequestsQuery>,
) -> Result<Json<Vec<PullRequestItem>>, StatusCode> {
    let limit = params.limit.unwrap_or(50).clamp(1, 200);
    let sort = params.sort.as_deref().unwrap_or("merged_at_desc");
    let states: Vec<String> = params
        .state
        .iter()
        .flat_map(|value| value.split(','))
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_ascii_lowercase)
        .collect();
    let state_filter: Option<Vec<String>> = if states.is_empty() {
        None
    } else {
        Some(states)
    };

    let order_clause = match sort {
        "updated_at_desc" => "updated_at DESC",
        _ => "merged_at DESC NULLS LAST, updated_at DESC",
    };

    let sql = format!(
        r#"
        SELECT
            id,
            source,
            repo,
            pr_number,
            title,
            url,
            state,
            author_id,
            author_name,
            updated_at,
            merged_at,
            draft,
            blocked
        FROM (
            SELECT DISTINCT ON (repo, pr_number)
                id,
                source,
                repo,
                pr_number,
                COALESCE(title, '') AS title,
                url,
                COALESCE(pr_state, 'open') AS state,
                actor_id AS author_id,
                actor_name AS author_name,
                COALESCE(pr_updated_at, created_at) AS updated_at,
                merged_at,
                COALESCE(pr_draft, false) AS draft,
                COALESCE(pr_blocked, false) AS blocked
            FROM team_events
            WHERE event_type = 'pr'
              AND repo IS NOT NULL
              AND pr_number IS NOT NULL
              AND ($1::TEXT IS NULL OR actor_id = $1)
              AND ($2::TEXT IS NULL OR source = $2)
              AND ($4::TEXT IS NULL OR repo = $4)
            ORDER BY repo, pr_number, created_at DESC
        ) latest
        WHERE (
            $3::TEXT[] IS NULL
            OR (
                ('open' = ANY($3) AND state = 'open' AND NOT draft)
                OR ('merged' = ANY($3) AND state = 'merged')
                OR ('closed' = ANY($3) AND state = 'closed')
                OR ('draft' = ANY($3) AND draft)
                OR ('blocked' = ANY($3) AND blocked)
            )
        )
        ORDER BY {order_clause}
        LIMIT $5
        "#
    );

    let rows: Vec<PullRequestItem> = sqlx::query_as(&sql)
        .bind(params.direct_report.as_deref())
        .bind(params.source.as_deref())
        .bind(state_filter)
        .bind(params.repo.as_deref())
        .bind(limit)
        .fetch_all(&state.pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(rows))
}

async fn events_stream(
    State(state): State<AppState>,
) -> Result<Sse<impl futures_util::Stream<Item = Result<Event, Infallible>> + Send>, StatusCode> {
    let client = state
        .redis
        .as_ref()
        .ok_or(StatusCode::SERVICE_UNAVAILABLE)?
        .clone();

    let (tx, rx) = tokio::sync::mpsc::channel::<String>(64);

    tokio::spawn(async move {
        let Ok(mut pubsub) = client.get_async_pubsub().await else {
            warn!("redis pubsub connection failed");
            return;
        };
        if pubsub.subscribe("team_radar:events").await.is_err() {
            warn!("redis pubsub subscribe failed");
            return;
        }

        let mut messages = pubsub.into_on_message();
        while let Some(message) = messages.next().await {
            let Ok(payload) = message.get_payload::<String>() else {
                continue;
            };
            if tx.send(payload).await.is_err() {
                break;
            }
        }
    });

    let stream = ReceiverStream::new(rx)
        .map(|payload| Ok(Event::default().event("team_event").data(payload)));

    Ok(Sse::new(stream).keep_alive(
        KeepAlive::new()
            .interval(Duration::from_secs(15))
            .text("ping"),
    ))
}

async fn persist_event(pool: &PgPool, event: &RawEvent) -> Result<(), sqlx::Error> {
    let _latency = telemetry::LatencyGuard::store();
    let payload_json = event.payload.to_string();
    sqlx::query(
        r#"
        INSERT INTO team_events (
            id, source, payload_json, sentiment, risk_score, enriched_at, created_at,
            actor_id, actor_name, title, event_type, repo, pr_number, pr_state, url,
            merged_at, pr_draft, pr_blocked, pr_updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW()::TEXT, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO UPDATE SET
            sentiment = EXCLUDED.sentiment,
            risk_score = EXCLUDED.risk_score,
            enriched_at = EXCLUDED.enriched_at,
            actor_id = EXCLUDED.actor_id,
            actor_name = EXCLUDED.actor_name,
            title = EXCLUDED.title,
            event_type = EXCLUDED.event_type,
            repo = EXCLUDED.repo,
            pr_number = EXCLUDED.pr_number,
            pr_state = EXCLUDED.pr_state,
            url = EXCLUDED.url,
            merged_at = EXCLUDED.merged_at,
            pr_draft = EXCLUDED.pr_draft,
            pr_blocked = EXCLUDED.pr_blocked,
            pr_updated_at = EXCLUDED.pr_updated_at
        "#,
    )
    .bind(&event.id)
    .bind(&event.source)
    .bind(payload_json)
    .bind(event.sentiment)
    .bind(event.risk_score)
    .bind(event.enriched_at.as_deref())
    .bind(event.actor_id.as_deref())
    .bind(event.actor_name.as_deref())
    .bind(event.title.as_deref())
    .bind(event.event_type.as_deref())
    .bind(event.repo.as_deref())
    .bind(event.pr_number)
    .bind(event.pr_state.as_deref())
    .bind(event.url.as_deref())
    .bind(event.merged_at.as_deref())
    .bind(event.pr_draft)
    .bind(event.pr_blocked)
    .bind(event.pr_updated_at.as_deref())
    .execute(pool)
    .await?;
    Ok(())
}

async fn warm_redis(client: &redis::Client, event: &RawEvent) {
    let Ok(mut conn) = client.get_multiplexed_tokio_connection().await else {
        warn!(event_id = %event.id, "redis connection failed");
        return;
    };

    let live_payload = serde_json::json!({
        "id": event.id,
        "source": event.source,
        "sentiment": event.sentiment,
        "risk_score": event.risk_score,
        "actor_id": event.actor_id,
        "actor_name": event.actor_name,
        "title": event.title,
        "event_type": event.event_type,
        "repo": event.repo,
        "pr_number": event.pr_number,
        "pr_state": event.pr_state,
        "url": event.url,
        "merged_at": event.merged_at,
        "draft": event.pr_draft,
        "blocked": event.pr_blocked,
    });

    let _: Result<(), redis::RedisError> = conn
        .hset("team_radar:latest_by_source", &event.source, &event.id)
        .await;
    let _: Result<(), redis::RedisError> = conn
        .incr(format!("team_radar:count:{}", event.source), 1i64)
        .await;
    let _: Result<(), redis::RedisError> = conn
        .publish("team_radar:events", live_payload.to_string())
        .await;

    info!(event_id = %event.id, source = %event.source, "redis cache warmed");
}

async fn run_consumer(state: Arc<AppState>, brokers: String, topic: String) {
    let consumer: StreamConsumer = match ClientConfig::new()
        .set("bootstrap.servers", &brokers)
        .set("group.id", "millipede-analyzer")
        .set("enable.auto.commit", "true")
        .set("auto.offset.reset", "earliest")
        .set("session.timeout.ms", "6000")
        .create()
    {
        Ok(c) => c,
        Err(err) => {
            error!(error = %err, "failed to create kafka consumer");
            return;
        }
    };

    if let Err(err) = consumer.subscribe(&[topic.as_str()]) {
        error!(error = %err, "failed to subscribe to topic");
        return;
    }

    info!(%brokers, %topic, "analyzer consuming enriched events");

    loop {
        match consumer.recv().await {
            Ok(message) => {
                let payload = match message.payload_view::<str>() {
                    None => {
                        warn!("empty kafka message payload");
                        continue;
                    }
                    Some(Ok(text)) => text,
                    Some(Err(err)) => {
                        warn!(error = %err, "invalid utf-8 in kafka payload");
                        continue;
                    }
                };

                let event: RawEvent = match serde_json::from_str(payload) {
                    Ok(event) => event,
                    Err(err) => {
                        warn!(error = %err, payload, "failed to parse event json");
                        continue;
                    }
                };

                match persist_event(&state.pool, &event).await {
                    Ok(()) => {
                        info!(event_id = %event.id, source = %event.source, "stored team event");
                        if let Some(client) = &state.redis {
                            warm_redis(client, &event).await;
                        }
                    }
                    Err(err) => {
                        error!(event_id = %event.id, error = %err, "postgres insert failed")
                    }
                }
            }
            Err(err) => {
                warn!(error = %err, "kafka receive error");
                tokio::time::sleep(Duration::from_secs(1)).await;
            }
        }
    }
}

async fn serve(app: Router, addr: SocketAddr, mtls_service: Option<&str>) {
    if let Some(name) = mtls_service {
        let dir = certs_dir();
        let tls = build_mtls_server_config(name, &dir).expect("mtls config");
        let rustls = RustlsConfig::from_config(tls);
        info!(%addr, service = name, "analyzer listening with mTLS");
        axum_server::bind_rustls(addr, rustls)
            .serve(app.into_make_service())
            .await
            .expect("mTLS server failed");
    } else {
        info!(%addr, "analyzer listening (plain HTTP)");
        let listener = tokio::net::TcpListener::bind(addr)
            .await
            .expect("bind failed");
        axum::serve(listener, app).await.expect("server failed");
    }
}

#[tokio::main]
async fn main() {
    ensure_crypto_provider();
    telemetry::init_tracing_otel();
    tracing_subscriber::fmt()
        .with_env_filter(
            env::var("RUST_LOG").unwrap_or_else(|_| "millipede_analyzer=info,sqlx=warn".into()),
        )
        .init();

    let kafka_brokers = env::var("KAFKA_BROKERS").unwrap_or_else(|_| "localhost:9092".into());
    let kafka_topic = env::var("KAFKA_TOPIC").unwrap_or_else(|_| "enriched-dev-events".into());
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://millipede:millipede@localhost:5432/team_radar".into());
    let redis_url = env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".into());
    let port: u16 = env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8082);

    let pool = match PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(5))
        .connect(&database_url)
        .await
    {
        Ok(pool) => {
            ensure_schema(&pool).await;
            info!("postgres pool ready");
            pool
        }
        Err(err) => {
            error!(error = %err, "postgres unavailable — exiting");
            std::process::exit(1);
        }
    };

    let direct_reports = load_direct_reports();

    let redis = match redis::Client::open(redis_url.as_str()) {
        Ok(client) => {
            info!("redis client ready");
            Some(client)
        }
        Err(err) => {
            warn!(error = %err, "redis unavailable — continuing without live cache");
            None
        }
    };

    let state = Arc::new(AppState {
        pool,
        redis,
        kafka_topic: kafka_topic.clone(),
        direct_reports,
    });

    let state_for_consumer = Arc::clone(&state);
    let brokers_for_consumer = kafka_brokers.clone();
    tokio::spawn(async move {
        run_consumer(state_for_consumer, brokers_for_consumer, kafka_topic).await;
    });

    let app = Router::new()
        .route("/health", get(health))
        .route("/api/metrics/summary", get(metrics_summary))
        .route("/metrics/summary", get(metrics_summary))
        .route("/api/telemetry/summary", get(telemetry_summary))
        .route("/telemetry/summary", get(telemetry_summary))
        .route("/api/direct-reports", get(list_direct_reports))
        .route("/direct-reports", get(list_direct_reports))
        .route("/api/events", get(list_events))
        .route("/events", get(list_events))
        .route("/api/pull-requests", get(list_pull_requests))
        .route("/pull-requests", get(list_pull_requests))
        .route("/api/brain/refresh", post(brain_refresh_stub))
        .route("/brain/refresh", post(brain_refresh_stub))
        .route("/api/events/stream", get(events_stream))
        .route("/events/stream", get(events_stream))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .with_state((*state).clone());

    let plain_addr = SocketAddr::from(([0, 0, 0, 0], port));

    if mtls_enabled() {
        let mtls_port: u16 = env::var("ANALYZER_MTLS_PORT")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(8084);
        let mtls_addr = SocketAddr::from(([0, 0, 0, 0], mtls_port));
        let app_mtls = app.clone();
        tokio::spawn(async move {
            serve(app_mtls, mtls_addr, Some("analyzer")).await;
        });
        serve(app, plain_addr, None).await;
    } else {
        serve(app, plain_addr, None).await;
    }
}
