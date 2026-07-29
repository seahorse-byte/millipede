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
| **Books 2–7** | ~52 lessons | **0** | Full books |
| **Widgets (Book 0 set)** | 10 widgets used | **10** built | — |
| **Widgets (Book 1 set)** | 14 lessons | **11** built | WasmRedaction reserved Book 3+ |
| **Page types** | 7 | **2** (`lesson`, `recap`) | lab/quiz as dedicated routes optional |
| **Lab + quiz UI** | Self-graded | **✅** panels on lesson pages | No server progress API |
| **Progress API** | Cloudflare Worker / D1 | **None** | Future |
| **PDFs in `docs/pdfs/`** | 6 planning PDFs | **README index** | Copy PDFs when available |
| **Hosting** | Cloudflare Pages | **✅** | — |

**Team Radar Stages 1–4** remain ahead of Books 2–6 curriculum.

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
| **Built (Book 0)** | BitRegister, BaseConverter, ByteAnatomy, HexColorMixer, StackFrameVisualizer, PacketJourney, RequestTimeline, BrowserRuntimeDiagram, TrustBoundaryDiagram, MtlsHandshake, KafkaPipelineVisualizer |
| **Built (Book 1)** | EventLoopSimulator, WasmBoundary, OwnershipVisualizer, BorrowCheckerPanel, ConcurrencyChannels, SendSyncExplorer, TokioFutureMachine, SolidSignalGraph, TanStackDataFlow |
| **Schema only (Book 2+)** | WasmRedaction, AgentEvalGate, ApiWorkerSplit, BffProxyFlow |

---

## Book 1 — complete ✅

| ID | Title | Widget | Status |
|----|-------|--------|--------|
| 1.1 | JavaScript single-threaded model | EventLoopSimulator | ✅ |
| 1.2 | Call stack, task queue, microtasks | EventLoopSimulator | ✅ |
| 1.3 | Promises and async/await | EventLoopSimulator | ✅ |
| 1.4 | WASM boundary | WasmBoundary | ✅ |
| 1.5 | Why Rust for infrastructure | — | ✅ |
| 1.6 | Ownership rules | OwnershipVisualizer | ✅ |
| 1.7 | Borrow checker deep dive | BorrowCheckerPanel | ✅ |
| 1.8 | Move, clone, and Copy | OwnershipVisualizer | ✅ |
| 1.9 | Fearless concurrency | ConcurrencyChannels | ✅ |
| 1.10 | Send and Sync traits | SendSyncExplorer | ✅ |
| 1.11 | Rust async and Tokio | TokioFutureMachine | ✅ |
| 1.12 | Book 1 capstone | RequestTimeline | ✅ recap |
| 1.13 | SolidJS signals | SolidSignalGraph | ✅ |
| 1.14 | TanStack Query and Router intro | TanStackDataFlow | ✅ |

Mirror: `content/book-01-runtimes/`

---

## Next: Book 2 — Event-Driven Architecture

| Priority | Lesson | Widget |
|----------|--------|--------|
| **P0** | 2.1 Why event-driven? | Pattern comparison (new) |
| **P1** | 2.2 Kafka topics/partitions | KafkaPipelineVisualizer |
| **P2** | 2.3–2.10 producers, consumers, schema | KafkaPipeline + new widgets |

See canonical plan for full Book 2–7 tables.

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
