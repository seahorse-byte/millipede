import { For } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const KPI_ROWS = [
  { signal: "avg_sentiment", outcome: "Team morale proxy", panel: "Manager KPIs" },
  { signal: "high_risk_count", outcome: "Security attention queue", panel: "Manager KPIs" },
  { signal: "friction_index", outcome: "Delivery drag composite", panel: "Manager KPIs" },
  { signal: "eval_pass_rate", outcome: "AI enrichment quality", panel: "Eval pass rate" },
] as const;

export function KpiDictionary() {
  return (
    <WidgetShell
      title="Team Radar KPI dictionary"
      instructorNotes="Maps Postgres/Redis signals to manager outcomes — lesson 7.1 deliverable."
    >
      {() => (
        <table class="mw-table">
          <thead>
            <tr>
              <th>Signal</th>
              <th>Outcome</th>
              <th>UI</th>
            </tr>
          </thead>
          <tbody>
            <For each={KPI_ROWS}>
              {(row) => (
                <tr>
                  <td>
                    <code>{row.signal}</code>
                  </td>
                  <td>{row.outcome}</td>
                  <td>{row.panel}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      )}
    </WidgetShell>
  );
}
