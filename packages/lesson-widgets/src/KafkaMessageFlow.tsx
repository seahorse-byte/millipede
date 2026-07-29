import { createSignal, For, onCleanup, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const STEPS = [
  { role: "Producer", label: "ingestion", action: "send(raw-dev-events, key=team-1, value=JSON)" },
  { role: "Broker", label: "kafka:9092", action: "append to partition 1 · offset 42" },
  { role: "Consumer", label: "llm-worker", action: "poll batch · deserialize · enrich" },
  { role: "Producer", label: "llm-worker", action: "send(enriched-dev-events, enriched JSON)" },
  { role: "Consumer", label: "analyzer", action: "commit offset · write Postgres" },
] as const;

export function KafkaMessageFlow() {
  const [step, setStep] = createSignal(0);
  const [running, setRunning] = createSignal(false);

  let timer: ReturnType<typeof setInterval> | undefined;

  const start = () => {
    if (timer) clearInterval(timer);
    setRunning(true);
    setStep(0);
    timer = setInterval(() => {
      setStep((s) => {
        if (s + 1 >= STEPS.length) {
          if (timer) clearInterval(timer);
          timer = undefined;
          setRunning(false);
          return s;
        }
        return s + 1;
      });
    }, 1100);
  };

  const stop = () => {
    if (timer) clearInterval(timer);
    timer = undefined;
    setRunning(false);
  };

  onCleanup(stop);

  return (
    <WidgetShell
      title="Producer → consumer flow"
      instructorNotes="Each service is both producer and consumer in a chain. Consumer groups share partition load."
    >
      {(mode) => (
        <div class="mw-kafka-flow">
          <For each={STEPS}>
            {(s, i) => (
              <div class="mw-kafka-flow-step" data-active={i() <= step()}>
                <span>{s.role}: {s.label}</span>
                <code>{s.action}</code>
              </div>
            )}
          </For>
          <div class="mw-toolbar">
            <button type="button" onClick={running() ? stop : start}>{running() ? "Pause" : "Animate"}</button>
            <button type="button" onClick={() => { stop(); setStep(0); }}>Reset</button>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: find the producer config in services/ingestion.</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
