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

## Quick start (GitLab)

```bash
cp .env.example .env.local
# GITLAB_TOKEN — PAT with read_api
# GITLAB_HOST — optional (default https://gitlab.com)
# config/team-sources.json → gitlab.projects (aligned with pr-radar / mr-radar)
# config/direct-reports.json → gitlab usernames

pnpm millipede-demo
pnpm sync:gitlab
# Dry-run: node scripts/connectors/sync-gitlab.mjs --dry-run
```

Projects tracked by pr-radar live in `~/.claude/skills/mr-radar/data/config.json` → `repos[]` where `platform: gitlab`. Millipede mirrors those paths in `config/team-sources.json`.

Open http://127.0.0.1:5174 — filter by direct report, check Pull requests tab.

## Commands

| Script | pnpm alias | Status |
|--------|------------|--------|
| `sync-github.mjs` | `pnpm sync:github` | Working |
| `sync-roster-from-github.mjs` | `pnpm sync:roster` | Working |
| `sync-gitlab.mjs` | `pnpm sync:gitlab` | Working |
| `sync-jira.mjs` | `pnpm sync:jira` | Stub |
| `sync-slack.mjs` | `pnpm sync:slack` | Stub |
| `watch.mjs` | `pnpm connectors:watch` | Polls enabled connectors |

Flags: `node scripts/connectors/sync-github.mjs --dry-run` (or `sync-gitlab.mjs`) prints payloads without POSTing.

## Config

- `config/direct-reports.json` — roster + per-source handles
- `config/team-sources.json` — repos, Jira projects, Slack channel IDs
- `.env.local` — tokens (see `.env.example`)

Full plan: `~/.claude/plans/millipede-local-team-connectors.md`
