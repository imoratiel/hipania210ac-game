-- 055_change_start_date.sql
-- Cambia la fecha de inicio del juego a 1 de enero de 210 a.C.
-- Se almacena como año 210 (ISO) y el cliente lo muestra con el sufijo "a.C."

UPDATE world_state
SET game_date = '0210-01-01'
WHERE id = 1;

INSERT INTO schema_migrations (script_name)
VALUES ('055_change_start_date.sql')
ON CONFLICT DO NOTHING;
