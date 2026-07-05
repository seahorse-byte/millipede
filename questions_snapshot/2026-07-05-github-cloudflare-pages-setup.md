# GitHub + Cloudflare Pages Setup — 2026-07-05

How we connected **Millipede Academy** to GitHub and Cloudflare Pages (git-connected deploy).

**Repo:** https://github.com/seahorse-byte/millipede  
**GitHub account:** `seahorse-byte`  
**Target URL:** `https://millipede-academy.pages.dev`

Full operational guide also lives in `apps/academy/DEPLOY.md`.

---

## Why Pages, not Workers?

The Academy is a **static Astro site** (HTML/JS/CSS in `apps/academy/dist`).

| Product | Use case | Deploy model |
|---------|----------|--------------|
| **Cloudflare Pages** | Static sites, Astro, React SPAs | Build → upload `dist/` folder |
| **Cloudflare Workers** | Serverless functions at the edge | `npx wrangler deploy` |

**Common mistake:** Cloudflare UI shows **Create a Worker** with:
- Deploy command: `npx wrangler deploy`
- Non-production command: `npx wrangler versions upload`
- **No "Build output directory" field**

If you don't see **Build output directory**, you're in the **Worker** flow — go back and pick **Pages → Connect to Git**.

---

## Part 1 — GitHub repo

### Prerequisites

- `gh` CLI logged in as `seahorse-byte`:
  ```bash
  gh auth status
  # Active account: seahorse-byte
  ```

### Create repo and push (one-time)

From repo root:

```bash
cd ~/Documents/OLSI/DEV/olab/millipede

git add -A
git commit -m "chore: initial millipede monorepo bootstrap"
gh repo create seahorse-byte/millipede --public --source=. --remote=origin --push \
  --description "Millipede Academy + DevSecOps Team Radar — learn-by-building monorepo"
```

Verify:

```bash
gh repo view seahorse-byte/millipede --web
```

### What gets deployed vs what stays local

| In GitHub / Cloudflare | Local only |
|------------------------|------------|
| `apps/academy/` (Astro lessons) | `services/ingestion/` (Rust) |
| `packages/lesson-widgets/` | Docker Compose (Kafka/PG/Redis) |
| MDX content, widgets | Team Radar pipeline stages |

---

## Part 2 — Cloudflare Pages (git-connected)

### 2.1 Start the correct flow

1. Open https://dash.cloudflare.com/
2. Left sidebar → **Workers & Pages**
3. **Create**
4. Choose **Pages** → **Connect to Git** *(not Worker)*
5. Authorize GitHub if prompted
6. Account: **seahorse-byte**
7. Repository: **millipede** → **Begin setup**

**Sanity check:** the form should include **Build output directory**. If it only shows **Deploy command** (`npx wrangler deploy`), stop — wrong product.

### 2.2 Build settings (pnpm monorepo)

| Setting | Value |
|---------|-------|
| Project name | `millipede-academy` |
| Production branch | `main` |
| Framework preset | **None** (or Astro — commands must match below) |
| Root directory | *(empty — build from repo root)* |
| Build command | `pnpm install && pnpm build:academy` |
| **Build output directory** | `apps/academy/dist` |

Why repo root? Workspace packages `@millipede/lesson-widgets` and `@millipede/mdx-schema` live outside `apps/academy/`. Building only inside `apps/academy` breaks the monorepo.

### 2.3 Environment variables

| Variable | Value | Environments |
|----------|-------|--------------|
| `NODE_VERSION` | `22` | Production + Preview |

Repo also has `.node-version` with `22` as backup.

### 2.4 Deploy

Click **Save and Deploy**. First build ~2–3 minutes.

Live at:

```
https://millipede-academy.pages.dev
```

After deploy, confirm `site` in `apps/academy/astro.config.mjs` matches your Pages URL (canonical/OG tags).

---

## Part 3 — Verify deployment

| URL | Expected |
|-----|----------|
| `/` | Lesson list (0.1, 0.9) |
| `/lessons/0-1-what-is-a-computer/` | BitRegister widget interactive |
| `/lessons/0-9-god-project-mental-model/` | KafkaPipelineVisualizer animates |

Local preview before pushing:

```bash
pnpm install
pnpm build:academy
pnpm --filter @millipede/academy preview
```

---

## Part 4 — Ongoing workflow

```bash
# Edit: apps/academy/src/content/lessons/
git add -A
git commit -m "content: add lesson 0.2"
git push origin main
# Cloudflare rebuilds automatically on push to main
```

- **Production:** pushes to `main`
- **Preview:** each PR gets its own `*.pages.dev` URL

---

## Part 5 — Custom domain (optional)

1. Cloudflare → **Workers & Pages** → **millipede-academy**
2. **Custom domains** → **Set up a custom domain**
3. e.g. `academy.yourdomain.com` — follow DNS steps

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| No "Build output directory" field | Worker flow, not Pages | Back → **Pages** → Connect to Git |
| Deploy command shows `wrangler deploy` | Worker flow | Same — use Pages |
| `pnpm: command not found` | Node/pnpm not detected | Set `NODE_VERSION=22`; commit `pnpm-lock.yaml` |
| Workspace package not found | Building from `apps/academy` only | Root directory empty; build from repo root |
| Widgets blank on live site | Hydration / JS error | Browser console; MDX needs `client:load` on Solid components |
| Build passes locally, fails on CF | Missing lockfile or wrong output path | Output must be `apps/academy/dist` |
| `[ERR_PNPM_IGNORED_BUILDS]` esbuild/sharp | pnpm 11 blocks postinstall scripts on CI | Root `package.json` has `pnpm.onlyBuiltDependencies`; see `.npmrc` |
| 1Password error on `git commit` | Commit signing agent | Retry after unlocking 1Password |

---

## CLI alternative (optional, not git-connected)

Manual deploy without git hook:

```bash
npm i -g wrangler
wrangler login
pnpm build:academy
wrangler pages deploy apps/academy/dist --project-name=millipede-academy
```

Prefer **git-connected Pages** (Part 2) for push-to-deploy workflow.

---

## Architecture diagram

```
┌─────────────────────────────────────┐
│  GitHub: seahorse-byte/millipede    │
│  branch: main                       │
└──────────────┬──────────────────────┘
               │ push
               ▼
┌─────────────────────────────────────┐
│  Cloudflare Pages (git integration) │
│  pnpm install && pnpm build:academy │
│  output → apps/academy/dist         │
└──────────────┬──────────────────────┘
               │
               ▼
   https://millipede-academy.pages.dev
   (Astro static + Solid lesson widgets)

┌─────────────────────────────────────┐
│  Local only (not on Cloudflare)     │
│  Docker: Kafka, Postgres, Redis   │
│  Rust ingestion on :8081            │
└─────────────────────────────────────┘
```
