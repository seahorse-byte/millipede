# Work Alignment — Reference Only

> **This document is a reading map, not a build spec.** Team Radar ships the PDF architecture (SolidJS + TanStack, Rust/Axum, Python LLM, Kafka, WASM redaction). Work repos inform patterns and EM portfolio narrative only.

## Local repos

| Repo | Path | Reference for |
|------|------|---------------|
| maverick | `~/Documents/OLSI/DEV/snyk/@code/maverick` | LangGraph agent, pydantic-evals CI, OTel/Traceloop |
| maverick-ui | `~/Documents/OLSI/DEV/snyk/@code/maverick-ui` | BFF deep-dive (Book 3.11), Playwright e2e patterns |
| ai-pentest | `~/Documents/OLSI/DEV/snyk/@code/ai-pentest` | API/worker trust boundary, ADR discipline |
| ai-pentest-agent | `~/Documents/OLSI/DEV/snyk/@code/ai-pentest-agent` | Multi-agent chain, eval benchmarks |

## Borrow for Stage 5 / Book 7

| Pattern | Where in Millipede |
|---------|-------------------|
| pydantic-evals CI gate | `evals/` |
| OTel metrics + LLM spans | Stage 5 observability |
| Playwright smoke e2e | `e2e/` vs SolidJS dashboard |
| API/worker trust boundary | Book 7 narrative, `ApiWorkerSplit` widget |
| BFF pattern explanation | Book 3.11 — **not shipped** |

## Do NOT reshape core stack

| Work pattern | Millipede decision |
|--------------|-------------------|
| React + MobX dashboard | SolidJS + TanStack (PDF6) |
| Express BFF | Rust gateway only (Book 3.11 deep-dive) |
| Python FastAPI replacing Rust | Rust ingestion/analyzer/gateway |
| Go rewrite, Cerberus, Tilt/K8s | Docker Compose local stack |
| OAuth enterprise auth | JWT gateway for teaching |

## Pattern judgment (Book 7.8)

Snyk's stack is sound for enterprise constraints (Cerberus, entitlements, hidden API). Team Radar's PDF architecture is sound for teaching event-driven design, security boundaries, and AI enrichment without copying the most enterprise-shaped path.

Your value as SEM/Staff is **when to choose which pattern** — not copy-paste across contexts.
