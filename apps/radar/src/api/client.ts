export interface ManagerKpis {
  avg_sentiment: number;
  high_risk_count: number;
  friction_index: number;
  eval_pass_rate: number | null;
}

export interface MetricsSummary {
  total_events: number;
  events_by_source: Record<string, number>;
  latest_by_source: Record<string, string>;
  kpis: ManagerKpis;
}

export interface DirectReport {
  id: string;
  name: string;
  email: string;
  github: string;
  gitlab: string;
  slack_user_id: string;
  jira_account_id: string;
}

export interface TeamEvent {
  id: string;
  source: string;
  actor_id?: string;
  actor_name?: string;
  title?: string;
  event_type?: string;
  sentiment?: number;
  risk_score?: number;
  created_at: string;
}

export interface PullRequest {
  id: string;
  source: string;
  repo: string;
  pr_number: number;
  title: string;
  url?: string;
  state: string;
  author_id?: string;
  author_name?: string;
  updated_at: string;
}

export interface LiveEvent {
  id: string;
  source: string;
  sentiment?: number;
  risk_score?: number;
  actor_id?: string;
  actor_name?: string;
  title?: string;
  event_type?: string;
  repo?: string;
  pr_number?: number;
  pr_state?: string;
  url?: string;
}

const apiBase = import.meta.env.VITE_API_BASE ?? "";
const SOURCES = ["slack", "jira", "github", "gitlab"] as const;
export type ActivitySource = (typeof SOURCES)[number];
export { SOURCES };

function authHeaders(): HeadersInit {
  const token = import.meta.env.VITE_JWT;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchMetricsSummary(): Promise<MetricsSummary> {
  const response = await fetch(`${apiBase}/api/metrics/summary`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(`metrics request failed (${response.status})`);
  }
  return response.json();
}

export async function fetchDirectReports(): Promise<DirectReport[]> {
  const response = await fetch(`${apiBase}/api/direct-reports`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export interface EventsQuery {
  directReport?: string;
  sources?: ActivitySource[];
  limit?: number;
}

export async function fetchEvents(query: EventsQuery = {}): Promise<TeamEvent[]> {
  const params = new URLSearchParams();
  if (query.directReport) params.set("direct_report", query.directReport);
  for (const source of query.sources ?? []) {
    params.append("source", source);
  }
  if (query.limit) params.set("limit", String(query.limit));
  const qs = params.toString();
  const response = await fetch(`${apiBase}/api/events${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export interface PullRequestsQuery {
  directReport?: string;
  source?: ActivitySource;
  state?: string;
  repo?: string;
  limit?: number;
}

export async function fetchPullRequests(
  query: PullRequestsQuery = {},
): Promise<PullRequest[]> {
  const params = new URLSearchParams();
  if (query.directReport) params.set("direct_report", query.directReport);
  if (query.source) params.set("source", query.source);
  if (query.state) params.set("state", query.state);
  if (query.repo) params.set("repo", query.repo);
  if (query.limit) params.set("limit", String(query.limit));
  const qs = params.toString();
  const response = await fetch(`${apiBase}/api/pull-requests${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    return [];
  }
  return response.json();
}

function streamUrl(): string {
  const token = import.meta.env.VITE_JWT;
  const base = `${apiBase}/api/events/stream`;
  if (!token) return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}access_token=${encodeURIComponent(token)}`;
}

export interface EventStreamHandlers {
  onEvent: (event: LiveEvent) => void;
  onOpen?: () => void;
  onError?: () => void;
}

export function openEventStream(handlers: EventStreamHandlers) {
  const source = new EventSource(streamUrl());
  source.onopen = () => handlers.onOpen?.();
  source.addEventListener("team_event", (message) => {
    try {
      handlers.onEvent(JSON.parse(message.data));
    } catch {
      handlers.onError?.();
    }
  });
  source.onerror = () => handlers.onError?.();
  return () => source.close();
}

export function formatTimestamp(iso: string) {
  if (!iso) return "—";
  const normalized = iso.includes("T") ? iso : iso.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 19);
  return date.toISOString().slice(11, 19);
}

export function matchesFilters(
  event: LiveEvent,
  directReport: string,
  sources: Set<ActivitySource>,
) {
  if (directReport && event.actor_id !== directReport) return false;
  if (sources.size > 0 && !sources.has(event.source as ActivitySource)) return false;
  if (event.event_type === "pr") return false;
  return true;
}
