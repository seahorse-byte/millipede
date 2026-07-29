import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const TYPES = [
  {
    id: "string",
    name: "String",
    send: false,
    sync: false,
    note: "Move into thread — cannot share &str across threads without 'static lifetime.",
  },
  {
    id: "arc-mutex",
    name: "Arc<Mutex<Metrics>>",
    send: true,
    sync: true,
    note: "Shared state across Tokio tasks — lock at runtime, Send+Sync when T is.",
  },
  {
    id: "rc",
    name: "Rc<Config>",
    send: false,
    sync: false,
    note: "Single-thread reference count — fine in one task, not for thread pool.",
  },
  {
    id: "kafka-producer",
    name: "FutureProducer (rdkafka)",
    send: true,
    sync: true,
    note: "Ingestion holds producer across async handlers — must be Send.",
  },
] as const;

export function SendSyncExplorer() {
  const [selected, setSelected] = createSignal<(typeof TYPES)[number]["id"]>("arc-mutex");
  const row = () => TYPES.find((t) => t.id === selected())!;

  return (
    <WidgetShell
      title="Send / Sync traits"
      instructorNotes="Send = safe to move to another thread. Sync = safe to share &T across threads. Axum handlers and Kafka clients must be Send."
    >
      {(mode) => (
        <div class="mw-send-sync">
          <div class="mw-toolbar">
            <For each={TYPES}>
              {(t) => (
                <button type="button" data-active={selected() === t.id} onClick={() => setSelected(t.id)}>
                  {t.name}
                </button>
              )}
            </For>
          </div>
          <div class="mw-send-sync-badges">
            <span data-ok={row().send}>Send: {row().send ? "✓" : "✗"}</span>
            <span data-ok={row().sync}>Sync: {row().sync ? "✓" : "✗"}</span>
          </div>
          <p class="mw-hint">{row().note}</p>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">
              Challenge: why must `State` in Axum implement Send + Sync?
            </p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
