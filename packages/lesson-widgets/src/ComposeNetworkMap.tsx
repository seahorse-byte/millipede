import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const NODES = [
  { id: "host", label: "Host (your laptop)", ports: "curl :8081 · radar :5174" },
  { id: "kafka", label: "kafka", ports: "9092 → broker" },
  { id: "postgres", label: "postgres", ports: "5432 → team_radar DB" },
  { id: "redis", label: "redis", ports: "6379 → pub/sub" },
  { id: "ingestion", label: "millipede-ingestion", ports: "8081 (compose service)" },
  { id: "llm", label: "millipede-llm-worker", ports: "consumes Kafka" },
  { id: "analyzer", label: "millipede-analyzer", ports: "8082 health" },
] as const;

export function ComposeNetworkMap() {
  const [highlight, setHighlight] = createSignal<(typeof NODES)[number]["id"]>("kafka");

  return (
    <WidgetShell
      title="Docker Compose network"
      instructorNotes="Services on compose network resolve by service name (kafka:9092). Host uses localhost ports."
    >
      {(mode) => (
        <div class="mw-compose">
          <For each={NODES}>
            {(n) => (
              <button
                type="button"
                class="mw-compose-node"
                data-active={highlight() === n.id}
                onClick={() => setHighlight(n.id)}
              >
                <strong>{n.label}</strong>
                <span>{n.ports}</span>
              </button>
            )}
          </For>
          <p class="mw-hint">
            Selected: <code>{NODES.find((n) => n.id === highlight())!.label}</code> — see infra/docker/
          </p>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: why does ingestion use kafka:9092 inside compose but localhost:9092 from host?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
