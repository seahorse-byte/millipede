import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const TABLES = [
  {
    name: "team_events",
    columns: ["id TEXT PK", "source TEXT", "payload_json TEXT", "sentiment REAL", "risk_score REAL", "created_at TEXT"],
    note: "One row per enriched dev event",
  },
  {
    name: "team_metrics",
    columns: ["id TEXT PK", "team_id TEXT", "metric_type TEXT", "value REAL", "computed_at TEXT"],
    note: "Aggregates for dashboard cards",
  },
] as const;

export function PostgresSchemaDiagram() {
  const [selected, setSelected] = createSignal(0);
  const table = () => TABLES[selected()];

  return (
    <WidgetShell
      title="Postgres schema (SQLx)"
      instructorNotes="Schema in infra/docker/init-db.sql. Analyzer uses SQLx — compile-time checked queries."
    >
      {(mode) => (
        <div class="mw-pg-schema">
          <div class="mw-toolbar">
            <For each={TABLES}>
              {(t, i) => (
                <button type="button" data-active={selected() === i()} onClick={() => setSelected(i())}>
                  {t.name}
                </button>
              )}
            </For>
          </div>
          <ul class="mw-el-list">
            <For each={table().columns}>{(col) => <li><code>{col}</code></li>}</For>
          </ul>
          <p class="mw-hint">{table().note}</p>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: which column does the LLM worker populate?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
