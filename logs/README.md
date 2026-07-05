# Local logs (not committed)

Private scratch space for build failures, deploy traces, and runtime debugging.
**Contents of this folder stay on your machine** — only this README and `.gitkeep` files are in git.

## Why keep logs locally?

| Reason | Detail |
|--------|--------|
| Learn from failures | Cloudflare / Docker / Rust errors with full context |
| Compare over time | "Did pnpm fix work on commit X?" |
| No noise in git history | Deploy logs are huge and ephemeral |
| No accidental secrets | Webhook payloads or env snippets might appear in logs |

## Folder layout

```
logs/
├── deploy/
│   └── cloudflare/     # Pages build logs (download from CF dashboard)
├── runtime/
│   └── ingestion/      # RUST_LOG output, curl traces (optional)
└── docker/             # docker compose logs > file
```

## Naming convention

Use sortable, searchable names:

```
YYYY-MM-DD-<service>-<short-description>.log
```

Examples:

```
2026-07-05-cloudflare-pnpm-ignored-builds.log
2026-07-05-cloudflare-success-main.log
2026-07-10-ingestion-kafka-timeout.log
```

## How to capture

**Cloudflare Pages**

1. Dashboard → project → **Deployments** → failed/success build
2. **Download log** → save to `logs/deploy/cloudflare/`

**Docker Compose**

```bash
docker compose -f infra/docker/docker-compose.yml logs --no-color > logs/docker/2026-07-05-compose.log
```

**Ingestion service**

```bash
RUST_LOG=millipede_ingestion=debug cargo run -p millipede-ingestion 2>&1 | tee logs/runtime/ingestion/$(date +%Y-%m-%d)-dev.log
```

## When something breaks

1. Save the log here immediately (before retrying)
2. Note the git commit SHA from the log (`HEAD is now at ...`)
3. Optional: add a one-line note to `questions_snapshot/` if you learned something durable

## Git policy

| Committed | Not committed |
|-----------|---------------|
| `logs/README.md` | All other files under `logs/` |

Do **not** remove `logs/` from `.gitignore` to "share" a log — paste excerpts into `questions_snapshot/` instead.
