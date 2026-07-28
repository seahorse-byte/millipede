import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const FRAMES = [
  { fn: "main()", vars: "— entry" },
  { fn: "handle_webhook()", vars: "body: JsonValue" },
  { fn: "publish_raw_event()", vars: "topic: raw-dev-events" },
  { fn: "kafka_producer.send()", vars: "partition, key, payload" },
] as const;

export function StackFrameVisualizer() {
  const [depth, setDepth] = createSignal(1);

  return (
    <WidgetShell
      title="Stack frames"
      instructorNotes="Heap holds long-lived data (Postgres rows). Stack holds in-flight call frames — each webhook handler push/pop."
    >
      {(mode) => (
        <div class="mw-stack">
          <div class="mw-toolbar">
            <button type="button" onClick={() => setDepth((d) => Math.min(d + 1, FRAMES.length))}>
              Call deeper
            </button>
            <button type="button" onClick={() => setDepth(1)}>
              Return to main
            </button>
          </div>
          <p class="mw-hint">Stack grows down on paper; here we show active frames top → bottom.</p>
          <div class="mw-stack-heap">
            <div class="mw-heap">
              <strong>Heap</strong>
              <span>team_events rows · Redis payloads · Kafka message buffers</span>
            </div>
            <div class="mw-stack-col">
              <For each={FRAMES}>
                {(frame, i) => (
                  <Show when={i() < depth()}>
                    <div class="mw-frame" data-top={i() === depth() - 1}>
                      <code>{frame.fn}</code>
                      <span>{frame.vars}</span>
                    </div>
                  </Show>
                )}
              </For>
            </div>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">
              Challenge: when ingestion returns HTTP 200, which frames were popped? What data stayed on the heap?
            </p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
