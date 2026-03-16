-- 046_players_culture_id.sql
-- Añade culture_id a players para persistir la cultura asignada al spawn.

ALTER TABLE players
    ADD COLUMN IF NOT EXISTS culture_id INT DEFAULT NULL REFERENCES cultures(id);

CREATE INDEX IF NOT EXISTS idx_players_culture ON players(culture_id);

INSERT INTO schema_migrations (script_name)
VALUES ('046_players_culture_id.sql')
ON CONFLICT DO NOTHING;
