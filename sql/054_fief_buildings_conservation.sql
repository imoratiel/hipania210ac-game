-- 054_fief_buildings_conservation.sql
-- Añade conservation (0-100) a fief_buildings.
-- 100 = perfecto estado, 0 = en ruinas.
-- Los edificios nuevos se crean con 100.

ALTER TABLE fief_buildings
    ADD COLUMN IF NOT EXISTS conservation SMALLINT NOT NULL DEFAULT 100
        CHECK (conservation BETWEEN 0 AND 100);

INSERT INTO schema_migrations (script_name)
VALUES ('054_fief_buildings_conservation.sql')
ON CONFLICT DO NOTHING;
