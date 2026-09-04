# Team Radar config

## `manager.json`

EM / manager identity — **not** a direct report. Used by `pnpm sync:roster` to exclude the manager from `direct-reports.json` when syncing from a GitHub team (the team roster often includes the EM).

| Field | Purpose |
|-------|---------|
| `github` | Login to skip during roster sync |
| `name` | Display name (docs / future filters) |

## `direct-reports.json`

Roster of **direct reports only** (manager excluded — see `manager.json`) used for actor matching in connectors and the analyzer.

**Sync from GitHub team** (recommended):

```bash
# .env.local — GITHUB_TOKEN with read:org
pnpm sync:roster
```

Reads `github.org` and `github.team_slug` from `config/team-sources.json` (currently `snyk` / `saw_saw-frontend`). Preserves existing `gitlab`, `slack_user_id`, `jira_account_id`, and `email` values when re-syncing.

Flags:

- `--dry-run` — print JSON without writing
- `--sync-repos` — also merge team repos into `team-sources.json`

Fill in GitLab, Slack, and Jira handles manually after the first roster sync (see table below).

**GitLab handles:** canonical source is `~/.claude/skills/team-manager/config.yaml` → each member's `gitlab_handle` (strip a leading `@` before storing). Cross-check `~/.claude/skills/mr-radar/data/config.json` → `team.members[].gitlab` if needed. `pnpm sync:roster` preserves existing `gitlab` values — re-align from team-manager after a roster refresh.

Connectors and the analyzer read `direct-reports.json` on each run (`pnpm sync:gitlab`, etc.) — no service restart required after editing this file.

| Field | Used to match |
|-------|----------------|
| `id` | Canonical `actor_id` on events (do not change lightly) |
| `github` | GitHub `sender.login` / PR author |
| `gitlab` | GitLab `user.username` |
| `slack_user_id` | Slack `user` field on messages |
| `jira_account_id` | Jira `accountId` on issue/comment events |

The analyzer loads this file from `config/direct-reports.json` (repo root) or `DIRECT_REPORTS_CONFIG` env override.

## `source-registry.json`

Defines ingest sources for Team Brain docs and future connectors. Each source has independent freshness tracking — see `docs/team-brain/README.md`.

| Field | Purpose |
|-------|---------|
| `id` | Canonical source key (`team_events.source`) |
| `display_name` | Label in generated docs |
| `required` | Missing/stale → overall brain status `partial` |
| `matcher_fields` | Roster fields for actor mapping (connectors) |

## `team-sources.json`

Lists repos, Jira projects, and Slack channels to sync for your team. Used by `pnpm sync:*` connector scripts.

| Section | Field | Purpose |
|---------|-------|---------|
| `github.org` | string | GitHub org for roster sync (`pnpm sync:roster`) |
| `github.team_slug` | string | Team slug for roster sync |
| `github.repos` | `owner/name` | Repos to poll for PRs and reviews |
| `github.sync_days` | number | Only PRs updated within this window (default 14) |
| `gitlab.projects` | path | GitLab project paths (`group/project`) |
| `gitlab.host` | URL | GitLab host (default `https://gitlab.com`; override with `GITLAB_HOST`) |
| `gitlab.sync_days` | number | Only MRs updated within this window (default 14) |
| `jira.projects` | keys | Jira project keys (stub connector) |
| `slack.channels` | IDs | Allowlisted channel IDs (stub connector) |

Current team repos: `Probely/probely-website`, `snyk/saw-mcp`, `Probely/securityheaders` (GitHub). GitLab: `probely/saw-agent-skills`, `probely/enterprise-frontend`, `probely/ninja-onboarding-runner` (aligned with pr-radar). Refine the list manually or run `pnpm sync:roster --sync-repos` to merge GitHub repos from the team.

See `scripts/connectors/README.md` and `.env.example` for token setup.
