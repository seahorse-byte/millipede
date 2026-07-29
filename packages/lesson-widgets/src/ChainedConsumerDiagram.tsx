import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const CHAIN = [
  { service: "ingestion", in: "HTTP webhook", out: "raw-dev-events", lang: "Rust" },
  { service: "llm-worker", in: "raw-dev-events", out: "enriched-dev-events", lang: "Python" },
  { service: "analyzer", in: "enriched-dev-events", out: "Postgres + Redis", lang: "Rust" },
  { service: "radar", in: "GET /api + SSE", out: "manager UI", lang: "SolidJS" },
] as const;

export function ChainedConsumerDiagram() {
  const [active, setActive] = createSignal(0);

  return (
    <WidgetShell
      title="Chained consumer pattern"
      instructorNotes="PDF5 pattern: each stage consumes one topic and may produce the next. No giant sync pipeline."
    >
      {(mode) => (
        <div class="mw-chain">
          <For each={CHAIN}>
            {(link, i) => (
              <div class="mw-chain-link" data-active={active() === i()}>
                <button type="button" class="mw-chain-btn" onClick={() => setActive(i())}>
                  <strong>{link.service}</strong> ({link.lang})
                </button>
                <code>{link.in} → {link.out}</code>
              </div>
            )}
          </For>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: what happens if llm-worker is down but ingestion keeps publishing?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
