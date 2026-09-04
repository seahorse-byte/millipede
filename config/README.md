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
