import { createSignal, Show } from "solid-js";
import { WidgetShell } from "./WidgetShell";

export function RadarMetricsPanel() {
  const [pollCount, setPollCount] = createSignal(0);
  const [sseCount, setSseCount] = createSignal(0);
  const [totalEvents, setTotalEvents] = createSignal(42);

  const poll = () => {
    setPollCount((c) => c + 1);
    setTotalEvents((t) => t + 1);
  };

  const sse = () => {
    setSseCount((c) => c + 1);
  };

  return (
    <WidgetShell
      title="Metrics: Query vs SSE"
      instructorNotes="Dashboard.tsx — createQuery refetchInterval 5000 + EventSource /api/events/stream."
    >
      {(mode) => (
        <div class="mw-radar-metrics">
          <div class="mw-channel-grid">
            <div class="mw-channel-zone" data-role="sender">
              <h4>TanStack Query</h4>
              <p class="mw-hint">GET /api/metrics/summary · 5s poll</p>
              <p class="mw-hint">total_events: <strong>{totalEvents()}</strong></p>
              <button type="button" onClick={poll}>Simulate poll tick</button>
              <span class="mw-hint">Polls: {pollCount()}</span>
            </div>
            <div class="mw-channel-zone" data-role="receiver">
              <h4>SSE live feed</h4>
              <p class="mw-hint">EventSource team_event · Redis pub/sub</p>
              <button type="button" onClick={sse}>Simulate SSE event</button>
              <span class="mw-hint">Live rows: {sseCount()}</span>
            </div>
          </div>
          <Show when={mode() === "challenge"}>
            <p class="mw-hint">Challenge: which updates the Activity stream table vs stat cards?</p>
          </Show>
        </div>
      )}
    </WidgetShell>
  );
}
