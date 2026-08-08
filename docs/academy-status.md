# Academy catch-up status

**Academy:** `pnpm dev:academy` → http://localhost:4321  
**Radar:** `pnpm dev:radar` → http://localhost:5174

---

## Progress

| Book | Lessons | Status |
|------|---------|--------|
| 0–6 | 62 | ✅ |
| **7** Stage 5 + EM Leadership | **12** (8 + appendix) | ✅ |
| — | — | **Curriculum complete** |

**Total shipped:** 74 lessons (Books 0–7)

---

## Book 7 — complete ✅

KPI dictionary · quality systems · agent eval CI · instructor packet · mock class · EM narrative · work-bridge · React-at-work appendix.

Mirror: `content/book-07-em-leadership/`

---

## Team Radar — Stage 5 complete ✅

| Deliverable | Command |
|-------------|---------|
| Eval gate | `pnpm evals:run` |
| Write KPI | `pnpm evals:write-metrics` |
| Smoke e2e | `pnpm test:e2e` |
| Pipeline e2e | `pnpm compose:up && RUN_PIPELINE_E2E=1 pnpm test:e2e:pipeline` |
| OTel (optional) | `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318` |

Docs: [`docs/stage5-quality.md`](stage5-quality.md)

---

## Full demo

```bash
pnpm millipede-demo
# or
pnpm compose:up
pnpm llm-worker:dev & pnpm analyzer:dev & pnpm ingestion:dev &
pnpm dev:radar
pnpm evals:write-metrics
```

```bash
pnpm build:academy && git push origin main
```
