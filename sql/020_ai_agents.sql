-- AI Agent support: add is_ai and ai_profile columns to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_ai BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS ai_profile VARCHAR(50) NULL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for efficient AI agent queries
CREATE INDEX IF NOT EXISTS idx_players_is_ai ON players(is_ai) WHERE is_ai = TRUE;

INSERT INTO schema_migrations (script_name)
VALUES ('020_ai_agents.sql');
