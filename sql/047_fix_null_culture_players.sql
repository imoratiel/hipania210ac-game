-- 047_fix_null_culture_players.sql
-- Asigna una cultura aleatoria a los jugadores inicializados que aún tienen culture_id = NULL.
-- Ejecutar una sola vez tras aplicar las migraciones 043-046.

UPDATE players
SET culture_id = (SELECT id FROM cultures ORDER BY RANDOM() LIMIT 1)
WHERE is_initialized = TRUE
  AND culture_id IS NULL;

INSERT INTO schema_migrations (script_name)
VALUES ('047_fix_null_culture_players.sql')
ON CONFLICT DO NOTHING;
