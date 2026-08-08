use axum::response::sse::{Event, KeepAlive, Sse};
use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
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

#[derive(Deserialize)]
struct RawEvent {
    id: String,
    source: String,
    payload: serde_json::Value,
    sentiment: Option<f64>,
    risk_score: Option<f64>,
    enriched_at: Option<String>,
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
    let payload_json = event.payload.to_string();
    sqlx::query(
        r#"
        INSERT INTO team_events (id, source, payload_json, sentiment, risk_score, enriched_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW()::TEXT)
        ON CONFLICT (id) DO UPDATE SET
            sentiment = EXCLUDED.sentiment,
            risk_score = EXCLUDED.risk_score,
            enriched_at = EXCLUDED.enriched_at
        "#,
    )
    .bind(&event.id)
    .bind(&event.source)
    .bind(payload_json)
    .bind(event.sentiment)
    .bind(event.risk_score)
    .bind(event.enriched_at.as_deref())
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
            info!("postgres pool ready");
            pool
        }
        Err(err) => {
            error!(error = %err, "postgres unavailable — exiting");
            std::process::exit(1);
        }
    };

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
