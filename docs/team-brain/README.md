# Millipede Team Brain

Local living documentation for engineering managers — per-direct-report activity, cross-repo PRs, team KPIs, and **per-source freshness receipts**.

## Quick start

```bash
# Stack running + data seeded
pnpm seed:demo
pnpm brain:refresh
```

Open `docs/team-brain/generated/README.md` (gitignored — regenerate anytime).

Vault mirror: `~/.claude/millipede-brain/` (durable copy across clones).

## Layout

| Path | Git | Purpose |
|------|-----|---------|
| `README.md` | committed | This guide |
| `templates/` | committed | Doc skeletons + frontmatter schema |
| `generated/` | **gitignored** | Live snapshots from `pnpm brain:refresh` |

## Freshness

Each source (Slack, Jira, GitHub, GitLab) is tracked independently in `generated/brain-state.json`. Overall status is `partial` if any required source is empty/stale — one source succeeding never masks another failing.

## Invoke in agent sessions

```
@millipede-brain team mode — friction trend this week
@millipede-brain person mode — Alex Chen activity summary
@millipede-brain freshness mode — which sources are stale?
```

(Full skill at `~/.claude/skills/millipede-brain/SKILL.md` — planned; use generated docs directly until then.)

## Related brains

| Brain | When to use |
|-------|-------------|
| **Team Brain** (here) | Direct-report activity, PRs, EM radar KPIs |
| **operator-brain** | Company org, pillars, exec context |
| **cos-evo-brain** | COS product memory, architecture, MRs |

## Plan

Design doc: `~/.claude/plans/millipede-living-team-brain.md`
