# Stage 2 — JWT gateway + mTLS (local dev)

**Do not use these certificates in production.** Generated for learning only.

## Generate certificates

```bash
bash infra/certs/generate-dev-certs.sh
```

Creates `infra/certs/dev/`:

| File | Role |
|------|------|
| `ca.pem` | Trust anchor |
| `gateway.pem` / `gateway-key.pem` | Gateway TLS + client identity to backends |
| `ingestion.pem` / `ingestion-key.pem` | Ingestion mTLS server |
| `analyzer.pem` / `analyzer-key.pem` | Analyzer mTLS server |

## Run Stage 2 stack

```bash
pnpm compose:up

# Terminal 1 — analyzer (plain :8082 + mTLS :8084)
MILLIPEDE_MTLS=1 cargo run -p millipede-analyzer

# Terminal 2 — ingestion (plain :8081 + mTLS :8083)
MILLIPEDE_MTLS=1 cargo run -p millipede-ingestion

# Terminal 3 — gateway (HTTPS :8443, JWT required)
MILLIPEDE_MTLS=1 cargo run -p millipede-gateway
```

## Mint a dev JWT

```bash
cargo run -p millipede-gateway --bin mint-dev-jwt
export TOKEN="$(cargo run -q -p millipede-gateway --bin mint-dev-jwt)"
```

## Call through the gateway

```bash
curl -sk https://localhost:8443/health

curl -sk https://localhost:8443/api/metrics/summary \
  -H "Authorization: Bearer $TOKEN"

curl -sk https://localhost:8443/api/webhooks/hello \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"opened","source":"github"}'
```

Direct backend access (Stage 1 compat) still works on plain HTTP ports when services run with `MILLIPEDE_MTLS=1` — both listeners are active. Stage 3+ will tighten this.

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `MILLIPEDE_MTLS` | off | Enable mTLS listeners on services |
| `MILLIPEDE_CERTS_DIR` | `infra/certs/dev` | PEM directory |
| `JWT_SECRET` | `millipede-dev-secret` | HS256 signing key |
| `GATEWAY_PORT` | `8443` | Gateway HTTPS port |
| `INGESTION_MTLS_PORT` | `8083` | Ingestion mTLS |
| `ANALYZER_MTLS_PORT` | `8084` | Analyzer mTLS |
