import { createSignal, For, onCleanup, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const FLOW = [
  "curl POST :8081/webhooks/hello",
  "Kafka → llm-worker → analyzer",
  "Postgres team_events + Redis PUBLISH",
  "radar :5174 — Query poll + SSE",
  "Manager sees metrics + live Activity stream",
] as const;

export function RadarStage4Diagram() {
  const [step, setStep] = createSignal(0);
  const [running, setRunning] = createSignal(false);
  let timer: ReturnType<typeof setInterval> | undefined;

  const start = () => {
    if (timer) clearInterval(timer);
    setRunning(true);
    setStep(0);
    timer = setInterval(() => {
      setStep((s) => {
        if (s + 1 >= FLOW.length) {
          if (timer) clearInterval(timer);
          timer = undefined;
          setRunning(false);
          return s;
        }
        return s + 1;
      });
    }, 1000);
  };

  onCleanup(() => { if (timer) clearInterval(timer); });

  return (
    <WidgetShell
      title="Stage 4 end-to-end"
      instructorNotes="Capstone demo: millipede-demo + dev:radar — narrate backend then frontend."
    >
      {(mode) => (
        <div class="mw-radar-stage4">
          <For each={FLOW}>
            {(line, i) => (
              <div class="mw-tanstack-step" data-active={i() <= step()}>
                <span>step {i() + 1}</span>
                <code>{line}</code>
              </div>
            )}
          </For>
          <div class="mw-toolbar">
            <button type="button" onClick={start} disabled={running()}>Animate full demo</button>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: demo in 5 min — pipeline + radar + 1:1 WASM.</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
