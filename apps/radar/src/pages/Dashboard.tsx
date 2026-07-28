import { createQuery } from "@tanstack/solid-query";
import { For, Show, createSignal, onCleanup, onMount } from "solid-js";
import {
  fetchMetricsSummary,
  openEventStream,
  type LiveEvent,
} from "../api/client";

type FeedRow = LiveEvent & { receivedAt: string };

function riskBadge(score?: number) {
  if (score == null) return "badge badge--muted";
  if (score >= 0.5) return "badge badge--hard";
  if (score >= 0.2) return "badge badge--medium";
  return "badge badge--easy";
}

function riskLabel(score?: number) {
  if (score == null) return "N/A";
  if (score >= 0.5) return "High";
  if (score >= 0.2) return "Medium";
  return "Low";
}

export function Dashboard() {
  const metricsQuery = createQuery(() => ({
    queryKey: ["metrics-summary"],
    queryFn: fetchMetricsSummary,
    refetchInterval: 5000,
  }));

  const [liveEvents, setLiveEvents] = createSignal<FeedRow[]>([]);
  const [streamStatus, setStreamStatus] = createSignal<"connecting" | "live" | "offline">(
    "connecting",
  );

  onMount(() => {
    const close = openEventStream(
      (event) => {
        setStreamStatus("live");
        setLiveEvents((current) => [
          { ...event, receivedAt: new Date().toISOString().slice(11, 19) },
          ...current,
        ].slice(0, 12));
      },
      () => {
        if (liveEvents().length === 0) setStreamStatus("offline");
      },
    );
    onCleanup(close);
  });

  return (
    <div class="page-stack">
      <Show when={metricsQuery.isPending}>
        <div class="alert alert--info">Syncing metrics from analyzer…</div>
      </Show>
      <Show when={metricsQuery.isError}>
        <div class="alert alert--danger">
          Analyzer unreachable on :8082. Start the pipeline and refresh.
        </div>
      </Show>

      <Show when={metricsQuery.isSuccess && metricsQuery.data}>
        <section class="stat-row">
          <article class="stat-card stat-card--hero">
            <div class="stat-icon stat-icon--green">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 14h4v6H4v-6zm6-4h4v10h-4V10zm6-6h4v16h-4V4z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div>
              <p class="stat-label">Total events</p>
              <p class="stat-value">{metricsQuery.data!.total_events}</p>
              <p class="stat-hint">postgres · team_events</p>
            </div>
          </article>

          <For each={Object.entries(metricsQuery.data!.events_by_source)}>
            {([source, count]) => (
              <article class="stat-card">
                <div class="stat-icon">
                  <span>{source.slice(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <p class="stat-label">{source}</p>
                  <p class="stat-value">{count}</p>
                  <p class="stat-hint mono">
                    {metricsQuery.data!.latest_by_source[source]?.slice(0, 8) ?? "—"}
                  </p>
                </div>
              </article>
            )}
          </For>
        </section>
      </Show>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h3>Activity stream</h3>
            <p class="panel-sub">Redis SSE · team_radar:events</p>
          </div>
          <span class={`stream-badge stream-badge--${streamStatus()}`}>{streamStatus()}</span>
        </div>

        <Show
          when={liveEvents().length > 0}
          fallback={
            <div class="empty-state">
              <p>No live events yet.</p>
              <p class="dim">
                Keep this tab open and POST to{" "}
                <code class="mono">/webhooks/hello</code> to populate the feed.
              </p>
            </div>
          }
        >
          <div class="table-wrap">
            <table class="htb-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Source</th>
                  <th>Event ID</th>
                  <th>Sentiment</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                <For each={liveEvents()}>
                  {(event) => (
                    <tr class="row-flash">
                      <td class="mono dim">{event.receivedAt}</td>
                      <td>
                        <span class="source-tag">{event.source}</span>
                      </td>
                      <td class="mono">{event.id.slice(0, 12)}…</td>
                      <td>
                        <div class="meter">
                          <div
                            class="meter-fill meter-fill--green"
                            style={{ width: `${(event.sentiment ?? 0) * 100}%` }}
                          />
                          <span>{event.sentiment?.toFixed(2) ?? "—"}</span>
                        </div>
                      </td>
                      <td>
                        <span class={riskBadge(event.risk_score)}>{riskLabel(event.risk_score)}</span>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </section>
    </div>
  );
}
