import { createSignal, For, onCleanup, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const STEPS = [
  {
    id: "compose",
    actor: "Client",
    label: "Compose HTTP request",
    detail: "POST /webhooks/hello · Content-Type: application/json · body: {\"source\":\"github\"}",
  },
  {
    id: "connect",
    actor: "Network",
    label: "Open TCP connection",
    detail: "Client → localhost:8081 (ingestion listens; server waits for bytes)",
  },
  {
    id: "receive",
    actor: "Server",
    label: "Axum parses the request",
    detail: "Method, path, headers, JSON body → Rust structs",
  },
  {
    id: "work",
    actor: "Server",
    label: "Business logic runs",
    detail: "Validate payload · assign event_id · publish to Kafka raw-dev-events",
  },
  {
    id: "respond",
    actor: "Server",
    label: "HTTP response sent",
    detail: "200 JSON: {\"accepted\":true,\"kafka_status\":\"published\"} — connection may close",
  },
  {
    id: "async",
    actor: "Background",
    label: "Pipeline continues without the client",
    detail: "llm-worker → analyzer → Postgres/Redis → radar UI (other clients poll/SSE)",
  },
] as const;

export function RequestTimeline() {
  const [activeIndex, setActiveIndex] = createSignal(0);
  const [running, setRunning] = createSignal(false);

  let timer: ReturnType<typeof setInterval> | undefined;

  const start = () => {
    if (timer) clearInterval(timer);
    setRunning(true);
    setActiveIndex(0);
    timer = setInterval(() => {
      setActiveIndex((i) => {
        if (i + 1 >= STEPS.length) {
          if (timer) clearInterval(timer);
          timer = undefined;
          setRunning(false);
          return i;
        }
        return i + 1;
      });
    }, 1400);
  };

  const stop = () => {
    if (timer) clearInterval(timer);
    timer = undefined;
    setRunning(false);
  };

  onCleanup(stop);

  return (
    <WidgetShell
      title="Request timeline"
      instructorNotes="Stress: HTTP response returns before Kafka consumers finish. The curl client is not the dashboard — two different clients, one server-side pipeline."
    >
      {(mode) => (
        <div class="mw-timeline">
          <div class="mw-toolbar">
            <button type="button" onClick={start} disabled={running()}>
              Play timeline
            </button>
            <button type="button" onClick={stop} disabled={!running()}>
              Pause
            </button>
            <Show when={mode() === "step"}>
              <button
                type="button"
                onClick={() => setActiveIndex((i) => Math.min(i + 1, STEPS.length - 1))}
              >
                Next hop
              </button>
              <button type="button" onClick={() => setActiveIndex(0)}>
                Reset
              </button>
            </Show>
          </div>

          <For each={STEPS}>
            {(step, index) => (
              <div
                class="mw-timeline-step"
                data-active={activeIndex() === index()}
                data-done={activeIndex() > index()}
              >
                <div class="mw-timeline-marker">{index() + 1}</div>
                <div class="mw-timeline-body">
                  <div class="mw-timeline-head">
                    <span class="mw-timeline-actor">{step.actor}</span>
                    <span class="mw-timeline-label">{step.label}</span>
                  </div>
                  <code class="mw-timeline-detail">{step.detail}</code>
                </div>
              </div>
            )}
          </For>

          <Show when={mode() === "challenge"}>
            <p class="mw-hint">
              Challenge: on paper, draw two clients (curl + browser) and three server roles
              (ingestion, analyzer, radar dev proxy). Where does each HTTP request start and end?
            </p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
