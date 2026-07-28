# Stage 3 — Python LLM enrichment worker

Chained consumer: **`raw-dev-events` → enrich → `enriched-dev-events` → analyzer → Postgres**.

The worker runs a LangGraph-style sequential pipeline (parse → score → stamp). By default it uses fast heuristics — no API key required. Set `OPENAI_API_KEY` to use an LLM instead.

## Setup

```bash
cd services/llm-worker
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
# optional LLM mode:
# pip install -e ".[openai]"
```

From repo root:

```bash
pnpm llm-worker:dev
```

## Run Stage 3 stack

```bash
pnpm compose:up

# terminal 1 — enrichment worker
pnpm llm-worker:dev

# terminal 2 — analyzer (consumes enriched-dev-events)
pnpm analyzer:dev

# terminal 3 — ingestion
pnpm ingestion:dev

curl -X POST http://localhost:8081/webhooks/hello \
  -H 'Content-Type: application/json' \
  -d '{"action":"opened","source":"github","title":"ship feature"}'

psql postgres://millipede:millipede@localhost:5432/team_radar \
  -c "SELECT id, source, sentiment, risk_score, enriched_at FROM team_events ORDER BY created_at DESC LIMIT 5;"
```

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `KAFKA_BROKERS` | `localhost:9092` | Kafka bootstrap |
| `KAFKA_INPUT_TOPIC` | `raw-dev-events` | Raw events from ingestion |
| `KAFKA_OUTPUT_TOPIC` | `enriched-dev-events` | Enriched output for analyzer |
| `LLM_WORKER_GROUP` | `millipede-llm-worker` | Consumer group |
| `OPENAI_API_KEY` | — | Optional LLM scoring |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model when API key set |

## Enriched event shape

```json
{
  "id": "uuid",
  "source": "github",
  "payload": { "action": "opened" },
  "sentiment": 0.667,
  "risk_score": 0.0,
  "enriched_at": "2026-07-28T15:00:00+00:00",
  "enrichment_notes": ["parsed", "scored", "stamped"]
}
```

Stage 4 will surface `sentiment` and `risk_score` on the SolidJS dashboard.
