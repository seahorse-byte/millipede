# Millipede end-to-end map

Canonical architecture reference for the monorepo. Demo walkthrough: [`millipede-demo-replay.md`](millipede-demo-replay.md).

---

## Two products, one loop

```
┌─────────────────────────────────────────────────────────────────┐
│                     MILLIPEDE MONOREPO                          │
├────────────────────────────┬────────────────────────────────────┤
│  ACADEMY (teach)           │  TEAM RADAR (ship)                 │
│  apps/academy/             │  services/ + apps/radar/           │
│  Astro → Cloudflare Pages  │  Docker + Rust/Python → localhost  │
│  :4321 dev                 │  :8081 ingestion · :8082 analyzer  │
│                            │  :5174 radar UI                    │
└────────────────────────────┴────────────────────────────────────┘
         │                              ▲
         │   lesson widgets explain     │   you build what you learned
         └──────────────────────────────┘
```

| Product | Deploy target | Status |
|---------|---------------|--------|
| **Academy** | `https://millipede-academy.pages.dev` | **Book 0 complete** — 10 lessons + lab/quiz panels |
| **Team Radar** | Local dev (Stage 5 → CI/e2e) | Stages 1–4 implemented |

---

## Team Radar pipeline (Stages 1–4)

What you demo with `millipede-demo` / `pnpm millipede-demo`:

```
External webhook / curl
        │
        ▼
┌───────────────────┐
│ millipede-        │  POST /webhooks/hello
│ ingestion :8081   │──────────────────────────┐
└───────────────────┘                          │
        │                                      ▼
        │ publish                      Kafka: raw-dev-events
        ▼                                      │
┌───────────────────┐                          │
│ millipede-        │◄─────────────────────────┘
│ llm-worker        │  consume + enrich
│ (Python)          │  sentiment, risk_score
└───────────────────┘
        │
        │ publish
        ▼
              Kafka: enriched-dev-events
        │
        ▼
┌───────────────────┐
│ millipede-        │──► Postgres  team_events
│ analyzer :8082    │──► Redis     PUBLISH team_radar:events
└───────────────────┘
        │
        ├──────────────────────────────────────┐
        ▼                                      ▼
  GET /api/metrics/summary              SSE /api/events/stream
  (TanStack Query, poll 5s)             (live feed while page open)
        │                                      │
        └──────────────┬───────────────────────┘
                       ▼
              SolidJS radar :5174
              ├─ /          overview + live feed
              └─ /1on1      WASM PII redaction (browser-only)
```

### Optional — Stage 2 gateway path

Not required for the radar UI demo. When enabled:

```
Client ──HTTPS+JWT──► millipede-gateway :8443 ──mTLS──► ingestion / analyzer
```

See [`stage2-gateway.md`](stage2-gateway.md).

---

## Infrastructure (Docker Compose)

| Service | Port | Role |
|---------|------|------|
| Kafka | 9092 | Event bus (`raw-dev-events`, `enriched-dev-events`) |
| Postgres | 5432 | `team_radar.team_events` |
| Redis | 6379 | Live SSE pub/sub `team_radar:events` |

`pnpm compose:up` · `infra/docker/docker-compose.yml`

---

## Academy content map

```
apps/academy/src/content/lessons/   Book 0 — lessons 0.1–0.10 (10 files)
content/book-00-foundations/         mirror of Book 0
content/ books 1–7                   not started
```

See [`academy-status.md`](academy-status.md) for the full lesson table.

### Widget inventory (`packages/lesson-widgets/`)

| Status | Widgets |
|--------|---------|
| **Built (Book 0)** | BitRegister, BaseConverter, ByteAnatomy, HexColorMixer, StackFrameVisualizer, PacketJourney, RequestTimeline, BrowserRuntimeDiagram, TrustBoundaryDiagram, MtlsHandshake, KafkaPipelineVisualizer |
| **Schema only (Book 1+)** | EventLoopSimulator, OwnershipVisualizer, BorrowCheckerPanel, ConcurrencyChannels, WasmBoundary, WasmRedaction, AgentEvalGate, ApiWorkerSplit, BffProxyFlow |

Lab/quiz panels: `apps/academy/src/components/LabPanel.astro`, `QuizPanel.astro` + `data/labs-quizzes.ts`.

---

## Academy deploy path

```
git push main
        │
        ▼
Cloudflare Pages (repo root build)
  pnpm install && pnpm build:academy
  output → apps/academy/dist
        │
        ▼
https://millipede-academy.pages.dev
```

Radar backend stays **local only** — Academy is static HTML/JS. See [`academy-deploy-checklist.md`](academy-deploy-checklist.md) · `apps/academy/DEPLOY.md`.

---

## Stage roadmap

| Stage | Deliverable | Doc | Status |
|-------|-------------|-----|--------|
| 1 | Webhook → Kafka → Postgres + Redis | README | ✅ |
| 2 | JWT gateway + mTLS | [`stage2-gateway.md`](stage2-gateway.md) | ✅ |
| 3 | Python LLM enrichment | [`stage3-llm-worker.md`](stage3-llm-worker.md) | ✅ |
| 4 | SolidJS + TanStack + WASM redaction | [`stage4-radar.md`](stage4-radar.md) | ✅ |
| 5 | Eval CI, OTel, Playwright e2e | [`work-alignment.md`](work-alignment.md) | 🔲 planned |

---

## PDF planning artifacts → repo

From lesson 0.9 (God Project mental model):

| PDF | Maps to |
|-----|---------|
| Gemini1 | Monorepo layout |
| Gemini2 | Team Radar event flow |
| Gemini3 | `services/`, `infra/docker/` |
| Gemini4 | `services/gateway/`, `infra/certs/` |
| Gemini5 | LLM worker → analyzer → manager views |
| Gemini6 | `packages/redact-wasm/`, `apps/radar/` |

PDFs referenced as living in `docs/` — planning artifacts, not runtime.

---

## Quick commands

| Intent | Command |
|--------|---------|
| Run full local demo | `millipede-demo` or `pnpm millipede-demo` |
| Academy dev | `pnpm dev:academy` → http://localhost:4321 |
| Radar dev | `pnpm dev:radar` → http://localhost:5174 |
| Commit + push | `millipede-commit-push` |

Playbook: `playbook` → `millipede`
