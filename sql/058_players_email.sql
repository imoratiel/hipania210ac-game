-- 058_players_email.sql
-- Añade campo email de contacto a players.
-- Nota: first_name y last_name ya existen desde 027_political_division.sql.

ALTER TABLE players ADD COLUMN IF NOT EXISTS email VARCHAR(255);

INSERT INTO schema_migrations (script_name)
VALUES ('058_players_email.sql')
ON CONFLICT DO NOTHING;
