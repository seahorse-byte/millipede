import { createSignal, For, onCleanup, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const HOPS = [
  { layer: "Application", label: "DNS lookup", detail: "localhost → 127.0.0.1 (or ::1)" },
  { layer: "Transport", label: "TCP handshake", detail: "SYN → SYN-ACK → ACK on port 8081" },
  { layer: "Application", label: "HTTP request line", detail: "POST /webhooks/hello HTTP/1.1" },
  { layer: "Application", label: "HTTP headers", detail: "Host: localhost:8081 · Content-Type: application/json · Content-Length: …" },
  { layer: "Application", label: "HTTP body", detail: "JSON bytes cross the socket as raw payload" },
  { layer: "Application", label: "HTTP response", detail: "HTTP/1.1 200 OK · Content-Type: application/json · body" },
] as const;

export function PacketJourney() {
  const [index, setIndex] = createSignal(0);
  const [running, setRunning] = createSignal(false);
  let timer: ReturnType<typeof setInterval> | undefined;

  const play = () => {
    if (timer) clearInterval(timer);
    setRunning(true);
    setIndex(0);
    timer = setInterval(() => {
      setIndex((i) => {
        if (i + 1 >= HOPS.length) {
          if (timer) clearInterval(timer);
          timer = undefined;
          setRunning(false);
          return i;
        }
        return i + 1;
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
      title="Packet journey"
      instructorNotes="Pair with `curl -v`: students should match each verbose line to a hop."
    >
      {(mode) => (
        <div class="mw-timeline">
          <div class="mw-toolbar">
            <button type="button" onClick={play} disabled={running()}>
              Trace packet
            </button>
            <button type="button" onClick={stop} disabled={!running()}>
              Pause
            </button>
            <Show when={mode() === "step"}>
              <button type="button" onClick={() => setIndex((i) => Math.min(i + 1, HOPS.length - 1))}>
                Next hop
              </button>
            </Show>
          </div>
          <For each={HOPS}>
            {(hop, i) => (
              <div class="mw-timeline-step" data-active={index() === i()} data-done={index() > i()}>
                <div class="mw-timeline-marker">{i() + 1}</div>
                <div class="mw-timeline-body">
                  <div class="mw-timeline-head">
                    <span class="mw-timeline-actor">{hop.layer}</span>
                    <span class="mw-timeline-label">{hop.label}</span>
                  </div>
                  <code class="mw-timeline-detail">{hop.detail}</code>
                </div>
              </div>
            )}
          </For>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">
              Challenge: run `curl -v` against :8081 and label which lines are TCP vs HTTP vs TLS (if any).
            </p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
