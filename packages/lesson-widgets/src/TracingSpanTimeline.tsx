import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const SPANS = [
  { level: "INFO", target: "millipede_ingestion", msg: "published event event_id=… topic=raw-dev-events" },
  { level: "INFO", target: "millipede_analyzer", msg: "analyzer consuming enriched events" },
  { level: "INFO", target: "millipede_analyzer", msg: "stored team event event_id=… source=github" },
  { level: "INFO", target: "millipede_analyzer", msg: "redis cache warmed event_id=…" },
  { level: "WARN", target: "millipede_ingestion", msg: "kafka publish failed — accepting webhook (dev)" },
] as const;

export function TracingSpanTimeline() {
  const [visible, setVisible] = createSignal(3);
  const [showWarn, setShowWarn] = createSignal(false);

  const lines = () => SPANS.slice(0, showWarn() ? visible() + 1 : visible());

  return (
    <WidgetShell
      title="Structured logging (tracing)"
      instructorNotes="RUST_LOG=millipede_ingestion=info,millipede_analyzer=info — correlate by event_id field."
    >
      {(mode) => (
        <div class="mw-tracing">
          <For each={lines()}>
            {(line) => (
              <div class="mw-own-line" data-kind={line.level === "WARN" ? "error" : "ok"}>
                <span>{line.level} {line.target}</span>
                <code>{line.msg}</code>
              </div>
            )}
          </For>
          <div class="mw-toolbar">
            <button type="button" onClick={() => setVisible((v) => Math.min(v + 1, 4))}>Show next span</button>
            <button type="button" onClick={() => setShowWarn(true)}>Simulate Kafka down</button>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: grep logs for one event_id across both services.</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
