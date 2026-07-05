CREATE TABLE IF NOT EXISTS team_events (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  sentiment REAL,
  risk_score REAL,
  enriched_at TEXT,
  created_at TEXT NOT NULL DEFAULT (NOW()::TEXT)
);

CREATE TABLE IF NOT EXISTS team_metrics (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  value REAL NOT NULL,
  computed_at TEXT NOT NULL DEFAULT (NOW()::TEXT)
);

CREATE INDEX IF NOT EXISTS idx_team_events_source ON team_events(source);
CREATE INDEX IF NOT EXISTS idx_team_metrics_team ON team_metrics(team_id);
