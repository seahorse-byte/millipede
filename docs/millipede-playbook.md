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
| `pnpm brain:refresh` | Team Brain | Regenerate `docs/team-brain/generated/` from analyzer APIs |
| `pnpm sync:github` | Connectors | Poll GitHub PRs/reviews for roster members → ingestion |
| `pnpm sync:gitlab` | Connectors | Stub — GitLab MR sync (instructions only) |
| `pnpm sync:jira` | Connectors | Stub — Jira issue sync (instructions only) |
| `pnpm sync:slack` | Connectors | Stub — Slack channel sync (instructions only) |
| `pnpm connectors:watch` | Connectors | Poll enabled connectors every N minutes (see `.env.local`) |

### Helper scripts (`scripts/`)

| Script | Purpose |
|--------|---------|
| `millipede-demo-tmux.sh` | Creates tmux session, splits panes, runs commands above |
| `seed-demo-events.sh` | Seeds Slack/Jira/GitHub/GitLab activity + cross-repo PRs |
| `brain-writer/run.sh` | Regenerates Team Brain docs from analyzer APIs |
| `connectors/sync-github.mjs` | Polls GitHub API; posts normalized PR/review events |
| `connectors/watch.mjs` | Interval runner for all enabled connectors |
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

---

## Team Brain (living docs)

**Operator checklist:** [`docs/team-brain/QUICKSTART.md`](team-brain/QUICKSTART.md) — step-by-step local setup.

Local EM documentation that auto-updates from analyzer data — per-direct-report snapshots, source rollups, PR table, and **per-source freshness receipts**.

```bash
pnpm seed:demo          # optional: seed demo data first
# wait ~5s for pipeline
pnpm brain:refresh
```

| Output | Path |
|--------|------|
| Index + KPIs | `docs/team-brain/generated/README.md` |
| Per person | `docs/team-brain/generated/direct-reports/{id}.md` |
| Per source | `docs/team-brain/generated/sources/{source}.md` |
| Open PRs | `docs/team-brain/generated/pull-requests.md` |
| Freshness receipts | `docs/team-brain/generated/brain-state.json` |
| Vault mirror | `~/.claude/millipede-brain/` |

`generated/` is gitignored; templates and guide live in `docs/team-brain/`.

**Auto-refresh after seed:** `BRAIN_REFRESH=1 pnpm seed:demo` (waits for pipeline, then runs brain-writer).

**Analyzer stub:** `POST /api/brain/refresh` returns instructions until in-process trigger is wired.

**Related brains:** operator-brain (org/pillars) · cos-evo-brain (COS product memory) — Team Brain is the millipede-local EM lens. Plan: `~/.claude/plans/millipede-living-team-brain.md`.

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

## Connect real team data (local)

Replace demo seed with live connectors — no cloud deploy required.

### 1. Configure roster and sources

```bash
# Roster handles (GitHub login, GitLab username, Slack user ID, Jira accountId)
edit config/direct-reports.json

# Repos / projects / channels to watch
edit config/team-sources.json
```

### 2. Add tokens

```bash
cp .env.example .env.local
# GITHUB_TOKEN — PAT with repo read (see .env.example comments)
```

Never commit `.env.local` — it is gitignored.

### 3. Sync (stack must be running)

```bash
pnpm sync:github          # working — PRs + reviews for direct reports
pnpm sync:gitlab          # stub (prints setup steps)
pnpm sync:jira            # stub
pnpm sync:slack           # stub

# Optional: poll every 5 minutes while stack is up
pnpm connectors:watch
```

Dry-run without POSTing: `node scripts/connectors/sync-github.mjs --dry-run`

### 4. Verify in Radar

Open http://127.0.0.1:5174 — use direct-report filter and **Pull requests** tab. Events appear ~5s after Postgres write. `sync:github` and `connectors:watch` auto-run `pnpm brain:refresh` unless `BRAIN_REFRESH=0`.

**Webhook alternative (optional):** Expose `:8081` via `cloudflared tunnel --url http://127.0.0.1:8081` and point GitHub/GitLab webhooks at `/webhooks/github`. Polling is simpler for local-only use.

Full connector plan: `~/.claude/plans/millipede-local-team-connectors.md` · `scripts/connectors/README.md`

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
| [`team-brain/README.md`](team-brain/README.md) | Living EM docs + freshness receipts |
