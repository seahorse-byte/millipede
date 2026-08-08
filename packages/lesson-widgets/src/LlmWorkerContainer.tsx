import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const STEPS = [
  "cd services/llm-worker && python3 -m venv .venv",
  "pip install -e .",
  "pnpm llm-worker:dev  (from repo root)",
  "Consumes raw-dev-events → produces enriched-dev-events",
] as const;

export function LlmWorkerContainer() {
  const [done, setDone] = createSignal(0);

  return (
    <WidgetShell
      title="Python LLM worker"
      instructorNotes="Heuristic scoring by default — set OPENAI_API_KEY for real LLM mode."
    >
      {(mode) => (
        <div class="mw-llm-container">
          <For each={STEPS}>
            {(step, i) => (
              <div class="mw-own-line" data-kind={i() < done() ? "ok" : "pending"}>
                <span>{i() + 1}</span>
                <code>{step}</code>
              </div>
            )}
          </For>
          <div class="mw-toolbar">
            <button type="button" onClick={() => setDone((d) => Math.min(d + 1, STEPS.length))}>Next setup step</button>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: which env var switches input topic?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
