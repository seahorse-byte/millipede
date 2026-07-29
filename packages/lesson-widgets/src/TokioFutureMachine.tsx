import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const STATES = [
  { id: "idle", label: "Idle", detail: "Router matched POST /webhooks/hello" },
  { id: "poll", label: "Poll", detail: "Future pinned on Tokio worker — handler starts" },
  { id: "await", label: "Await I/O", detail: "kafka_producer.send(...).await — task yields, other requests run" },
  { id: "resume", label: "Resume", detail: "Kafka ACK received — future wakes on same worker" },
  { id: "done", label: "Ready", detail: "Return Json(Accepted) — HTTP 200 to client" },
] as const;

export function TokioFutureMachine() {
  const [step, setStep] = createSignal(0);

  const advance = () => setStep((s) => Math.min(s + 1, STATES.length - 1));
  const reset = () => setStep(0);

  return (
    <WidgetShell
      title="Tokio future state machine"
      instructorNotes="One OS thread runs many tasks. .await is a yield point — not blocking the whole server like sync I/O would."
    >
      {(mode) => (
        <div class="mw-tokio">
          <For each={STATES}>
            {(state, i) => (
              <div
                class="mw-tokio-step"
                data-active={i() <= step()}
                data-current={i() === step()}
              >
                <span>{state.label}</span>
                <code>{state.detail}</code>
              </div>
            )}
          </For>
          <div class="mw-toolbar">
            <button type="button" onClick={advance} disabled={step() >= STATES.length - 1}>
              Step
            </button>
            <button type="button" onClick={reset}>
              Reset
            </button>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">
              Challenge: trace one webhook in services/ingestion — where is the first .await?
            </p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
