# Academy catch-up status

**Academy:** `pnpm dev:academy` → http://localhost:4321  
**Radar:** `pnpm dev:radar` → http://localhost:5174

---

## Progress

| Book | Lessons | Status |
|------|---------|--------|
| 0–4 | 44 | ✅ |
| **5** Stages 2+3 Security + AI | **12** | ✅ |
| **6** Stage 4 radar | **6** | ✅ |
| 7 EM leadership | 8+ | 🔲 |

**Total shipped:** 62 lessons (Books 0–6)

---

## Book 5 — complete ✅

Gateway JWT/mTLS · route through gateway · Python llm-worker · enrichment graph · enriched topic · analyzer · replay · Slack pulse · capstone.

Mirror: `content/book-05-security-ai/`

---

## Full demo

```bash
bash infra/certs/generate-dev-certs.sh
pnpm compose:up
MILLIPEDE_MTLS=1 pnpm gateway:dev &
pnpm llm-worker:dev & pnpm analyzer:dev & pnpm ingestion:dev &
export TOKEN="$(cargo run -q -p millipede-gateway --bin mint_dev_jwt)"
pnpm dev:radar
```

---

## Next: Book 7 — EM Leadership Kit

KPIs, eval CI, mock class, work-bridge doc.

```bash
pnpm build:academy && git push origin main
```
