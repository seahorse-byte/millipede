import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const NODES = [
  { id: "parse", label: "parse_event", out: "notes: parsed" },
  { id: "score", label: "score_event", out: "sentiment + risk_score" },
  { id: "stamp", label: "stamp_event", out: "enriched_at ISO timestamp" },
] as const;

export function EnrichmentGraph() {
  const [active, setActive] = createSignal(0);

  return (
    <WidgetShell
      title="Enrichment graph"
      instructorNotes="graph.py — LangGraph-style sequential nodes; swap score_event for LLM when OPENAI_API_KEY set."
    >
      {(mode) => (
        <div class="mw-enrich-graph">
          <For each={NODES}>
            {(n, i) => (
              <button type="button" class="mw-compose-node" data-active={active() === i()} onClick={() => setActive(i())}>
                <strong>{n.label}</strong>
                <span>{n.out}</span>
              </button>
            )}
          </For>
          <p class="mw-hint">Pipeline: parse → score → stamp → publish JSON</p>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: which keywords bump heuristic risk_score?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
