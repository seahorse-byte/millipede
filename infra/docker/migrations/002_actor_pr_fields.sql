-- Run against existing team_radar DBs created before direct-report filtering.
ALTER TABLE team_events ADD COLUMN IF NOT EXISTS actor_id TEXT;
ALTER TABLE team_events ADD COLUMN IF NOT EXISTS actor_name TEXT;
ALTER TABLE team_events ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE team_events ADD COLUMN IF NOT EXISTS event_type TEXT;
ALTER TABLE team_events ADD COLUMN IF NOT EXISTS repo TEXT;
ALTER TABLE team_events ADD COLUMN IF NOT EXISTS pr_number INTEGER;
ALTER TABLE team_events ADD COLUMN IF NOT EXISTS pr_state TEXT;
ALTER TABLE team_events ADD COLUMN IF NOT EXISTS url TEXT;

CREATE INDEX IF NOT EXISTS idx_team_events_actor_id ON team_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_team_events_event_type ON team_events(event_type);
CREATE INDEX IF NOT EXISTS idx_team_events_pr ON team_events(event_type, repo, pr_number) WHERE event_type = 'pr';
