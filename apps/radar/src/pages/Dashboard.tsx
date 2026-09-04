import { createQuery } from "@tanstack/solid-query";
import { For, Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";
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

  const metrics = createMemo(() => metricsQuery.data);
  const isMetricsLoading = createMemo(
    () => metricsQuery.isPending && metrics() == null,
  );
  const isMetricsError = createMemo(() => metricsQuery.isError);
  const metricsError = createMemo(() => metricsQuery.error);

  const [liveEvents, setLiveEvents] = createSignal<FeedRow[]>([]);
  const [streamStatus, setStreamStatus] = createSignal<"connecting" | "live" | "offline">(
    "connecting",
  );

  onMount(() => {
    const close = openEventStream({
      onEvent: (event) => {
        setStreamStatus("live");
        setLiveEvents((current) => [
          { ...event, receivedAt: new Date().toISOString().slice(11, 19) },
          ...current,
        ].slice(0, 12));
      },
      onOpen: () => setStreamStatus("live"),
      onError: () => {
        if (liveEvents().length === 0) setStreamStatus("offline");
      },
    });
    onCleanup(close);
  });

  return (
    <div class="page-stack">
      <Show when={isMetricsLoading()}>
        <div class="alert alert--info">Syncing metrics from analyzer…</div>
      </Show>
      <Show when={isMetricsError()}>
        <div class="alert alert--danger" role="alert">
          <p>
            <strong>Analyzer unreachable.</strong> Metrics will not update until{" "}
            <code class="mono">:8082</code> is running.
          </p>
          <p class="dim">
            {metricsError() instanceof Error
              ? metricsError()!.message
              : "Start the pipeline with pnpm millipede-demo or pnpm analyzer:dev, then refresh."}
          </p>
        </div>
      </Show>

      <section class="kpi-row" aria-label="Manager KPIs">
        <article class="kpi-card">
          <p class="kpi-label">Friction index</p>
          <p class="kpi-value">
            {(() => {
              const value = metrics()?.kpis?.friction_index;
              return value != null ? value.toFixed(2) : "—";
            })()}
          </p>
          <p class="kpi-hint">sentiment + risk blend</p>
        </article>
        <article class="kpi-card">
          <p class="kpi-label">Avg sentiment</p>
          <p class="kpi-value">
            {(() => {
              const value = metrics()?.kpis?.avg_sentiment;
              return value != null ? value.toFixed(2) : "—";
            })()}
          </p>
          <p class="kpi-hint">enriched events</p>
        </article>
        <article class="kpi-card">
          <p class="kpi-label">High risk</p>
          <p class="kpi-value">{metrics()?.kpis?.high_risk_count ?? "—"}</p>
          <p class="kpi-hint">risk ≥ 0.5</p>
        </article>
        <article class="kpi-card">
          <p class="kpi-label">Eval pass rate</p>
          <p class="kpi-value">
            {(() => {
              const rate = metrics()?.kpis?.eval_pass_rate;
              return rate != null ? `${Math.round(rate * 100)}%` : "—";
            })()}
          </p>
          <p class="kpi-hint">pnpm evals:write-metrics</p>
        </article>
      </section>

      <Show when={metrics()}>
        {(data) => (
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
                <p class="stat-value">{data().total_events}</p>
                <p class="stat-hint">postgres · team_events</p>
              </div>
            </article>

            <For each={Object.entries(data().events_by_source)}>
              {([source, count]) => (
                <article class="stat-card">
                  <div class="stat-icon">
                    <span>{source.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <p class="stat-label">{source}</p>
                    <p class="stat-value">{count}</p>
                    <p class="stat-hint mono">
                      {data().latest_by_source[source]?.slice(0, 8) ?? "—"}
                    </p>
                  </div>
                </article>
              )}
            </For>
          </section>
        )}
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
