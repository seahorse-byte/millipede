import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const STEPS = [
  "Open radar :5174 — narrate KPI row",
  "pnpm evals:run — show eval gate",
  "curl webhook — live feed updates",
  "1:1 portal — WASM redaction demo",
  "Close — quality systems vs heroics",
] as const;

export function EmMockClassFlow() {
  const [step, setStep] = createSignal(0);

  return (
    <WidgetShell
      title="45-minute mock class run-of-show"
      instructorNotes="Lesson 7.6 — use millipede-demo tmux layout + this checklist."
    >
      {(mode) => (
        <div class="mw-mock-class">
          <ol class="mw-step-list">
            <For each={STEPS}>
              {(label, index) => (
                <li class={index() <= step() ? "mw-step--done" : ""}>{label}</li>
              )}
            </For>
          </ol>
          <div class="mw-toolbar">
            <button type="button" onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}>
              Next beat
            </button>
            <button type="button" onClick={() => setStep(0)}>Reset</button>
          </div>
          <Show when={mode() === "instructor"}>
            <p class="mw-hint">Timing: ~8 min intro · 20 min demo · 10 min lab · 7 min Q&A</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
