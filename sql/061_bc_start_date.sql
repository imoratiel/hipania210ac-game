-- Fecha de inicio del juego: 1 de enero de 210 a.C.
-- La columna game_date es de tipo DATE en PostgreSQL, que soporta fechas a.C. nativamente.
UPDATE world_state SET game_date = '0210-01-01 BC' WHERE id = 1;

INSERT INTO schema_migrations (script_name)
VALUES ('061_bc_start_date.sql')
ON CONFLICT DO NOTHING;
