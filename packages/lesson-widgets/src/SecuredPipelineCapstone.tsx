import { createSignal, For, onCleanup, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const STAGES = [
  "JWT curl → gateway :8443",
  "gateway mTLS → ingestion webhook",
  "raw-dev-events → llm-worker",
  "enriched-dev-events → analyzer",
  "Postgres + Redis → radar :5174",
] as const;

export function SecuredPipelineCapstone() {
  const [step, setStep] = createSignal(0);
  const [running, setRunning] = createSignal(false);
  let timer: ReturnType<typeof setInterval> | undefined;

  const start = () => {
    if (timer) clearInterval(timer);
    setRunning(true);
    setStep(0);
    timer = setInterval(() => {
      setStep((s) => {
        if (s + 1 >= STAGES.length) {
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
      title="Secured pipeline capstone"
      instructorNotes="Book 5 end state: Stage 2 gateway + Stage 3 LLM + Stage 1 persistence + Stage 4 radar."
    >
      {(mode) => (
        <div class="mw-secured-capstone">
          <For each={STAGES}>
            {(s, i) => (
              <div class="mw-tanstack-step" data-active={i() <= step()}>
                <span>{i() + 1}</span>
                <code>{s}</code>
              </div>
            )}
          </For>
          <div class="mw-toolbar">
            <button type="button" onClick={start} disabled={running()}>Animate Stages 2–4</button>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: 5-minute demo script for EM interview.</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
