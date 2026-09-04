# Millipede operator playbook

**One command** to run the full Team Radar stack in tmux, plus a reference for what every command does.

Canonical repo path (adjust if yours differs):

```text
/Users/olsigjeci/Documents/OLSI/DEV/olab/millipede
```

---

## One command start

```bash
cd /Users/olsigjeci/Documents/OLSI/DEV/olab/millipede
pnpm millipede-demo
```

Aliases: `pnpm demo:tmux` · `bash scripts/millipede-demo-tmux.sh`

**Prerequisites before first run:**

| Requirement | Check |
|-------------|--------|
| Docker Desktop running | `docker ps` returns without hanging |
| Node + pnpm | `pnpm install` once per clone |
| WASM built | `pnpm build:wasm` once (1:1 portal) |
| Rust toolchain | `cargo` available for ingestion/analyzer |

**Attach later:** `tmux attach -t millipede`

**Stop everything:** `tmux kill-session -t millipede` then `pnpm compose:down`

---

## Tmux layout

```text
session: millipede
┌─ window: pipeline ─────────────────────────────────────────┐
│ ┌─ compose ──────┐ ┌─ ingestion (:8081) ─────────────────┐ │
│ │ docker stack   │ │ webhook API                         │ │
│ ├─ llm-worker ───┤ ├─ analyzer (:8082) ──────────────────┤ │
│ │ enrich scores  │ │ kafka → postgres + redis            │ │
│ └────────────────┘ └─────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
┌─ window: ui ───────────────────────────────────────────────┐
│ ┌─ radar (:5174) ────────────────────────────────────────┐ │
│ │ SolidJS dashboard (Vite)                               │ │
│ ├─ test shell ─────────────────────────────────────────┤ │
│ │ curl / evals — run AFTER "Ready" banner              │ │
│ └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

**Readiness rule:** Do not fire webhooks until the **test shell** pane prints `Ready` and health curls succeed.

---

## What each pane runs (command reference)

### Window `pipeline`

| Pane | Command | What it does |
|------|---------|----------------|
| **compose** | `pnpm compose:down && pnpm compose:up` | Stops old containers, starts **Kafka** `:9092`, **Postgres** `:5432`, **Redis** `:6379` via `infra/docker/docker-compose.yml` |
| | `bash scripts/wait-for-kafka.sh` | Blocks until Kafka answers `kafka-topics.sh --list` |
| | *(inside compose:up)* `bash scripts/init-kafka-topics.sh` | Creates `raw-dev-events` and `enriched-dev-events` topics |
| **ingestion** | `bash scripts/wait-for-kafka.sh` | Waits for Kafka before starting |
| | `pnpm ingestion:dev` | Rust Axum on **:8081** — accepts `POST /webhooks/hello`, publishes to Kafka `raw-dev-events` |
| **llm-worker** | `bash scripts/wait-for-kafka.sh` | Waits for Kafka |
| | `pnpm llm-worker:dev` | Python consumer — reads `raw-dev-events`, adds sentiment/risk, writes `enriched-dev-events` |
| **analyzer** | `bash scripts/wait-for-kafka.sh` | Waits for Kafka |
| | `pnpm analyzer:dev` | Rust service on **:8082** — consumes `enriched-dev-events`, writes Postgres `team_events`, publishes Redis `team_radar:events`, serves `/api/metrics/summary` + SSE |

### Window `ui`

| Pane | Command | What it does |
|------|---------|----------------|
| **radar** | `bash scripts/wait-for-health.sh` | Polls `:8081/health` and `:8082/health` until both OK |
| | `pnpm dev:radar` | Vite dev server on **http://127.0.0.1:5174** — proxies `/api/*` → analyzer `:8082` |
| **tests** | `bash scripts/wait-for-health.sh` | Same gate — then prints curl cheat sheet |

---

## `pnpm` / script glossary

| Command | Layer | Purpose |
|---------|-------|---------|
| `pnpm install` | Monorepo | Install Node deps (academy, radar, e2e, widgets) |
| `pnpm compose:up` | Infra | Docker up + Kafka topics init |
| `pnpm compose:down` | Infra | Stop Kafka, Postgres, Redis |
| `pnpm ingestion:dev` | Rust | `cargo run -p millipede-ingestion` |
| `pnpm analyzer:dev` | Rust | `cargo run -p millipede-analyzer` |
| `pnpm llm-worker:dev` | Python | venv in `services/llm-worker/.venv` (auto-recreates if broken) |
| `pnpm dev:radar` | SolidJS | Team Radar UI |
| `pnpm build:wasm` | WASM | Build `@millipede/redact-wasm` for 1:1 portal |
| `pnpm evals:run` | Quality | Run enrichment regression gate (`evals/run_evals.py`) |
| `pnpm evals:write-metrics` | Quality | Write eval pass rate → Postgres → dashboard KPI |
| `pnpm millipede-demo` | Ops | Launch tmux session with full stack |
| `pnpm seed:demo` | Demo | Post activity + PR events for 5 direct reports (4 sources) |

### Helper scripts (`scripts/`)

| Script | Purpose |
|--------|---------|
| `millipede-demo-tmux.sh` | Creates tmux session, splits panes, runs commands above |
| `seed-demo-events.sh` | Seeds Slack/Jira/GitHub/GitLab activity + cross-repo PRs |
| `wait-for-kafka.sh` | Poll Kafka until broker ready |
| `init-kafka-topics.sh` | Create `raw-dev-events` + `enriched-dev-events` |
| `wait-for-health.sh` | Poll ingestion + analyzer `/health` |

---

## Startup sequence (why order matters)

```text
1. Docker (compose)     → Kafka, Postgres, Redis
2. init-kafka-topics    → topics exist before consumers subscribe
3. analyzer :8082       → radar API + SSE backend
4. llm-worker         → enrichment chain
5. ingestion :8081      → accepts webhooks
6. wait-for-health      → gate before radar
7. dev:radar :5174      → UI
8. curl webhook         → real data flows
```

The automated tmux script enforces waits; manual runs must follow the same gates.

---

## After "Ready" — send data

```bash
# Health (must return status ok)
curl -s http://127.0.0.1:8082/health | jq '{redis, database}'
curl -s http://127.0.0.1:8081/health | jq

# Webhook → full pipeline
curl -s -X POST http://127.0.0.1:8081/webhooks/hello \
  -H 'Content-Type: application/json' \
  -d '{"action":"opened","source":"github","title":"ship feature for demo"}' | jq
```

**Success:** `"kafka_status": "published"`

**Open UI:** http://127.0.0.1:5174/

**Seed demo team data** (after Ready):

```bash
pnpm seed:demo
```

Edit `config/direct-reports.json` with your team's GitHub/GitLab/Slack/Jira handles (see `config/README.md`).

| UI area | Updates when |
|---------|----------------|
| Manager KPIs + stat cards | ~5s poll after Postgres write |
| Direct report filter + source chips | Immediate — filters activity feed |
| **Pull requests** tab | Cross-repo GitHub + GitLab PRs/MRs |
| Activity stream (SSE) | Only non-PR events while dashboard tab is **open** |

Optional eval KPI:

```bash
pnpm evals:write-metrics
```

---

## Manual start (no tmux)

Use when debugging one service at a time:

```bash
cd /Users/olsigjeci/Documents/OLSI/DEV/olab/millipede
pnpm compose:up
pnpm analyzer:dev      # terminal 1
pnpm llm-worker:dev    # terminal 2
pnpm ingestion:dev     # terminal 3
pnpm dev:radar         # terminal 4 — after wait-for-health.sh passes
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `kafka_status: unavailable` | Kafka not up or topics missing | `pnpm compose:up` · `bash scripts/init-kafka-topics.sh` |
| `UNKNOWN_TOPIC_OR_PART raw-dev-events` | Topics not created | `bash scripts/init-kafka-topics.sh` · restart llm-worker |
| `ECONNREFUSED 127.0.0.1:8082` | Analyzer not running yet | Wait for analyzer pane · `pnpm analyzer:dev` |
| `bad interpreter` on llm-worker | Stale `.venv` after Python upgrade | `rm -rf services/llm-worker/.venv` · `pnpm llm-worker:dev` |
| Empty dashboard | No analyzer or no events | Health check + webhook with `kafka_status: published` |
| `docker ps` hangs | Docker Desktop not running | Start Docker Desktop |
| Session already exists | Previous demo still running | `tmux attach -t millipede` or `tmux kill-session -t millipede` |

---

## Teardown

```bash
# In each tmux pane: Ctrl+C, or:
pkill -f millipede-analyzer
pkill -f millipede-ingestion
pkill -f millipede_llm_worker

pnpm compose:down
tmux kill-session -t millipede   # optional
```

---

## Related docs

| Doc | Use for |
|-----|---------|
| [`millipede-demo-replay.md`](millipede-demo-replay.md) | Live demo script + UI walkthrough |
| [`millipede-e2e-map.md`](millipede-e2e-map.md) | Architecture map |
| [`stage4-radar.md`](stage4-radar.md) | Radar dev + gateway mode |
| [`stage5-quality.md`](stage5-quality.md) | Eval CI + e2e |
