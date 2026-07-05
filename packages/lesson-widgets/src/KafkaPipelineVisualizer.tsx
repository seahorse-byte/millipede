import { createSignal, For, onCleanup, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const STAGES = [
  { id: "ingest", label: "Axum Ingestion", topic: "raw-dev-events" },
  { id: "llm", label: "Python LLM Worker", topic: "enriched-dev-events" },
  { id: "analyzer", label: "Rust Analyzer", topic: "Postgres + Redis" },
  { id: "dash", label: "SolidJS Dashboard", topic: "live metrics" },
] as const;

export function KafkaPipelineVisualizer() {
  const [activeIndex, setActiveIndex] = createSignal(0);
  const [running, setRunning] = createSignal(false);

  let timer: ReturnType<typeof setInterval> | undefined;

  const start = () => {
    if (timer) clearInterval(timer);
    setRunning(true);
    setActiveIndex(0);
    timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % STAGES.length);
    }, 1200);
  };

  const stop = () => {
    if (timer) clearInterval(timer);
    timer = undefined;
    setRunning(false);
  };

  onCleanup(stop);

  return (
    <WidgetShell
      title="Kafka Pipeline"
      instructorNotes="Walk through chained consumer: raw → enriched → store → dashboard."
    >
      {(mode) => (
        <div class="mw-pipeline">
          <div class="mw-toolbar">
            <button type="button" onClick={start} disabled={running()}>
              Animate flow
            </button>
            <button type="button" onClick={stop} disabled={!running()}>
              Pause
            </button>
            <Show when={mode() === "step"}>
              <button
                type="button"
                onClick={() => setActiveIndex((i) => (i + 1) % STAGES.length)}
              >
                Next stage
              </button>
            </Show>
          </div>
          <For each={STAGES}>
            {(stage, index) => (
              <div class="mw-stage" data-active={activeIndex() === index()}>
                <span class="mw-stage-label">{stage.label}</span>
                <span class="mw-message">{stage.topic}</span>
              </div>
            )}
          </For>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">
              Challenge: after `docker compose up`, trace a webhook from ingestion to Postgres.
            </p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
