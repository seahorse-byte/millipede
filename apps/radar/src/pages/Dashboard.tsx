import { createQuery } from "@tanstack/solid-query";
import { For, Show, createSignal, onCleanup, onMount } from "solid-js";
import { fetchMetricsSummary, openEventStream, type LiveEvent } from "../api/client";

export function Dashboard() {
  const metricsQuery = createQuery(() => ({
    queryKey: ["metrics-summary"],
    queryFn: fetchMetricsSummary,
    refetchInterval: 5000,
  }));

  const [liveEvents, setLiveEvents] = createSignal<LiveEvent[]>([]);
  const [streamStatus, setStreamStatus] = createSignal<"connecting" | "live" | "offline">(
    "connecting",
  );

  onMount(() => {
    const close = openEventStream(
      (event) => {
        setStreamStatus("live");
        setLiveEvents((current) => [event, ...current].slice(0, 12));
      },
      () => setStreamStatus("offline"),
    );
    onCleanup(close);
  });

  return (
    <div class="dashboard-grid">
      <section class="panel">
        <h2>Team metrics</h2>
        <Show when={metricsQuery.isError}>
          <p class="error">Unable to load metrics. Is the analyzer running on :8082?</p>
        </Show>
        <Show when={metricsQuery.data}>
          {(data) => (
            <div class="metrics-grid">
              <article class="metric-card">
                <span>Total events</span>
                <strong>{data().total_events}</strong>
              </article>
              <For each={Object.entries(data().events_by_source)}>
                {([source, count]) => (
                  <article class="metric-card">
                    <span>{source}</span>
                    <strong>{count}</strong>
                  </article>
                )}
              </For>
            </div>
          )}
        </Show>
      </section>

      <section class="panel">
        <div class="panel-heading">
          <h2>Live feed</h2>
          <span class={`status-pill ${streamStatus()}`}>{streamStatus()}</span>
        </div>
        <Show
          when={liveEvents().length > 0}
          fallback={<p class="muted">Waiting for Redis-backed events…</p>}
        >
          <ul class="event-list">
            <For each={liveEvents()}>
              {(event) => (
                <li>
                  <strong>{event.source}</strong>
                  <span>{event.id.slice(0, 8)}</span>
                  <span>sentiment {event.sentiment?.toFixed(2) ?? "—"}</span>
                  <span>risk {event.risk_score?.toFixed(2) ?? "—"}</span>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </section>
    </div>
  );
}
