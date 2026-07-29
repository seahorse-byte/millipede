import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const EVENTS = ["github PR", "jira ticket", "slack pulse"] as const;

export function ConcurrencyChannels() {
  const [buffer, setBuffer] = createSignal<string[]>([]);
  const [processed, setProcessed] = createSignal<string[]>([]);
  const [nextEvent, setNextEvent] = createSignal(0);

  const send = () => {
    const label = EVENTS[nextEvent() % EVENTS.length];
    setNextEvent((n) => n + 1);
    setBuffer((b) => [...b, label]);
  };

  const recv = () => {
    setBuffer((b) => {
      if (b.length === 0) return b;
      const [head, ...rest] = b;
      setProcessed((p) => [...p, head]);
      return rest;
    });
  };

  const reset = () => {
    setBuffer([]);
    setProcessed([]);
    setNextEvent(0);
  };

  return (
    <WidgetShell
      title="Concurrency channels"
      instructorNotes="Rust channels (mpsc) move ownership between tasks — no shared mutable state. Tie to ingestion sending work to analyzer without locks on the hot path."
    >
      {(mode) => (
        <div class="mw-channel">
          <div class="mw-channel-grid">
            <div class="mw-channel-zone" data-role="sender">
              <h4>Producer (ingestion)</h4>
              <p class="mw-hint">tokio::spawn + tx.send(payload)</p>
              <button type="button" onClick={send}>
                Send event
              </button>
            </div>
            <div class="mw-channel-zone" data-role="buffer">
              <h4>Channel buffer</h4>
              <Show when={buffer().length === 0} fallback={<ul class="mw-el-list"><For each={buffer()}>{(e) => <li>{e}</li>}</For></ul>}>
                <p class="mw-el-empty">empty — receiver waiting</p>
              </Show>
            </div>
            <div class="mw-channel-zone" data-role="receiver">
              <h4>Consumer (analyzer task)</h4>
              <p class="mw-hint">while let Ok(msg) = rx.recv().await</p>
              <button type="button" onClick={recv} disabled={buffer().length === 0}>
                Receive
              </button>
            </div>
          </div>
          <div class="mw-channel-done">
            <strong>Processed:</strong>{" "}
            {processed().length === 0 ? "—" : processed().join(" → ")}
          </div>
          <div class="mw-toolbar">
            <button type="button" onClick={reset}>
              Reset
            </button>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">
              Challenge: why is a channel safer than a global `Vec` both tasks mutate?
            </p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}