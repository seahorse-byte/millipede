# Academy deploy checklist

Quick reference — full guide: [apps/academy/DEPLOY.md](../apps/academy/DEPLOY.md)

## GitHub
- [ ] Repo: `seahorse-byte/millipede` (public)
- [ ] Branch: `main`
- [ ] Initial push includes `pnpm-lock.yaml`, `.node-version`

## Cloudflare Pages
- [ ] Workers & Pages → Create → Connect to Git
- [ ] Repo: `seahorse-byte/millipede`
- [ ] Build command: `pnpm install && pnpm build:academy`
- [ ] Output directory: `apps/academy/dist`
- [ ] Env: `NODE_VERSION=22`
- [ ] Live URL: `https://millipede-academy.pages.dev`

## Verify
- [ ] `/` shows lesson list
- [ ] `/lessons/0-1-what-is-a-computer/` — BitRegister works
- [ ] `/lessons/0-9-god-project-mental-model/` — Kafka widget works
