import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

type Phase = "owned" | "moved" | "borrowed";

const VALUE = 'String::from("webhook payload")';

export function OwnershipVisualizer() {
  const [phase, setPhase] = createSignal<Phase>("owned");
  const owner = () => "ingestion_handler";

  const lines = () => {
    if (phase() === "owned") {
      return [
        { label: "owner", text: `${owner()} owns ${VALUE}` },
        { label: "stack", text: "value valid while owner in scope" },
      ];
    }
    if (phase() === "moved") {
      return [
        { label: "move", text: `kafka_publish(${VALUE}) — ownership transferred` },
        { label: "error", text: `${owner()} no longer valid here (use after move)` },
      ];
    }
    return [
      { label: "borrow", text: `let slice: &str = &payload` },
      { label: "read", text: `${owner()} still owns; slice is temporary view` },
    ];
  };

  return (
    <WidgetShell
      title="Ownership"
      instructorNotes="Rust services avoid GC pauses — ownership is checked at compile time. Tie to ingestion handing bytes to Kafka producer."
    >
      {(mode) => (
        <div class="mw-own">
          <div class="mw-toolbar">
            <button type="button" data-active={phase() === "owned"} onClick={() => setPhase("owned")}>
              Own
            </button>
            <button type="button" data-active={phase() === "moved"} onClick={() => setPhase("moved")}>
              Move
            </button>
            <button type="button" data-active={phase() === "borrowed"} onClick={() => setPhase("borrowed")}>
              Borrow (&)
            </button>
          </div>
          <div class="mw-own-box">
            <strong>Owner:</strong> <code>{owner()}</code>
          </div>
          <For each={lines()}>
            {(line) => (
              <div class="mw-own-line" data-kind={line.label}>
                <span>{line.label}</span>
                <code>{line.text}</code>
              </div>
            )}
          </For>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">
              Challenge: why does Kafka publish often take ownership of the payload buffer?
            </p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
