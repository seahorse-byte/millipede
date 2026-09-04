# Team Brain — operator quickstart (do it now)

Ten steps to get **real or demo** team data flowing into Millipede on your machine. Full reference: [millipede-playbook.md](../millipede-playbook.md).

Repo path (adjust if needed):

```text
/Users/olsigjeci/Documents/OLSI/DEV/olab/millipede
```

---

## 1. Prerequisites

- Docker Desktop running (`docker ps` works)
- `pnpm install` once per clone
- Rust + `cargo` (ingestion, analyzer)
- Optional: `pnpm build:wasm` for the 1:1 portal

## 2. Create local secrets file

```bash
cd /Users/olsigjeci/Documents/OLSI/DEV/olab/millipede
cp -n .env.example .env.local   # skip if you already have .env.local
```

**Never commit `.env.local`.**

## 3. Point roster at your people

Edit **`config/direct-reports.json`**:

- `id` — stable slug (used in APIs and generated docs)
- `name` — display name
- `github` — GitHub login (required for `pnpm sync:github`)
- Optional: `gitlab`, `slack_user_id`, `jira_account_id` for future connectors

See `config/README.md` for field details.

## 4. Point sources at your repos

Edit **`config/team-sources.json`**:

- **GitHub:** `org`, `team_slug` (optional), `repos` (e.g. `Probely/probely-website`, `snyk/saw-mcp`, `Probely/securityheaders`), `sync_days`, `include_reviews`
- **GitLab:** `projects` (e.g. `probely/enterprise-frontend` — same paths as pr-radar), `host`, `sync_days`
- **Jira / Slack:** fill when you add those tokens (stubs today)

## 5. Add tokens (for real PR/MR sync)

In **`.env.local`**:

```bash
GITHUB_TOKEN=ghp_...   # classic: repo scope; fine-grained: PR read on listed repos
GITLAB_TOKEN=glpat-... # read_api — same projects as pr-radar
INGESTION_URL=http://127.0.0.1:8081
```

Dry-run without posting:

```bash
node scripts/connectors/sync-github.mjs --dry-run
node scripts/connectors/sync-gitlab.mjs --dry-run
```

## 6. Start the stack

**Recommended (tmux, all panes):**

```bash
pnpm millipede-demo
tmux attach -t millipede
```

Wait until the **test shell** pane shows **Ready** (ingestion `:8081`, analyzer `:8082` healthy).

**Minimal (Docker only, you start services):**

```bash
pnpm compose:up
pnpm ingestion:dev    # terminal 1
pnpm llm-worker:dev   # terminal 2
pnpm analyzer:dev     # terminal 3
```

## 7. Load data — demo **or** connectors

**No token yet (see the full loop immediately):**

```bash
pnpm seed:demo
sleep 5
```

**With `GITHUB_TOKEN` set:**

```bash
pnpm sync:github
sleep 5
```

**With `GITLAB_TOKEN` set:**

```bash
pnpm sync:gitlab
sleep 5
```

Re-run sync anytime; connectors only ingest events for handles in `direct-reports.json` and repos/projects in `team-sources.json`.

## 8. Refresh Team Brain docs

```bash
pnpm brain:refresh
```

Open **`docs/team-brain/generated/README.md`** — check **overall freshness** and per-source tables.

Vault mirror (optional): `~/.claude/millipede-brain`

## 9. Verify APIs

```bash
curl -s http://127.0.0.1:8082/api/metrics/summary | jq .
curl -s 'http://127.0.0.1:8082/api/pull-requests?limit=3' | jq .
```

Optional UI: `pnpm dev:radar` → http://127.0.0.1:5174

## 10. Wire automation (later)

```bash
pnpm connectors:watch   # polls connectors every CONNECTOR_POLL_MINUTES
```

Add `GITLAB_TOKEN`, Jira, and Slack tokens in `.env.local` when those connectors are enabled.

---

## Cheat sheet

| Goal | Command |
|------|---------|
| Full stack in tmux | `pnpm millipede-demo` |
| Demo webhooks only | `pnpm seed:demo` |
| Real GitHub PRs | `pnpm sync:github` |
| Regenerate markdown brain | `pnpm brain:refresh` |
| Stop Docker | `pnpm compose:down` |
| Kill tmux session | `tmux kill-session -t millipede` |

## Blocked on you?

| Blocker | Fix |
|---------|-----|
| `Missing GITHUB_TOKEN` | Set token in `.env.local` (step 5) |
| Empty PR list after sync | Match `github` logins in roster; add repos to `team-sources.json` |
| `brain:refresh` → `blocked` | Start analyzer (`:8082`) and wait for pipeline after seed/sync |
| Webhooks fail | Ingestion must be up on `:8081` |

Playbook: [docs/millipede-playbook.md](../millipede-playbook.md)
