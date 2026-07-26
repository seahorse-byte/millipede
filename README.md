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

## Monorepo layout

```
apps/academy/          Astro site (lessons + widgets)
apps/radar/            SolidJS dashboard (Stage 4)
services/ingestion/    Rust Axum → Kafka
services/gateway/      JWT + mTLS gateway (Stage 2)
services/analyzer/     SQLx + Redis (Stage 1+)
services/llm-worker/   Python LLM consumer (Stage 3)
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
| 5 | Eval CI, OTel, Playwright e2e |

Canonical plan: `millipede_learning_journey_0db313c1.plan.md`
