-- 052_buildings_culture_id.sql
-- Añade culture_id a buildings (igual que unit_types) y elimina food_bonus.
-- Vacía completamente los registros de buildings para reinsertar por cultura.

-- 1. Eliminar food_bonus
ALTER TABLE buildings DROP COLUMN IF EXISTS food_bonus;

-- 2. Añadir culture_id (FK a cultures)
ALTER TABLE buildings
    ADD COLUMN IF NOT EXISTS culture_id INT REFERENCES cultures(id) ON DELETE SET NULL;

-- 3. Vaciar datos existentes (fief_buildings primero por FK)
TRUNCATE fief_buildings RESTART IDENTITY CASCADE;
TRUNCATE buildings      RESTART IDENTITY CASCADE;

-- Índice para filtrar por cultura
CREATE INDEX IF NOT EXISTS idx_buildings_culture ON buildings(culture_id);

INSERT INTO schema_migrations (script_name)
VALUES ('052_buildings_culture_id.sql')
ON CONFLICT DO NOTHING;