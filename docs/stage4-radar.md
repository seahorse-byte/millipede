# Stage 4 — SolidJS dashboard + WASM redaction

Manager dashboard at `apps/radar/` with TanStack Query, TanStack Router, Redis live feed, and WASM PII redaction for the 1:1 portal.

## Prerequisites

```bash
# one-time
cargo install wasm-pack   # if not already installed
pnpm install
pnpm build:wasm
```

## Run Stage 4 stack

```bash
pnpm compose:up

# backend pipeline
pnpm llm-worker:dev
pnpm analyzer:dev
pnpm ingestion:dev

# dashboard (proxies /api → analyzer :8082)
pnpm dev:radar
```

Open **http://localhost:5174**

- `/` — metrics summary (TanStack Query, 5s refresh) + live Redis SSE feed
- `/1on1` — 1:1 notes sanitized locally via `@millipede/redact-wasm`

## Trigger a live event

```bash
curl -X POST http://localhost:8081/webhooks/hello \
  -H 'Content-Type: application/json' \
  -d '{"action":"opened","source":"github","title":"ship feature"}'
```

The dashboard live feed should update within a second when Redis is available.

## Gateway mode (optional)

By default Vite proxies to plain analyzer `:8082` (no JWT). For Stage 2 gateway:

```bash
VITE_API_BASE=https://localhost:8443 \
VITE_JWT="$(cargo run -q -p millipede-gateway --bin mint-dev-jwt)" \
pnpm dev:radar
```

Metrics calls include `Authorization: Bearer`. SSE through gateway is not wired yet — use the Vite proxy for live events during local dev.

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `RADAR_API_PROXY` | `http://127.0.0.1:8082` | Vite dev proxy target |
| `VITE_API_BASE` | `` | Override API origin (gateway mode) |
| `VITE_JWT` | — | Bearer token for gateway metrics |

## Architecture

```
SolidJS radar (:5174)
  ├─ TanStack Query → GET /api/metrics/summary
  ├─ EventSource → GET /api/events/stream (Redis pub/sub)
  └─ WASM redact_pii_deterministic (1:1 portal, browser-local)
```

Stage 5 adds eval CI, OTel, and Playwright e2e over this UI.

**Demo replay:** [`docs/millipede-demo-replay.md`](millipede-demo-replay.md) — tmux layout + curl script to test the full pipeline in the UI.
