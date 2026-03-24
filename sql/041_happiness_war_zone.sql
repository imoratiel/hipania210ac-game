-- 041_happiness_war_zone.sql
-- Añade is_war_zone a territory_details para el Motor de Felicidad.
-- happiness (INT DEFAULT 50) ya existe desde 001_initial.sql.

ALTER TABLE territory_details
    ADD COLUMN IF NOT EXISTS is_war_zone BOOLEAN NOT NULL DEFAULT FALSE;

INSERT INTO schema_migrations (script_name)
VALUES ('041_happiness_war_zone.sql')
ON CONFLICT DO NOTHING;
