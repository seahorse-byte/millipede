# Team Radar config

## `direct-reports.json`

Replace placeholder names and handles with your team's real identities before using Team Radar in production.

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
| `github.repos` | `owner/name` | Repos to poll for PRs and reviews |
| `github.sync_days` | number | Only PRs updated within this window (default 14) |
| `gitlab.projects` | path | GitLab project paths (stub connector) |
| `jira.projects` | keys | Jira project keys (stub connector) |
| `slack.channels` | IDs | Allowlisted channel IDs (stub connector) |

See `scripts/connectors/README.md` and `.env.example` for token setup.
