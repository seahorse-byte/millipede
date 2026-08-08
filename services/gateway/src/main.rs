use axum::{
    body::Body,
    extract::{Request, State},
    http::{header, StatusCode},
    middleware::{self, Next},
    response::Response,
    routing::{any, get},
    Json, Router,
};
use axum_server::tls_rustls::RustlsConfig;
use futures_util::StreamExt;
use jsonwebtoken::{decode, DecodingKey, Validation};
use millipede_gateway::Claims;
use millipede_tls_common::{build_public_server_config, certs_dir, ensure_crypto_provider, mtls_enabled};
use reqwest::Client;
use serde::Serialize;
use std::{env, io, net::SocketAddr, time::Duration};
use tower_http::cors::{Any, CorsLayer};
use tracing::{info, warn};

#[derive(Clone)]
struct AppState {
    http_client: Client,
    jwt_secret: String,
    ingestion_base: String,
    analyzer_base: String,
}

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    service: &'static str,
    mtls: bool,
}

fn jwt_secret() -> String {
    env::var("JWT_SECRET").unwrap_or_else(|_| "millipede-dev-secret".into())
}

fn bearer_token(req: &Request) -> Option<String> {
    if let Some(auth) = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
    {
        if let Some(token) = auth.strip_prefix("Bearer ") {
            return Some(token.to_string());
        }
    }

    let query = req.uri().query()?;
    for pair in query.split('&') {
        let mut parts = pair.splitn(2, '=');
        if parts.next()? == "access_token" {
            return parts.next().map(str::to_string);
        }
    }
    None
}

fn build_http_client() -> Client {
    if !mtls_enabled() {
        return Client::builder()
            .timeout(Duration::from_secs(10))
            .build()
            .expect("reqwest client");
    }

    let dir = certs_dir();
    let cert = std::fs::read(dir.join("gateway.pem")).expect("read gateway cert");
    let key = std::fs::read(dir.join("gateway-key.pem")).expect("read gateway key");
    let ca = std::fs::read(dir.join("ca.pem")).expect("read ca cert");
    let identity = reqwest::Identity::from_pem(&[cert.as_slice(), key.as_slice()].concat())
        .expect("gateway identity");
    let ca = reqwest::Certificate::from_pem(&ca).expect("ca cert");

    Client::builder()
        .timeout(Duration::from_secs(10))
        .use_rustls_tls()
        .identity(identity)
        .add_root_certificate(ca)
        .build()
        .expect("mtls reqwest client")
}

async fn require_manager_jwt(
    State(state): State<AppState>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let token = bearer_token(&req).ok_or(StatusCode::UNAUTHORIZED)?;

    let validation = Validation::default();
    let claims = decode::<Claims>(
        &token,
        &DecodingKey::from_secret(state.jwt_secret.as_bytes()),
        &validation,
    )
    .map_err(|_| StatusCode::UNAUTHORIZED)?;

    if claims.claims.scope != "team_radar:manager" {
        return Err(StatusCode::FORBIDDEN);
    }

    req.extensions_mut().insert(claims.claims);
    Ok(next.run(req).await)
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        service: "millipede-gateway",
        mtls: mtls_enabled(),
    })
}

fn strip_access_token_query(query: Option<&str>) -> String {
    let Some(raw) = query else {
        return String::new();
    };
    let filtered: Vec<&str> = raw
        .split('&')
        .filter(|pair| !pair.starts_with("access_token="))
        .collect();
    if filtered.is_empty() {
        String::new()
    } else {
        format!("?{}", filtered.join("&"))
    }
}

async fn proxy(
    state: &AppState,
    req: Request,
    backend_base: &str,
) -> Result<Response, StatusCode> {
    let path = req
        .uri()
        .path()
        .strip_prefix("/api")
        .unwrap_or(req.uri().path());
    let query = strip_access_token_query(req.uri().query());
    let target = format!("{backend_base}{path}{query}");

    let method = req.method().clone();
    let headers = req.headers().clone();
    let body = axum::body::to_bytes(req.into_body(), 1024 * 1024)
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?;

    let mut builder = state.http_client.request(method, target);
    for (name, value) in headers.iter() {
        if name == header::HOST || name == header::AUTHORIZATION {
            continue;
        }
        builder = builder.header(name, value);
    }

    let upstream = builder
        .body(body)
        .send()
        .await
        .map_err(|err| {
            warn!(error = %err, "upstream request failed");
            StatusCode::BAD_GATEWAY
        })?;

    let status = upstream.status();
    let upstream_headers = upstream.headers().clone();
    let bytes = upstream.bytes().await.map_err(|_| StatusCode::BAD_GATEWAY)?;
    let mut response = Response::new(Body::from(bytes));
    *response.status_mut() = status;
    for (name, value) in upstream_headers.iter() {
        if name == header::TRANSFER_ENCODING || name == header::CONNECTION {
            continue;
        }
        response.headers_mut().insert(name, value.clone());
    }
    Ok(response)
}

