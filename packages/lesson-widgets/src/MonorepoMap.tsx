import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const DIRS = [
  { path: "apps/academy", role: "Teach — Astro lessons" },
  { path: "apps/radar", role: "Ship — SolidJS dashboard (Stage 4)" },
  { path: "services/ingestion", role: "Ship — Axum webhook → Kafka" },
  { path: "services/analyzer", role: "Ship — Kafka consumer → Postgres/Redis" },
  { path: "services/gateway", role: "Ship — JWT + mTLS (Stage 2)" },
  { path: "services/llm-worker", role: "Ship — Python enrichment (Stage 3)" },
  { path: "packages/lesson-widgets", role: "Shared — Academy interactives" },
  { path: "infra/docker", role: "Local — Kafka + Postgres + Redis" },
] as const;

export function MonorepoMap() {
  const [selected, setSelected] = createSignal(0);
  const row = () => DIRS[selected()];

  return (
    <WidgetShell
      title="Monorepo layout"
      instructorNotes="Book 4 build-along lives in services/ + infra/docker — Academy teaches from apps/academy."
    >
      {(mode) => (
        <div class="mw-monorepo">
          <For each={DIRS}>
            {(d, i) => (
              <button type="button" class="mw-compose-node" data-active={selected() === i()} onClick={() => setSelected(i())}>
                <strong>{d.path}</strong>
                <span>{d.role}</span>
              </button>
            )}
          </For>
          <p class="mw-hint">Selected: <code>{row().path}</code> — {row().role}</p>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: which directory owns Stage 1 webhook code?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
