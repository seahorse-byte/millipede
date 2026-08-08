import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const LOOP = [
  "consumer.poll(1.0)",
  "msg.value() → JSON decode",
  "enrich_raw_event(raw)",
  "producer.produce(enriched-dev-events)",
  "LOG enriched event_id sentiment risk",
] as const;

export function PythonKafkaConsumer() {
  const [step, setStep] = createSignal(0);

  return (
    <WidgetShell
      title="Python Kafka consumer"
      instructorNotes="confluent_kafka Consumer + Producer in millipede_llm_worker/main.py"
    >
      {(mode) => (
        <div class="mw-python-kafka">
          <For each={LOOP}>
            {(line, i) => (
              <div class="mw-tokio-step" data-active={i() <= step()} data-current={i() === step()}>
                <span>python</span>
                <code>{line}</code>
              </div>
            )}
          </For>
          <div class="mw-toolbar">
            <button type="button" onClick={() => setStep((s) => Math.min(s + 1, LOOP.length - 1))}>Step</button>
            <button type="button" onClick={() => setStep(0)}>Reset</button>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: consumer group id default?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
