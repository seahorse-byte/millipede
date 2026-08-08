# Millipede

Interactive **Academy** + **DevSecOps Team Radar** monorepo.

| Product | Purpose | Stack |
|---------|---------|-------|
| **Millipede Academy** | Teach fundamentals while you build | Astro → Cloudflare Pages |
| **Team Radar** | Manager dashboard for dev velocity + security risk | SolidJS, Rust/Axum, Python LLM, Kafka |

## Quick start

```bash
pnpm install
pnpm compose:up          # Kafka + Postgres + Redis
pnpm dev:academy         # Academy at http://localhost:4321
cargo run -p millipede-ingestion   # Webhook at :8081
cargo run -p millipede-analyzer    # Kafka → Postgres at :8082/health
```

### Stage 1 pipeline (local)

```bash
pnpm compose:up
cargo run -p millipede-analyzer    # terminal 1
cargo run -p millipede-ingestion   # terminal 2
curl -X POST http://localhost:8081/webhooks/hello \
  -H 'Content-Type: application/json' \
  -d '{"action":"opened","source":"github"}'
psql postgres://millipede:millipede@localhost:5432/team_radar \
  -c "SELECT id, source, left(payload_json, 60) FROM team_events ORDER BY created_at DESC LIMIT 5;"
curl -s http://localhost:8082/api/metrics/summary | jq
docker exec -it docker-redis-1 redis-cli SUBSCRIBE team_radar:events
```

### Stage 2 — JWT gateway + mTLS

See [`docs/stage2-gateway.md`](docs/stage2-gateway.md). Quick path:

```bash
bash infra/certs/generate-dev-certs.sh
pnpm compose:up
MILLIPEDE_MTLS=1 pnpm analyzer:dev    # :8082 plain + :8084 mTLS
MILLIPEDE_MTLS=1 pnpm ingestion:dev   # :8081 plain + :8083 mTLS
MILLIPEDE_MTLS=1 pnpm gateway:dev     # :8443 HTTPS, JWT required
export TOKEN="$(cargo run -q -p millipede-gateway --bin mint-dev-jwt)"
curl -sk https://localhost:8443/api/metrics/summary -H "Authorization: Bearer $TOKEN"
```

### Stage 3 — LLM enrichment worker

See [`docs/stage3-llm-worker.md`](docs/stage3-llm-worker.md). Quick path:

```bash
cd services/llm-worker && python3 -m venv .venv && source .venv/bin/activate && pip install -e .
pnpm compose:up
pnpm llm-worker:dev     # raw-dev-events → enriched-dev-events
pnpm analyzer:dev       # terminal 2
pnpm ingestion:dev      # terminal 3
curl -X POST http://localhost:8081/webhooks/hello \
  -H 'Content-Type: application/json' \
  -d '{"action":"opened","source":"github","title":"ship feature"}'
psql postgres://millipede:millipede@localhost:5432/team_radar \
  -c "SELECT id, sentiment, risk_score, enriched_at FROM team_events ORDER BY created_at DESC LIMIT 3;"
```

### Stage 4 — SolidJS dashboard + WASM redaction

See [`docs/stage4-radar.md`](docs/stage4-radar.md). Quick path:

```bash
cargo install wasm-pack   # once
pnpm install && pnpm build:wasm
pnpm compose:up && pnpm llm-worker:dev & pnpm analyzer:dev & pnpm ingestion:dev &
pnpm dev:radar   # http://localhost:5174
```

### Stage 5 — Quality systems (eval CI + e2e + EM KPIs)

See [`docs/stage5-quality.md`](docs/stage5-quality.md). Quick path:

```bash
pnpm evals:run                              # enrichment regression gate
pnpm build:wasm && pnpm test:e2e              # Playwright smoke vs radar UI
pnpm evals:write-metrics           # → team_metrics → dashboard KPI card
```

## Monorepo layout

```
apps/academy/          Astro site (lessons + widgets)
apps/radar/            SolidJS dashboard (Stage 4–5)
services/ingestion/    Rust Axum → Kafka
services/gateway/      JWT + mTLS gateway (Stage 2)
services/analyzer/     SQLx + Redis (Stage 1+)
services/llm-worker/   Python LLM consumer (Stage 3)
evals/                 Enrichment eval gate (Stage 5)
e2e/                   Playwright smoke tests (Stage 5)
packages/lesson-widgets/   Interactive teaching components
packages/mdx-schema/       Lesson frontmatter types
content/               MDX books 0–7
infra/docker/          Docker Compose stack
docs/                  PDFs + work-alignment reference
```

## Roadmap

| Stage | Deliverable |
|-------|-------------|
| 1 | Webhook → Kafka → Postgres + Redis |
| 2 | JWT gateway + mTLS |
| 3 | Python LLM enrichment |
| 4 | SolidJS + TanStack + WASM redaction |
| 5 | Eval CI, Playwright e2e, EM KPI panels — [`docs/stage5-quality.md`](docs/stage5-quality.md) |

**End-to-end map:** [`docs/millipede-e2e-map.md`](docs/millipede-e2e-map.md) · Demo replay: [`docs/millipede-demo-replay.md`](docs/millipede-demo-replay.md) · **Academy status:** [`docs/academy-status.md`](docs/academy-status.md)

Canonical plan: `millipede_learning_journey_0db313c1.plan.md`
