# Stage 3: Python LLM Kafka consumer (LangGraph-style)

Consumes `raw-dev-events`, enriches with sentiment + risk scores, publishes `enriched-dev-events`.

See [`docs/stage3-llm-worker.md`](../../docs/stage3-llm-worker.md) for setup and runbook.

```bash
pnpm llm-worker:dev
```
