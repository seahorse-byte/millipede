import { createQuery } from "@tanstack/solid-query";
import { For, Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import {
  SOURCES,
  fetchDirectReports,
  fetchEvents,
  fetchMetricsSummary,
  fetchPullRequests,
  formatTimestamp,
  matchesFilters,
  openEventStream,
  type ActivitySource,
  type LiveEvent,
  type PullRequest,
  type TeamEvent,
} from "../api/client";

type FeedRow = LiveEvent & { receivedAt: string };
type DashboardTab = "activity" | "pull-requests";

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

function prStateBadge(state: string) {
  if (state === "merged") return "badge badge--easy";
  if (state === "closed") return "badge badge--muted";
  return "badge badge--medium";
}

function eventTitle(event: TeamEvent | LiveEvent) {
  return event.title ?? `${event.source} event`;
}

function FilterBar(props: {
  directReport: () => string;
  onDirectReport: (value: string) => void;
  sources: () => Set<ActivitySource>;
  onToggleSource: (source: ActivitySource) => void;
  roster: () => { id: string; name: string }[];
}) {
  return (
    <div class="filter-bar" aria-label="Activity filters">
      <label class="filter-field">
        <span class="filter-label">Direct report</span>
        <select
          class="filter-select"
          value={props.directReport()}
          onChange={(event) => props.onDirectReport(event.currentTarget.value)}
        >
          <option value="">All direct reports</option>
          <For each={props.roster()}>
            {(person) => <option value={person.id}>{person.name}</option>}
          </For>
        </select>
      </label>

      <div class="filter-field">
        <span class="filter-label">Sources</span>
        <div class="source-chips" role="group" aria-label="Source filters">
          <For each={SOURCES}>
            {(source) => (
              <button
                type="button"
                class="source-chip"
                classList={{ "source-chip--active": props.sources().has(source) }}
                aria-pressed={props.sources().has(source)}
                onClick={() => props.onToggleSource(source)}
              >
                {source}
              </button>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}

function ActivityTable(props: { rows: () => TeamEvent[] }) {
  return (
    <Show
      when={props.rows().length > 0}
      fallback={
        <div class="empty-state">
          <p>No activity matches these filters.</p>
          <p class="dim">Run <code class="mono">pnpm sync:github</code> or POST webhooks to populate events. GitHub PRs appear under <strong>Pull requests</strong>.</p>
        </div>
      }
    >
      <div class="table-wrap">
        <table class="htb-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Source</th>
              <th>Summary</th>
              <th>Person</th>
              <th>Sentiment</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            <For each={props.rows()}>
              {(event) => (
                <tr>
                  <td class="mono dim">{formatTimestamp(event.created_at)}</td>
                  <td>
                    <span class="source-tag">{event.source}</span>
                  </td>
                  <td>{eventTitle(event)}</td>
                  <td>{event.actor_name ?? "—"}</td>
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
  );
}

function pullRequestEmptyMessage(
  directReportId: string,
  sources: Set<ActivitySource>,
  roster: { id: string; name: string }[],
): { headline: string; hint: string } {
  const gitlabOnly = sources.size === 1 && sources.has("gitlab");
  const person = roster.find((member) => member.id === directReportId);

  if (gitlabOnly && directReportId) {
    const who = person?.name ?? directReportId;
    return {
      headline: `No GitLab MRs for ${who} in the sync window.`,
      hint: "GitLab sync requires GITLAB_TOKEN in .env.local (or .env.local.op). Then run pnpm sync:gitlab.",
    };
  }

  if (gitlabOnly) {
    return {
      headline: "No GitLab MRs in the sync window.",
      hint: "Set GITLAB_TOKEN in .env.local (or .env.local.op), then run pnpm sync:gitlab.",
    };
  }

  return {
    headline: "No pull requests match these filters.",
    hint: "Run pnpm sync:github or pnpm sync:gitlab to load PRs/MRs.",
  };
}

function PullRequestTable(props: {
  rows: () => PullRequest[];
  directReport: () => string;
  sources: () => Set<ActivitySource>;
  roster: () => { id: string; name: string }[];
}) {
  const empty = createMemo(() =>
    pullRequestEmptyMessage(props.directReport(), props.sources(), props.roster()),
  );

  return (
    <Show
      when={props.rows().length > 0}
      fallback={
        <div class="empty-state">
          <p>{empty().headline}</p>
          <p class="dim">{empty().hint}</p>
        </div>
      }
    >
      <div class="table-wrap">
        <table class="htb-table">
          <thead>
            <tr>
              <th>Repo</th>
              <th>#</th>
              <th>Title</th>
              <th>Author</th>
              <th>State</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            <For each={props.rows()}>
              {(pr) => (
                <tr>
                  <td class="mono">{pr.repo}</td>
                  <td class="mono">#{pr.pr_number}</td>
                  <td>
                    <Show
                      when={pr.url}
                      fallback={<span>{pr.title}</span>}
                    >
                      {(url) => (
                        <a class="pr-link" href={url()} target="_blank" rel="noreferrer">
                          {pr.title}
                        </a>
                      )}
                    </Show>
                  </td>
                  <td>{pr.author_name ?? "—"}</td>
                  <td>
                    <span class={prStateBadge(pr.state)}>{pr.state}</span>
                  </td>
                  <td class="mono dim">{formatTimestamp(pr.updated_at)}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </Show>
  );
}

export function Dashboard() {
  const [activeTab, setActiveTab] = createSignal<DashboardTab>("activity");
  const [directReport, setDirectReport] = createSignal("");
  const [selectedSources, setSelectedSources] = createSignal<Set<ActivitySource>>(new Set());
  const [liveEvents, setLiveEvents] = createSignal<FeedRow[]>([]);
  const [streamStatus, setStreamStatus] = createSignal<"connecting" | "live" | "offline">(
    "connecting",
  );

  const rosterQuery = createQuery(() => ({
    queryKey: ["direct-reports"],
    queryFn: fetchDirectReports,
    staleTime: 60_000,
    suspense: false,
  }));

  const metricsQuery = createQuery(() => ({
    queryKey: ["metrics-summary"],
    queryFn: fetchMetricsSummary,
    refetchInterval: 5000,
    suspense: false,
  }));

  const filterKey = createMemo(() => ({
    directReport: directReport(),
    sources: [...selectedSources()].sort().join(","),
    tab: activeTab(),
  }));

  const eventsQuery = createQuery(() => ({
    queryKey: ["events", filterKey().directReport, filterKey().sources],
    queryFn: () =>
      fetchEvents({
        directReport: directReport() || undefined,
        sources: selectedSources().size > 0 ? [...selectedSources()] : undefined,
        limit: 50,
      }),
    refetchInterval: 5000,
    enabled: activeTab() === "activity",
    suspense: false,
  }));

  const pullRequestsQuery = createQuery(() => ({
    queryKey: ["pull-requests", filterKey().directReport, filterKey().sources],
    queryFn: () =>
      fetchPullRequests({
        directReport: directReport() || undefined,
        source:
          selectedSources().size === 1 ? [...selectedSources()][0] : undefined,
        limit: 50,
      }),
    refetchInterval: 5000,
    enabled: activeTab() === "pull-requests",
    suspense: false,
  }));

  const metrics = createMemo(() => metricsQuery.data);
  const isMetricsLoading = createMemo(
    () => metricsQuery.isPending && metrics() == null,
  );
  const isMetricsError = createMemo(() => metricsQuery.isError);
  const metricsError = createMemo(() => metricsQuery.error);

  const filteredLiveEvents = createMemo(() =>
    liveEvents().filter((event) =>
      matchesFilters(event, directReport(), selectedSources()),
    ),
  );

  const activityRows = createMemo(() => {
    const seen = new Set<string>();
    const rows: TeamEvent[] = [];
    for (const event of [...filteredLiveEvents(), ...(eventsQuery.data ?? [])]) {
      if (seen.has(event.id)) continue;
      seen.add(event.id);
      rows.push({
        id: event.id,
        source: event.source,
        actor_id: event.actor_id,
        actor_name: event.actor_name,
        title: event.title,
        event_type: event.event_type,
        sentiment: event.sentiment,
        risk_score: event.risk_score,
        created_at: "created_at" in event ? event.created_at : event.receivedAt,
      });
    }
    return rows;
  });

  function toggleSource(source: ActivitySource) {
    setSelectedSources((current) => {
      const next = new Set(current);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });
  }

  onMount(() => {
    const close = openEventStream({
      onEvent: (event) => {
        setStreamStatus("live");
        if (event.event_type === "pr") return;
        setLiveEvents((current) => [
          { ...event, receivedAt: new Date().toISOString().slice(11, 19) },
          ...current,
        ].slice(0, 20));
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

      <FilterBar
        directReport={directReport}
        onDirectReport={setDirectReport}
        sources={selectedSources}
        onToggleSource={toggleSource}
        roster={() => rosterQuery.data ?? []}
      />

      <section class="panel">
        <div class="panel-head">
          <div>
            <div class="tab-row" role="tablist" aria-label="Dashboard views">
              <button
                type="button"
                role="tab"
                class="tab-btn"
                classList={{ "tab-btn--active": activeTab() === "activity" }}
                aria-selected={activeTab() === "activity"}
                onClick={() => setActiveTab("activity")}
              >
                Activity
              </button>
              <button
                type="button"
                role="tab"
                class="tab-btn"
                classList={{ "tab-btn--active": activeTab() === "pull-requests" }}
                aria-selected={activeTab() === "pull-requests"}
                onClick={() => setActiveTab("pull-requests")}
              >
                Pull requests
              </button>
            </div>
            <p class="panel-sub">
              {activeTab() === "activity"
                ? "REST + Redis SSE · reviews & non-PR activity (PRs → Pull requests tab)"
                : "Cross-repo PRs · GitHub + GitLab"}
            </p>
          </div>
          <Show when={activeTab() === "activity"}>
            <span class={`stream-badge stream-badge--${streamStatus()}`}>{streamStatus()}</span>
          </Show>
        </div>

        <Show when={activeTab() === "activity"}>
          <ActivityTable rows={activityRows} />
        </Show>

        <Show when={activeTab() === "pull-requests"}>
          <PullRequestTable
            rows={() => pullRequestsQuery.data ?? []}
            directReport={directReport}
            sources={selectedSources}
            roster={() => rosterQuery.data ?? []}
          />
        </Show>
      </section>
    </div>
  );
}
