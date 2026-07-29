import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const PATTERNS = [
  {
    id: "sync",
    name: "Synchronous chain",
    flow: "Webhook → enrich → DB → respond",
    pros: "Simple mental model",
    cons: "Client waits; one failure blocks all",
  },
  {
    id: "async",
    name: "Async in-process",
    flow: "Webhook spawns tasks → respond early",
    pros: "Faster HTTP response",
    cons: "Lost on crash; hard to scale workers",
  },
  {
    id: "events",
    name: "Event-driven (millipede)",
    flow: "Webhook → Kafka → workers → DB",
    pros: "Replay, scale consumers, decouple",
    cons: "Operational complexity (topics, offsets)",
  },
] as const;

export function EventPatternComparison() {
  const [selected, setSelected] = createSignal<(typeof PATTERNS)[number]["id"]>("events");
  const row = () => PATTERNS.find((p) => p.id === selected())!;

  return (
    <WidgetShell
      title="Architecture patterns"
      instructorNotes="Team Radar returns HTTP 200 before LLM finishes — event log is the source of truth."
    >
      {(mode) => (
        <div class="mw-pattern">
          <div class="mw-toolbar">
            <For each={PATTERNS}>
              {(p) => (
                <button type="button" data-active={selected() === p.id} onClick={() => setSelected(p.id)}>
                  {p.name}
                </button>
              )}
            </For>
          </div>
          <p class="mw-hint"><strong>Flow:</strong> {row().flow}</p>
          <p class="mw-hint"><strong>Pros:</strong> {row().pros}</p>
          <p class="mw-hint"><strong>Cons:</strong> {row().cons}</p>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: why is sync enrichment a bad fit for 30s LLM calls?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
