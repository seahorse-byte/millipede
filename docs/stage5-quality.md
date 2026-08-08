# Stage 5 — Quality systems (eval CI, e2e, EM KPIs)

Stage 5 adds release-quality patterns borrowed from work repos — without reshaping the PDF stack.

## What's new

| Area | Location | Purpose |
|------|----------|---------|
| EM KPI panel | `apps/radar/` dashboard | Friction index, avg sentiment, high-risk count, eval pass rate |
| Enrichment eval gate | `evals/` | Heuristic scorer regression (`pnpm evals:run`) |
| Playwright smoke e2e | `e2e/` | Dashboard shell + WASM 1:1 portal (`pnpm test:e2e`) |
| Gateway SSE | `services/gateway/` | Streaming proxy for `/api/events/stream` + JWT query param |

## Run eval gate

```bash
pnpm evals:run

# Persist pass rate → team_metrics → radar KPI card
pnpm evals:write-metrics   # needs pnpm compose:up (uses psql)
pnpm dev:radar             # refresh dashboard — Eval pass rate updates
```

## Run Playwright e2e

```bash
pnpm install
pnpm build:wasm    # required for 1:1 portal test
pnpm test:e2e
```

Starts radar on `:5174` automatically unless already running.

## Gateway + live feed

SSE through the JWT gateway now streams (no full-buffer proxy). EventSource cannot send `Authorization` headers — pass the dev token as a query param:

```bash
export TOKEN="$(cargo run -q -p millipede-gateway --bin mint-dev-jwt)"
VITE_API_BASE=https://localhost:8443 \
VITE_JWT="$TOKEN" \
pnpm dev:radar
```

The radar client appends `?access_token=…` to the EventSource URL; the gateway strips it before forwarding to analyzer.

For local dev without gateway, keep the default Vite proxy to `:8082`.

## KPI formulas

| Metric | Source |
|--------|--------|
| Friction index | `(1 − avg_sentiment) × 0.6 + avg(risk_score) × 0.4` |
| Avg sentiment | `AVG(sentiment)` from `team_events` |
| High risk | Count where `risk_score ≥ 0.5` |
| Eval pass rate | Latest `team_metrics` row with `metric_type = eval_pass_rate` |

## Next (Book 7 / OTel)

- Optional OTLP export: set `OTEL_EXPORTER_OTLP_ENDPOINT` (LLM worker: `pip install -e '.[otel]'`)
- Analyzer latency: `GET /api/telemetry/summary`
- GitHub Actions: `.github/workflows/ci.yml` runs evals + e2e on every push

**Prior stage:** [`stage4-radar.md`](stage4-radar.md)
