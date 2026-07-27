use axum::{
    extract::State,
    routing::{get, post},
    Json, Router,
};
use axum_server::tls_rustls::RustlsConfig;
use millipede_tls_common::{build_mtls_server_config, certs_dir, ensure_crypto_provider, mtls_enabled};
use rdkafka::config::ClientConfig;
use rdkafka::producer::{FutureProducer, FutureRecord};
use serde::{Deserialize, Serialize};
use std::{env, net::SocketAddr, sync::Arc, time::Duration};
use tracing::{info, warn};

#[derive(Clone)]
struct AppState {
    producer: Option<Arc<FutureProducer>>,
    kafka_topic: String,
}

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    service: &'static str,
}

#[derive(Serialize)]
struct WebhookResponse {
    accepted: bool,
    event_id: String,
    topic: Option<String>,
    kafka_status: &'static str,
}

#[derive(Deserialize)]
struct WebhookPayload {
    source: Option<String>,
    #[serde(flatten)]
    extra: serde_json::Value,
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        service: "millipede-ingestion",
    })
}

async fn github_webhook(
    State(state): State<AppState>,
    Json(payload): Json<WebhookPayload>,
) -> Json<WebhookResponse> {
    let event_id = uuid::Uuid::new_v4().to_string();
    let source = payload.source.unwrap_or_else(|| "github".to_string());
    let message = serde_json::json!({
        "id": event_id,
        "source": source,
        "payload": payload.extra,
    });

    let (topic, kafka_status) = if let Some(producer) = &state.producer {
        let payload_str = message.to_string();
        match producer
            .send(
                FutureRecord::to(&state.kafka_topic)
                    .payload(&payload_str)
                    .key(&event_id),
                Duration::from_secs(5),
            )
            .await
        {
            Ok(_) => {
                info!(event_id = %event_id, topic = %state.kafka_topic, "published event");
                (Some(state.kafka_topic.clone()), "published")
            }
            Err((err, _)) => {
                warn!(error = %err, "kafka publish failed — accepting webhook for local dev");
                (None, "unavailable")
            }
        }
    } else {
        info!(event_id = %event_id, "kafka disabled — accepted webhook only");
        (None, "disabled")
    };

    Json(WebhookResponse {
        accepted: true,
        event_id,
        topic,
        kafka_status,
    })
}

async fn serve(app: Router, addr: SocketAddr, mtls_service: Option<&str>) {
    if let Some(name) = mtls_service {
        let dir = certs_dir();
        let tls = build_mtls_server_config(name, &dir).expect("mtls config");
        let rustls = RustlsConfig::from_config(tls);
        info!(%addr, service = name, "ingestion listening with mTLS");
        axum_server::bind_rustls(addr, rustls)
            .serve(app.into_make_service())
            .await
            .expect("mTLS server failed");
    } else {
        info!(%addr, "ingestion listening (plain HTTP)");
        let listener = tokio::net::TcpListener::bind(addr).await.expect("bind failed");
        axum::serve(listener, app).await.expect("server failed");
    }
}

#[tokio::main]
async fn main() {
    ensure_crypto_provider();
    tracing_subscriber::fmt()
        .with_env_filter(
            env::var("RUST_LOG").unwrap_or_else(|_| "millipede_ingestion=info,tower_http=info".into()),
        )
        .init();

    let kafka_brokers = env::var("KAFKA_BROKERS").unwrap_or_else(|_| "localhost:9092".into());
    let kafka_topic = env::var("KAFKA_TOPIC").unwrap_or_else(|_| "raw-dev-events".into());
    let port: u16 = env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8081);

    let producer = match ClientConfig::new()
        .set("bootstrap.servers", &kafka_brokers)
        .set("message.timeout.ms", "5000")
        .create::<FutureProducer>()
    {
        Ok(p) => {
            info!(brokers = %kafka_brokers, topic = %kafka_topic, "kafka producer ready");
            Some(Arc::new(p))
        }
        Err(err) => {
            warn!(error = %err, "kafka unavailable — running in accept-only mode");
            None
        }
    };

    let state = AppState {
        producer,
        kafka_topic,
    };

    let app = Router::new()
        .route("/health", get(health))
        .route("/webhooks/github", post(github_webhook))
        .route("/webhooks/hello", post(github_webhook))
        .with_state(state);

    let plain_addr = SocketAddr::from(([0, 0, 0, 0], port));

    if mtls_enabled() {
        let mtls_port: u16 = env::var("INGESTION_MTLS_PORT")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(8083);
        let mtls_addr = SocketAddr::from(([0, 0, 0, 0], mtls_port));
        let app_mtls = app.clone();
        tokio::spawn(async move {
            serve(app_mtls, mtls_addr, Some("ingestion")).await;
        });
        serve(app, plain_addr, None).await;
    } else {
        serve(app, plain_addr, None).await;
    }
}
