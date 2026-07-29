import { createSignal, createEffect, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

export function SolidSignalGraph() {
  const [count, setCount] = createSignal(0);
  const doubled = () => count() * 2;
  const [lastEffect, setLastEffect] = createSignal("—");

  createEffect(() => {
    setLastEffect(`count=${count()} → doubled=${doubled()} → DOM text nodes updated`);
  });

  return (
    <WidgetShell
      title="SolidJS signal graph"
      instructorNotes="Signals are fine-grained — only subscribers re-run. Contrast with re-rendering a whole React tree on every poll."
    >
      {(mode) => (
        <div class="mw-signal">
          <div class="mw-signal-graph">
            <div class="mw-signal-node" data-active>
              <strong>count</strong>
              <code>{count()}</code>
            </div>
            <div class="mw-signal-edge">↓ derives</div>
            <div class="mw-signal-node" data-active={doubled() > 0}>
              <strong>doubled</strong>
              <code>{doubled()}</code>
            </div>
            <div class="mw-signal-edge">↓ effect</div>
            <div class="mw-signal-node">
              <strong>MetricCard text</strong>
              <code class="mw-signal-effect">{lastEffect()}</code>
            </div>
          </div>
          <div class="mw-toolbar">
            <button type="button" onClick={() => setCount((c) => c + 1)}>
              Increment (simulate SSE tick)
            </button>
            <button type="button" onClick={() => setCount(0)}>
              Reset
            </button>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">
              Challenge: which part of radar updates when only `total_events` changes?
            </p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
