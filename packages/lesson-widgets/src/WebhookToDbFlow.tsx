import { createSignal, For, onCleanup, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const STEPS = [
  { label: "curl POST", detail: ":8081/webhooks/hello → ingestion" },
  { label: "Kafka", detail: "raw-dev-events (ingestion) → enriched-dev-events (llm Stage 3)" },
  { label: "Consumer", detail: "analyzer run_consumer recv()" },
  { label: "Postgres", detail: "INSERT team_events ON CONFLICT DO UPDATE" },
  { label: "Query", detail: "GET :8082/api/metrics/summary" },
] as const;

export function WebhookToDbFlow() {
  const [step, setStep] = createSignal(0);
  const [running, setRunning] = createSignal(false);
  let timer: ReturnType<typeof setInterval> | undefined;

  const start = () => {
    if (timer) clearInterval(timer);
    setRunning(true);
    setStep(0);
    timer = setInterval(() => {
      setStep((s) => {
        if (s + 1 >= STEPS.length) {
          if (timer) clearInterval(timer);
          timer = undefined;
          setRunning(false);
          return s;
        }
        return s + 1;
      });
    }, 1100);
  };

  onCleanup(() => { if (timer) clearInterval(timer); });

  return (
    <WidgetShell
      title="Webhook → Postgres"
      instructorNotes="Stage 1 capstone path — Stage 3 adds llm-worker between Kafka hops."
    >
      {(mode) => (
        <div class="mw-webhook-db">
          <For each={STEPS}>
            {(s, i) => (
              <div class="mw-tanstack-step" data-active={i() <= step()}>
                <span>{s.label}</span>
                <code>{s.detail}</code>
              </div>
            )}
          </For>
          <div class="mw-toolbar">
            <button type="button" onClick={start} disabled={running()}>Animate Stage 1</button>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: psql query to verify latest team_events row.</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
