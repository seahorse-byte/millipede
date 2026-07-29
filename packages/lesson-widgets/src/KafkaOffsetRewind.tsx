import { createSignal, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

export function KafkaOffsetRewind() {
  const [committed, setCommitted] = createSignal(10);
  const [read, setRead] = createSignal(10);
  const [lag, setLag] = createSignal(0);

  const produceBurst = () => {
    setCommitted((c) => c + 5);
    setLag((l) => l + 5);
  };

  const consume = () => {
    if (lag() <= 0) return;
    setRead((r) => r + 1);
    setLag((l) => l - 1);
  };

  const rewind = () => {
    setRead(0);
    setLag(committed());
  };

  return (
    <WidgetShell
      title="Offsets, lag & replay"
      instructorNotes="Consumer lag = high watermark − committed offset. Rewind enables reprocessing (careful in prod)."
    >
      {(mode) => (
        <div class="mw-offset">
          <div class="mw-kafka-offset">
            <code>log end offset: {committed()} · consumer at: {read()} · lag: {lag()}</code>
          </div>
          <div class="mw-toolbar">
            <button type="button" onClick={produceBurst}>Burst produce (+5)</button>
            <button type="button" onClick={consume} disabled={lag() === 0}>Consume one</button>
            <button type="button" onClick={rewind}>Replay from offset 0</button>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: when would you reset a consumer group offset in dev vs prod?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
