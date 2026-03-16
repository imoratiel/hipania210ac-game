-- 048_unit_types_new_columns.sql
-- Añade las columnas defense, initial_experience y recruit_cost a unit_types.

ALTER TABLE unit_types
    ADD COLUMN IF NOT EXISTS defense           INT NOT NULL DEFAULT 5,
    ADD COLUMN IF NOT EXISTS initial_experience INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS recruit_cost      INT NOT NULL DEFAULT 0;

INSERT INTO schema_migrations (script_name)
VALUES ('048_unit_types_new_columns.sql')
ON CONFLICT DO NOTHING;
