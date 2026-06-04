-- Gestión de jugadores desde el panel de administración
ALTER TABLE players
    ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

INSERT INTO schema_migrations (script_name)
VALUES ('109_player_management.sql')
ON CONFLICT DO NOTHING;
