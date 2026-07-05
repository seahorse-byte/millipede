# Millipede Academy — Deploy Guide

Host the Astro Academy on **Cloudflare Pages**, source from **GitHub** (`seahorse-byte/millipede`).

## Architecture

```
GitHub (seahorse-byte/millipede)
    push to main
        ↓
Cloudflare Pages (git integration)
    pnpm install && pnpm build:academy
        ↓
Static site → https://millipede-academy.pages.dev (or custom domain)
```

Team Radar (Rust/Kafka/Docker) stays local — only the Academy ships to Cloudflare.

---

## Part 1 — GitHub (automated)

Repo: **https://github.com/seahorse-byte/millipede**

If not created yet, from repo root:

```bash
git add -A
git commit -m "chore: initial millipede monorepo bootstrap"
gh repo create seahorse-byte/millipede --public --source=. --remote=origin --push
```

Verify:

```bash
gh repo view seahorse-byte/millipede --web
```

---

## Part 2 — Cloudflare Pages (dashboard — ~5 min)

### 2.1 Connect GitHub to Cloudflare

1. Open **https://dash.cloudflare.com/**
2. Left sidebar → **Workers & Pages**
3. **Create** → **Pages** → **Connect to Git**
4. Authorize **GitHub** if prompted
5. Select account **seahorse-byte**
6. Select repository **millipede** → **Begin setup**

### 2.2 Build settings (monorepo)

Use these **exact** values:

| Setting | Value |
|---------|-------|
| Project name | `millipede-academy` |
| Production branch | `main` |
| Framework preset | **None** (or Astro — either works if commands match) |
| Root directory | *(leave empty — repo root)* |
| Build command | `pnpm install && pnpm build:academy` |
| Build output directory | `apps/academy/dist` |

### 2.3 Environment variables

Click **Environment variables** → **Add**:

| Variable | Value | Environments |
|----------|-------|--------------|
| `NODE_VERSION` | `22` | Production + Preview |

*(Optional — `.node-version` at repo root also works.)*

### 2.4 Deploy

Click **Save and Deploy**. First build takes ~2–3 minutes.

When green, your site is live at:

```
https://millipede-academy.pages.dev
```

(or the project name you chose + `.pages.dev`)

---

## Part 3 — Verify

1. **Homepage** — lesson list with 0.1 and 0.9
2. **Lesson 0.1** — `BitRegister` widget loads
3. **Lesson 0.9** — `KafkaPipelineVisualizer` animates

Local preview before push:

```bash
pnpm install
pnpm build:academy
pnpm --filter @millipede/academy preview
```

---

## Part 4 — Custom domain (optional)

1. Cloudflare dashboard → **Workers & Pages** → **millipede-academy**
2. **Custom domains** → **Set up a custom domain**
3. e.g. `academy.yourdomain.com` — follow DNS instructions

---

## Part 5 — Ongoing workflow

```bash
# Edit lessons in apps/academy/src/content/lessons/
git add -A
git commit -m "content: add lesson 0.2"
git push origin main
# Cloudflare rebuilds automatically
```

Preview deployments: every PR gets a unique `*.pages.dev` preview URL.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails: `pnpm: command not found` | Add env var `NODE_VERSION=22`; ensure `pnpm-lock.yaml` is committed |
| Build fails: workspace package not found | Build from **repo root**, not `apps/academy` alone |
| Widgets blank on site | Check browser console; ensure `client:load` on MDX components |
| Wrong site URL in meta | Update `site` in `apps/academy/astro.config.mjs` after first deploy |

---

## CLI alternative (optional)

If you install Wrangler later:

```bash
npm i -g wrangler
wrangler login
cd apps/academy && pnpm build
wrangler pages deploy dist --project-name=millipede-academy
```

Git-connected deploys (Part 2) are preferred — push to deploy, no manual CLI step.
