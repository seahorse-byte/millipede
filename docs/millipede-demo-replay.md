# Millipede demo replay — tmux + UI walkthrough

Snapshot of the local Stage 1–4 stack: **ingestion → Kafka → llm-worker → analyzer → Postgres/Redis → SolidJS radar UI**.

Use this doc to replay the demo from a clean terminal.

---

## 0. One-time setup

```bash
cd ~/Documents/OLSI/DEV/olab/millipede

pnpm install
cargo install wasm-pack    # once, if missing
pnpm build:wasm
```

---

## 1. Quick launch (automated tmux)

```bash
bash scripts/millipede-demo-tmux.sh
```

Creates session **`millipede`** with two windows:

| Window | Panes | Purpose |
|--------|-------|---------|
| `pipeline` | 4 | Docker → llm-worker → analyzer → ingestion (staggered start) |
| `ui` | 2 | Radar dev server + test shell |

Attach later: `tmux attach -t millipede`

---

## 2. Manual tmux layout (matches your screenshot)

If you prefer to lay it out by hand:

```bash
cd ~/Documents/OLSI/DEV/olab/millipede
tmux new-session -s millipede -n pipeline
```

### Window 1 — `pipeline` (2×2 grid)

```bash
# Pane 0 — top-left: infrastructure
pnpm compose:down && pnpm compose:up
docker ps

# Split right → Pane 1 — top-right: ingestion
pnpm ingestion:dev

# Select pane 0, split down → Pane 2 — bottom-left: llm-worker
# WAIT until Kafka is healthy (docker ps shows kafka healthy ~30s)
pnpm llm-worker:dev

# Select pane 1, split down → Pane 3 — bottom-right: analyzer
pnpm analyzer:dev
```

**Start order matters:**

1. `compose:up` — wait for **kafka (healthy)**
2. `llm-worker:dev`
3. `analyzer:dev`
4. `ingestion:dev`

Rename panes (optional, from each pane):

```bash
tmux select-pane -T 'compose'
tmux select-pane -T 'ingestion'
tmux select-pane -T 'llm-worker'
tmux select-pane -T 'analyzer'
```

### Window 2 — `ui`

```bash
tmux new-window -t millipede -n ui
pnpm dev:radar          # pane 0 — http://localhost:5174
# split horizontal
# pane 1 — test shell (curl commands below)
```

Open browser: **http://localhost:5174/** (use `localhost`, not `127.0.0.1` — Vite binds IPv6).

---

## 3. Health checks (test shell pane)

Run these before firing webhooks:

```bash
# Kafka + Redis + Postgres up
docker ps --format 'table {{.Names}}\t{{.Status}}'

# Analyzer ready + Redis connected
curl -s http://localhost:8082/health | jq '{redis, database, kafka_topic}'

# Expected:
# { "redis": "connected", "database": "connected", "kafka_topic": "enriched-dev-events" }

# Metrics reachable through Vite proxy
curl -s http://localhost:5174/api/metrics/summary | jq .
```

If `"redis": "unavailable"` → restart compose and analyzer:

```bash
pnpm compose:down && pnpm compose:up
# wait ~30s, then restart pnpm analyzer:dev
```

If `:8082` **address already in use** → kill stale process:

```bash
pkill -f millipede-analyzer
pnpm analyzer:dev
```

---

## 4. Demo script — curl → UI

Keep **http://localhost:5174/** open on the **Overview** tab.

### Step A — metrics baseline

Dashboard left panel `[01] team_metrics` should show cards like:

- `total_events` — number from Postgres
- `src::github`, `src::gitlab` — counts

Refreshes every 5 seconds via TanStack Query.

### Step B — fire a webhook (ingestion)

```bash
curl -s -X POST http://localhost:8081/webhooks/hello \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "opened",
    "source": "github",
    "title": "ship feature for demo"
  }' | jq .
```

**Expected ingestion response:**

```json
{
  "accepted": true,
  "event_id": "...",
  "topic": "raw-dev-events",
  "kafka_status": "published"
}
```

If `"kafka_status": "unavailable"` → Kafka not ready; wait and retry.

### Step C — watch the pipeline panes

| Pane | Expected log |
|------|----------------|
| **llm-worker** | `enriched event_id=... sentiment=0.750 risk=0.000` |
| **analyzer** | `stored team event` + `redis cache warmed` |

### Step D — UI updates (within ~5s)

| UI area | What changes |
|---------|----------------|
| **team_metrics** | `total_events` increments by 1 |
| **live_feed** | New row: timestamp · `github` · `0x........` · SENT · RISK |
| **status pill** | `sse::live` with blinking dot |

**Important:** Live feed only shows events that arrive **while the dashboard page is open**. It does not replay history.

### Step E — security-flavoured event (higher risk score)

```bash
curl -s -X POST http://localhost:8081/webhooks/hello \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "opened",
    "source": "github",
    "title": "security CVE exploit patch"
  }' | jq .
```

Live feed **RISK** tag should glow amber/red (heuristic picks up `security`, `cve`, `exploit`).

### Step F — verify Postgres (optional)

```bash
psql postgres://millipede:millipede@localhost:5432/team_radar \
  -c "SELECT left(id,8) id, source, sentiment, risk_score
      FROM team_events ORDER BY created_at DESC LIMIT 5;"
```

### Step G — 1:1 WASM portal

1. Click **`> 1:1_portal`** in nav
2. Paste: `Alice is burned out. Email alice@example.com for follow-up.`
3. Click **`[ EXEC redact_pii_deterministic ]`**
4. Output panel shows `[EMAIL:xxxxxx]` token — PII never leaves the browser

---

## 5. Architecture (what you're demoing)

```
curl :8081/webhooks/hello
        │
        ▼
  millipede-ingestion ──► Kafka raw-dev-events
        │
        ▼
  millipede-llm-worker ──► Kafka enriched-dev-events
        │                    (sentiment + risk_score)
        ▼
  millipede-analyzer ──► Postgres team_events
        │              └─► Redis PUBLISH team_radar:events
        ▼
  SolidJS radar :5174
    ├─ GET /api/metrics/summary  (poll 5s)
    └─ SSE /api/events/stream    (live feed)
```

---

## 6. Teardown

```bash
# Ctrl+C in each tmux pane, or:
pkill -f millipede-analyzer
pkill -f millipede-ingestion
pkill -f millipede_llm_worker
pnpm compose:down

tmux kill-session -t millipede   # optional
```

---

## 7. Troubleshooting cheat sheet

| Symptom | Fix |
|---------|-----|
| UI header only, no metrics | Hard refresh; ensure `Outlet` fix is in tree |
| `metricsQuery.isSuccess is not a function` | Pull latest Dashboard.tsx (query props are not functions) |
| Metrics work, live feed empty | Redis down — `compose:down && compose:up`, restart analyzer |
| llm-worker crash: unknown topic | Start compose first; wait for Kafka healthy |
| analyzer: address in use :8082 | `pkill -f millipede-analyzer` |
| curl metrics via 127.0.0.1:5174 fails | Use **localhost:5174** (Vite IPv6 bind) |
| `kafka_status: unavailable` | Kafka still starting — wait 30s |

---

## 8. Optional — Stage 2 gateway mode

Not needed for the UI demo. See [`docs/stage2-gateway.md`](stage2-gateway.md).

---

Related: [`docs/stage4-radar.md`](stage4-radar.md) · [`README.md`](../README.md)
