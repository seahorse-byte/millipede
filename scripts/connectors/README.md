# Local team connectors

Poll-based sync scripts that fetch real team data and POST normalized events to ingestion (`:8081`).


## 1Password (recommended for tokens)

Committed template: **`.env.local.op`** at repo root (only `op://` references — safe to commit).

Prerequisites: [1Password CLI](https://developer.1password.com/docs/cli/) signed in (`op whoami`).

```bash
# Dry-run with injected secrets
op run --env-file=.env.local.op -- node scripts/connectors/sync-github.mjs --dry-run

# pnpm scripts auto-use op when .env.local.op exists and `op` is on PATH
pnpm sync:github
```

GitHub item in vault **Dev Vault (CLI tools)** — use the UUID reference in `.env.local.op` (the item title has a trailing space, so name-based `op://` paths may fail).

If you use 1Password, **`.env.local` is optional** (plaintext tokens only needed when not using `op`).

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
# config/direct-reports.json → gitlab usernames (canonical: team-manager config.yaml → gitlab_handle, strip @)

pnpm millipede-demo
pnpm sync:gitlab
# Dry-run: node scripts/connectors/sync-gitlab.mjs --dry-run
```

Projects tracked by pr-radar live in `~/.claude/skills/mr-radar/data/config.json` → `repos[]` where `platform: gitlab`. Millipede mirrors those paths in `config/team-sources.json`.

Open http://127.0.0.1:5174 — filter by direct report, check Pull requests tab.

## Fine-grained PAT (Probely org)

The **Probely** GitHub org blocks **classic** personal access tokens. Repos under `Probely/*` (e.g. `Probely/probely-website`) require a **fine-grained PAT**:

1. GitHub → **Settings** → **Developer settings** → **Fine-grained tokens** → **Generate new token**
2. **Resource owner**: Probely (or your user, if the org has granted you access)
3. **Repository access**: select the Probely repos you need (`probely-website`, `securityheaders`, …)
4. **Permissions** (minimum for PR sync): **Pull requests** (read), **Contents** (read)
5. Store the token in 1Password / `.env.local` as `GITHUB_TOKEN`

Classic PATs still work for `snyk/*` repos. If sync logs `access denied (403)` for a Probely repo, other repos in `config/team-sources.json` are still processed — fix the token for that org and re-run.

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

### PR/MR fields synced

| Field | GitHub | GitLab |
|-------|--------|--------|
| `merged_at` | `merged_at` from PR API | `merged_at` from MR API |
| `draft` | `draft` flag | `draft` / `work_in_progress` |
| `blocked` | `blocked` label only (list endpoint has no labels — gap) | `blocking_discussions_resolved: false` or `blocked` label |
| `updated_at` | PR `updated_at` | MR `updated_at` |

Re-run `pnpm sync:github` / `pnpm sync:gitlab` after upgrading to backfill new columns.

## Config

- `config/direct-reports.json` — roster + per-source handles (re-read each `pnpm sync:*` run; no restart)
- `config/team-sources.json` — repos, Jira projects, Slack channel IDs
- `.env.local` — plaintext tokens (see `.env.example`), or `.env.local.op` + `op`

Full plan: `~/.claude/plans/millipede-local-team-connectors.md`
