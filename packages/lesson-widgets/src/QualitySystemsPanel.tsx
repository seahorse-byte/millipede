import { createSignal, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

export function QualitySystemsPanel() {
  const [evalRate, setEvalRate] = createSignal(100);
  const [e2ePass, setE2ePass] = createSignal(true);
  const [otelAvg, setOtelAvg] = createSignal(4.2);

  const healthy = () => evalRate() >= 80 && e2ePass() && otelAvg() < 50;

  return (
    <WidgetShell
      title="Quality systems dashboard"
      instructorNotes="Book 7.2 — gates replace heroics: eval CI + Playwright + latency budgets."
    >
      {(mode) => (
        <div class="mw-quality-panel">
          <div class="mw-channel-grid">
            <div class="mw-channel-zone">
              <h4>Eval gate</h4>
              <p>{evalRate()}% pass</p>
              <button type="button" onClick={() => setEvalRate(72)}>Simulate regression</button>
            </div>
            <div class="mw-channel-zone">
              <h4>Playwright smoke</h4>
              <p>{e2ePass() ? "4/4 green" : "FAIL"}</p>
              <button type="button" onClick={() => setE2ePass(false)}>Simulate UI break</button>
            </div>
            <div class="mw-channel-zone">
              <h4>Enrichment latency</h4>
              <p>{otelAvg()} ms avg</p>
              <button type="button" onClick={() => setOtelAvg(120)}>Simulate slowdown</button>
            </div>
          </div>
          <p class={`mw-badge ${healthy() ? "mw-badge--ok" : "mw-badge--warn"}`}>
            Release gate: {healthy() ? "OPEN" : "BLOCKED"}
          </p>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: which gate catches a WASM regression vs a scorer drift?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
