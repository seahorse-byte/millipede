# Academy catch-up status

Living tracker against the canonical plan: `~/.claude/plans/cursor/millipede_learning_journey_0db313c1.plan.md`

**Dev:** `pnpm dev:academy` → http://localhost:4321  
**Deploy:** https://millipede-academy.pages.dev · checklist [`academy-deploy-checklist.md`](academy-deploy-checklist.md)

---

## Overall progress

| Area | Plan | Shipped | Gap |
|------|------|---------|-----|
| **Book 0** | 10 lessons | **10** ✅ | — |
| **Book 1** | 14 lessons | **14** ✅ | — |
| **Book 2** | 10 lessons | **10** ✅ | — |
| **Books 3–7** | ~42 lessons | **0** | Full books |
| **Lab + quiz UI** | Self-graded | **✅** panels on lesson pages | No server progress API |
| **Progress API** | Cloudflare Worker / D1 | **None** | Future |
| **Hosting** | Cloudflare Pages | **✅** | — |

**Team Radar Stages 1–4** remain ahead of Books 3–6 curriculum.

---

## Book 2 — complete ✅

| ID | Title | Widget | Status |
|----|-------|--------|--------|
| 2.1 | Why event-driven? | EventPatternComparison | ✅ |
| 2.2 | Kafka topics, partitions, offsets | KafkaTopicExplorer, KafkaPipelineVisualizer | ✅ |
| 2.3 | Producers and consumers | KafkaMessageFlow | ✅ |
| 2.4 | Chained consumer pattern | ChainedConsumerDiagram | ✅ |
| 2.5 | PostgreSQL and SQLx | PostgresSchemaDiagram | ✅ |
| 2.6 | Redis Pub/Sub | RedisPubSubLive | ✅ |
| 2.7 | Backpressure and replayability | KafkaOffsetRewind | ✅ |
| 2.8 | Docker Compose networking | ComposeNetworkMap | ✅ |
| 2.9 | Cloudflare Pages for Academy | PagesDeployFlow | ✅ |
| 2.10 | Book 2 capstone | KafkaPipelineVisualizer, ComposeNetworkMap | ✅ recap |

Mirror: `content/book-02-event-driven/`

Sources: `apps/academy/src/content/lessons/` · `apps/academy/src/data/labs-quizzes.ts`

---

## Widget inventory (Book 2 additions)

EventPatternComparison, KafkaTopicExplorer, KafkaMessageFlow, ChainedConsumerDiagram, PostgresSchemaDiagram, RedisPubSubLive, KafkaOffsetRewind, ComposeNetworkMap, PagesDeployFlow

---

## Next: Book 3 — Security & Privacy (11 lessons)

| Priority | Topic |
|----------|-------|
| **P0** | 3.1 Zero-trust · 3.2 JWT gateway |
| **P1** | 3.3–3.4 mTLS + CA bootstrap |
| **P2** | 3.5–3.7 WASM redaction, 1:1 encryption |
| **P3** | 3.11 BFF deep-dive (reference only) |

---

## Deploy checklist

```bash
pnpm install && pnpm build:academy
git push origin main   # Cloudflare Pages
```

---

## Reference docs

- [`millipede-e2e-map.md`](millipede-e2e-map.md) — architecture
- [`pdfs/README.md`](pdfs/README.md) — planning PDF index
