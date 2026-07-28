# Academy catch-up status

Living tracker against the canonical plan: `~/.claude/plans/cursor/millipede_learning_journey_0db313c1.plan.md`

**Dev:** `pnpm dev:academy` → http://localhost:4321  
**Deploy:** https://millipede-academy.pages.dev · checklist [`academy-deploy-checklist.md`](academy-deploy-checklist.md)

---

## Overall progress

| Area | Plan | Shipped | Gap |
|------|------|---------|-----|
| **Book 0** | 10 lessons | **10** ✅ | — |
| **Books 1–7** | ~56 lessons | **0** | Full books |
| **Widgets (Book 0 set)** | 10 widgets used | **10** built | Book 1+ widgets remain |
| **Page types** | 7 | **2** (`lesson`, `recap`) | lab/quiz as dedicated routes optional |
| **Lab + quiz UI** | Self-graded | **✅** panels on lesson pages | No server progress API |
| **Progress API** | Cloudflare Worker / D1 | **None** | Future |
| **PDFs in `docs/pdfs/`** | 6 planning PDFs | **README index** | Copy PDFs when available |
| **Hosting** | Cloudflare Pages | **✅** | — |

**Team Radar Stages 1–4** remain ahead of Books 1–6 curriculum.

---

## Book 0 — complete ✅

| ID | Title | Widget | Status |
|----|-------|--------|--------|
| 0.1 | What is a computer, really? | BitRegister | ✅ |
| 0.2 | Binary, hex, and encoding | BaseConverter, ByteAnatomy, HexColorMixer | ✅ |
| 0.3 | Memory, stack, and heap | StackFrameVisualizer | ✅ |
| 0.4 | How the internet routes packets | PacketJourney | ✅ |
| 0.5 | Client-server architecture | RequestTimeline | ✅ |
| 0.6 | The browser as a runtime | BrowserRuntimeDiagram | ✅ |
| 0.7 | Same-origin, CORS, cookies | TrustBoundaryDiagram | ✅ |
| 0.8 | Web security primitives (TLS/mTLS) | MtlsHandshake | ✅ |
| 0.9 | God Project mental model | KafkaPipelineVisualizer | ✅ |
| 0.10 | Book 0 capstone | KafkaPipelineVisualizer | ✅ recap |

Each lesson with `lab_id` / `quiz_id` renders **LabPanel** and **QuizPanel** (self-graded, no backend).

Sources:

- `apps/academy/src/content/lessons/` — runtime
- `content/book-00-foundations/` — mirror
- `apps/academy/src/data/labs-quizzes.ts` — lab steps + quiz answers

---

## Widget inventory (full package)

| Status | Widgets |
|--------|---------|
| **Built (10 Book 0)** | BitRegister, BaseConverter, ByteAnatomy, HexColorMixer, StackFrameVisualizer, PacketJourney, RequestTimeline, BrowserRuntimeDiagram, TrustBoundaryDiagram, MtlsHandshake, KafkaPipelineVisualizer |
| **Schema only (Book 1+)** | EventLoopSimulator, OwnershipVisualizer, BorrowCheckerPanel, ConcurrencyChannels, WasmBoundary, WasmRedaction, AgentEvalGate, ApiWorkerSplit, BffProxyFlow |

---

## Next: Book 1 — Runtimes & Languages

| Priority | Lesson | Widget |
|----------|--------|--------|
| **P0** | 1.1 JS single-threaded model | EventLoopSimulator |
| **P1** | 1.5–1.7 Rust ownership | OwnershipVisualizer, BorrowCheckerPanel |
| **P2** | 1.4 WASM boundary | WasmBoundary (+ link redact-wasm) |

See canonical plan for full Book 1–7 tables.

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
