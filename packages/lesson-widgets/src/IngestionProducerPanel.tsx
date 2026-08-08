import { createSignal, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

export function IngestionProducerPanel() {
  const [eventId] = createSignal("evt-8f3a…");
  const [status, setStatus] = createSignal<"idle" | "sent" | "failed">("idle");

  const send = () => setStatus("sent");
  const fail = () => setStatus("failed");

  return (
    <WidgetShell
      title="Kafka producer from Axum"
      instructorNotes="FutureProducer.send(FutureRecord::to(topic).key(&event_id).payload(json))"
    >
      {(mode) => (
        <div class="mw-producer">
          <pre class="mw-el-code">{`FutureRecord::to("raw-dev-events")
  .key("${eventId()}")
  .payload('{"id":"…","source":"github",…}')`}</pre>
          <div class="mw-toolbar">
            <button type="button" onClick={send}>send().await → Ok</button>
            <button type="button" onClick={fail}>Simulate broker down</button>
          </div>
          <p class="mw-hint">
            Response kafka_status:{" "}
            <strong>{status() === "idle" ? "—" : status() === "sent" ? "published" : "unavailable"}</strong>
            {" "}(accepted: true either way in dev)
          </p>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: find message.timeout.ms in ingestion ClientConfig.</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
