# Planning PDFs (Gemini1–6)

The six **God Project** planning PDFs are referenced in Academy lesson **0.9** and the canonical learning plan:

`~/.claude/plans/cursor/millipede_learning_journey_0db313c1.plan.md`

## Expected files

| File | Topic | Maps to |
|------|-------|---------|
| Gemini1 | Monorepo model | Repo layout |
| Gemini2 | Team Radar diagram | Event flow |
| Gemini3 | Rust + Python, Kafka/PG/Redis | `services/`, `infra/docker/` |
| Gemini4 | JWT gateway + mTLS | `services/gateway/`, `infra/certs/` |
| Gemini5 | Chained consumer, 1:1 portal | LLM worker → analyzer |
| Gemini6 | WASM redaction, SolidJS | `packages/redact-wasm/`, `apps/radar/` |

## If PDFs are not in this folder

They are **planning artifacts**, not runtime code. Store copies here when available:

```text
docs/pdfs/Gemini1.pdf … Gemini6.pdf
```

Until then, use:

- [`docs/millipede-e2e-map.md`](../millipede-e2e-map.md) — canonical architecture
- [`docs/academy-status.md`](../academy-status.md) — curriculum progress
- Lesson **0.9** in the Academy — PDF → directory mapping table
