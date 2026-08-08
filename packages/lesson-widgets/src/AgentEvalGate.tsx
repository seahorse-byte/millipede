import { createSignal, For, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

const CASES = [
  { id: "ship-positive", pass: true, detail: "sentiment=0.800 risk=0.000" },
  { id: "security-high-risk", pass: true, detail: "sentiment=0.667 risk=0.800" },
  { id: "secret-leak", pass: true, detail: "sentiment=0.667 risk=0.400" },
] as const;

export function AgentEvalGate() {
  const [ran, setRan] = createSignal(false);
  const passRate = () => (ran() ? 100 : 0);

  return (
    <WidgetShell
      title="Agent eval CI gate"
      instructorNotes="evals/run_evals.py — exit 1 on failure. pnpm evals:write-metrics → team_metrics."
    >
      {(mode) => (
        <div class="mw-eval-gate">
          <div class="mw-toolbar">
            <button type="button" onClick={() => setRan(true)}>
              Run eval gate
            </button>
            <span class={`mw-badge ${ran() ? "mw-badge--ok" : "mw-badge--warn"}`}>
              {ran() ? "PASS" : "IDLE"}
            </span>
          </div>
          <p class="mw-hint">Pass rate: {passRate()}% · cases: {CASES.length}</p>
          <Show when={ran()}>
            <For each={CASES}>
              {(item) => (
                <div class="mw-own-line" data-kind="ok">
                  <span>[PASS]</span>
                  <code>
                    {item.id}: {item.detail}
                  </code>
                </div>
              )}
            </For>
          </Show>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: what breaks if you rename a RISK keyword in enrich.py?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
