# Local team connectors

Poll-based sync scripts that fetch real team data and POST normalized events to ingestion (`:8081`).

## Quick start (GitHub)

```bash
cp .env.example .env.local
# Edit .env.local — set GITHUB_TOKEN
# Edit config/direct-reports.json — real GitHub logins
# Edit config/team-sources.json — repos your team works in

pnpm millipede-demo   # or manual stack
pnpm sync:github
```

Open http://127.0.0.1:5174 — filter by direct report, check Pull requests tab.

## Commands

| Script | pnpm alias | Status |
|--------|------------|--------|
| `sync-github.mjs` | `pnpm sync:github` | Working |
| `sync-gitlab.mjs` | `pnpm sync:gitlab` | Stub |
| `sync-jira.mjs` | `pnpm sync:jira` | Stub |
| `sync-slack.mjs` | `pnpm sync:slack` | Stub |
| `watch.mjs` | `pnpm connectors:watch` | Polls enabled connectors |

Flags: `node scripts/connectors/sync-github.mjs --dry-run` prints payloads without POSTing.

## Config

- `config/direct-reports.json` — roster + per-source handles
- `config/team-sources.json` — repos, Jira projects, Slack channel IDs
- `.env.local` — tokens (see `.env.example`)

Full plan: `~/.claude/plans/millipede-local-team-connectors.md`
