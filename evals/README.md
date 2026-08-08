# Enrichment eval gate (Stage 5)

Regression suite for the LLM worker heuristic scorer (`enrich_scores`). Mirrors the pydantic-evals CI pattern from work repos without reshaping the stack.

## Run locally

```bash
pnpm evals:run
```

Write pass rate to Postgres (shows on radar KPI panel):

```bash
pnpm evals:write-metrics
```

Requires Postgres from `pnpm compose:up` (writes via `psql`; optional `psycopg[binary]` if you prefer).

## Cases

Edit `enrichment_cases.json` — each case defines payload bounds on `sentiment` and `risk_score`.

## CI

Exit code `1` when any case fails. Wire into GitLab CI or pre-merge checks as Stage 5 matures.