async fn proxy_stream(
    state: &AppState,
    req: Request,
    backend_base: &str,
) -> Result<Response, StatusCode> {
    let path = req
        .uri()
        .path()
        .strip_prefix("/api")
        .unwrap_or(req.uri().path());
    let query = strip_access_token_query(req.uri().query());
    let target = format!("{backend_base}{path}{query}");

    let method = req.method().clone();
    let headers = req.headers().clone();

    let mut builder = state.http_client.request(method, target);
    for (name, value) in headers.iter() {
        if name == header::HOST || name == header::AUTHORIZATION {
            continue;
        }
        builder = builder.header(name, value);
    }

    let upstream = builder.send().await.map_err(|err| {
        warn!(error = %err, "upstream stream request failed");
        StatusCode::BAD_GATEWAY
    })?;

    let status = upstream.status();
    let upstream_headers = upstream.headers().clone();
    let stream = upstream.bytes_stream().map(|result| {
        result.map_err(|err| io::Error::new(io::ErrorKind::Other, err))
    });
    let mut response = Response::new(Body::from_stream(stream));
    *response.status_mut() = status;
    for (name, value) in upstream_headers.iter() {
        if name == header::TRANSFER_ENCODING || name == header::CONNECTION {
            continue;
        }
        response.headers_mut().insert(name, value.clone());
    }
    Ok(response)
}

async fn proxy_ingestion(State(state): State<AppState>, req: Request) -> Result<Response, StatusCode> {
    proxy(&state, req, &state.ingestion_base).await
}

async fn proxy_analyzer(State(state): State<AppState>, req: Request) -> Result<Response, StatusCode> {
    proxy(&state, req, &state.analyzer_base).await
}

async fn proxy_analyzer_stream(
    State(state): State<AppState>,
    req: Request,
) -> Result<Response, StatusCode> {
    proxy_stream(&state, req, &state.analyzer_base).await
}

#[tokio::main]
async fn main() {
    ensure_crypto_provider();
    tracing_subscriber::fmt()
        .with_env_filter(
            env::var("RUST_LOG").unwrap_or_else(|_| "millipede_gateway=info,tower_http=info".into()),
        )
        .init();

    let ingestion_base = if mtls_enabled() {
        env::var("INGESTION_MTLS_URL").unwrap_or_else(|_| "https://127.0.0.1:8083".into())
    } else {
        env::var("INGESTION_URL").unwrap_or_else(|_| "http://127.0.0.1:8081".into())
    };

    let analyzer_base = if mtls_enabled() {
        env::var("ANALYZER_MTLS_URL").unwrap_or_else(|_| "https://127.0.0.1:8084".into())
    } else {
        env::var("ANALYZER_URL").unwrap_or_else(|_| "http://127.0.0.1:8082".into())
    };

    let state = AppState {
        http_client: build_http_client(),
        jwt_secret: jwt_secret(),
        ingestion_base,
        analyzer_base,
    };

    let protected = Router::new()
        .route("/api/webhooks/{*rest}", any(proxy_ingestion))
        .route("/api/metrics/{*rest}", any(proxy_analyzer))
        .route("/api/events/{*rest}", any(proxy_analyzer_stream))
        .route_layer(middleware::from_fn_with_state(state.clone(), require_manager_jwt));

    let app = Router::new()
        .route("/health", get(health))
        .merge(protected)
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .with_state(state);

    let port: u16 = env::var("GATEWAY_PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8443);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));

    if mtls_enabled() {
        let dir = certs_dir();
        let tls = build_public_server_config("gateway", &dir).expect("gateway tls config");
        let rustls = RustlsConfig::from_config(tls);
        info!(%addr, "gateway listening with HTTPS (JWT at edge, mTLS to backends)");
        axum_server::bind_rustls(addr, rustls)
            .serve(app.into_make_service())
            .await
            .expect("gateway failed");
    } else {
        info!(%addr, "gateway listening with HTTP (dev mode — set MILLIPEDE_MTLS=1 for Stage 2)");
        let listener = tokio::net::TcpListener::bind(addr).await.expect("bind failed");
        axum::serve(listener, app).await.expect("gateway failed");
    }
}
