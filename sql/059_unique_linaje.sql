-- 059_unique_linaje.sql
-- El linaje (display_name) debe ser único entre jugadores inicializados.
-- Índice parcial: solo aplica cuando is_initialized = TRUE,
-- lo que permite que jugadores OAuth tengan display_name temporal sin conflicto.

CREATE UNIQUE INDEX IF NOT EXISTS players_linaje_uniq
    ON players (LOWER(display_name))
    WHERE is_initialized = TRUE;

INSERT INTO schema_migrations (script_name)
VALUES ('059_unique_linaje.sql')
ON CONFLICT DO NOTHING;
