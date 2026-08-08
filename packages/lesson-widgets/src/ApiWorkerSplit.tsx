import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const BOUNDARY = {
  api: [
    "HTTP /webhooks/* — validate JSON",
    "Assign event_id UUID",
    "Publish to Kafka — no LLM here",
    "Return 200 accepted quickly",
  ],
  worker: [
    "Kafka consumer — long-running",
    "LLM enrichment (Stage 3 Python)",
    "Postgres + Redis writes",
    "No direct browser access",
  ],
} as const;

export function ApiWorkerSplit() {
  const [side, setSide] = createSignal<"api" | "worker">("api");

  return (
    <WidgetShell
      title="API vs worker split"
      instructorNotes="ingestion = API edge. analyzer + llm-worker = async workers. Pattern from ai-pentest reference doc."
    >
      {(mode) => (
        <div class="mw-api-worker">
          <div class="mw-toolbar">
            <button type="button" data-active={side() === "api"} onClick={() => setSide("api")}>ingestion (API)</button>
            <button type="button" data-active={side() === "worker"} onClick={() => setSide("worker")}>analyzer / llm (worker)</button>
          </div>
          <ul class="mw-el-list">
            <For each={BOUNDARY[side()]}>{(line) => <li>{line}</li>}</For>
          </ul>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: why must LLM not run inside the webhook handler?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
