import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const STAGES = [
  { id: "html", label: "Download HTML/JS", detail: "Vite serves SolidJS bundle to the browser" },
  { id: "parse", label: "Parse + compile", detail: "HTML → DOM tree · JS → bytecode + JIT" },
  { id: "signals", label: "SolidJS signals", detail: "Fine-grained subscriptions — no virtual DOM diff for every poll" },
  { id: "fetch", label: "TanStack Query fetch", detail: "GET /api/metrics/summary every 5s via dev proxy" },
  { id: "paint", label: "Render + paint", detail: "DOM updates → layout → pixels on screen" },
] as const;

export function BrowserRuntimeDiagram() {
  const [active, setActive] = createSignal(0);

  return (
    <WidgetShell
      title="Browser runtime"
      instructorNotes="Contrast with server Rust: browser is single-threaded JS + GPU paint. Radar dashboard is a client of analyzer."
    >
      {(mode) => (
        <div class="mw-pipeline">
          <div class="mw-toolbar">
            <For each={STAGES}>
              {(stage, i) => (
                <button type="button" data-active={active() === i()} onClick={() => setActive(i())}>
                  {i() + 1}
                </button>
              )}
            </For>
          </div>
          <div class="mw-stage" data-active="true">
            <span class="mw-stage-label">{STAGES[active()].label}</span>
            <span class="mw-message">{STAGES[active()].detail}</span>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">
              Challenge: open DevTools → Network while radar polls metrics. Which stage handles the JSON response?
            </p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
