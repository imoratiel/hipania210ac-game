-- 051_drop_recruit_cost.sql
-- El coste de reclutamiento pasa a gestionarse exclusivamente desde unit_requirements.
-- Esta columna es redundante y se elimina para evitar inconsistencias.

ALTER TABLE unit_types DROP COLUMN IF EXISTS recruit_cost;

INSERT INTO schema_migrations (script_name)
VALUES ('051_drop_recruit_cost.sql')
ON CONFLICT DO NOTHING;
