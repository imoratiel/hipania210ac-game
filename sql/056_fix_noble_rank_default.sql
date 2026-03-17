-- 056_fix_noble_rank_default.sql
-- El DEFAULT 1 de players.noble_rank_id es inválido desde que 044 eliminó los rangos 1-8.
-- Lo cambiamos a NULL (el rango se asigna explícitamente al inicializar el jugador).

ALTER TABLE players ALTER COLUMN noble_rank_id DROP DEFAULT;

INSERT INTO schema_migrations (script_name)
VALUES ('056_fix_noble_rank_default.sql')
ON CONFLICT DO NOTHING;
