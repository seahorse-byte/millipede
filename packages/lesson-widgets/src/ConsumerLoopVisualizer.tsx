import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const LOOP = [
  "consumer.recv().await",
  "parse JSON → RawEvent",
  "persist_event(pool)",
  "warm_redis(client)",
  "auto-commit offset",
] as const;

export function ConsumerLoopVisualizer() {
  const [step, setStep] = createSignal(0);

  return (
    <WidgetShell
      title="Analyzer consumer loop"
      instructorNotes="group.id millipede-analyzer · topic enriched-dev-events (Stage 3+) or raw for skeleton lab"
    >
      {(mode) => (
        <div class="mw-consumer">
          <For each={LOOP}>
            {(line, i) => (
              <div class="mw-tokio-step" data-active={i() <= step()} data-current={i() === step()}>
                <span>step {i() + 1}</span>
                <code>{line}</code>
              </div>
            )}
          </For>
          <div class="mw-toolbar">
            <button type="button" onClick={() => setStep((s) => Math.min(s + 1, LOOP.length - 1))}>Step</button>
            <button type="button" onClick={() => setStep(0)}>Reset</button>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: what happens on JSON parse error — commit or skip?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
