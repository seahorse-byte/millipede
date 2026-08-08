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

export interface LiveEvent {
  id: string;
  source: string;
  sentiment?: number;
  risk_score?: number;
}

const apiBase = import.meta.env.VITE_API_BASE ?? "";

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

function streamUrl(): string {
  const token = import.meta.env.VITE_JWT;
  const base = `${apiBase}/api/events/stream`;
  if (!token) return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}access_token=${encodeURIComponent(token)}`;
}

export function openEventStream(onEvent: (event: LiveEvent) => void, onError?: () => void) {
  const source = new EventSource(streamUrl());
  source.addEventListener("team_event", (message) => {
    try {
      onEvent(JSON.parse(message.data));
    } catch {
      onError?.();
    }
  });
  source.onerror = () => onError?.();
  return () => source.close();
}
