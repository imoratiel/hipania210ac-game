-- 029_fix_division_capital_notnull.sql
-- Limpia capital_territory_id (columna legacy NOT NULL) y garantiza capital_h3.
--
-- El campo capital_territory_id fue creado NOT NULL en 027 con una FK rota
-- (territory_details no tiene columna territory_id).
-- A partir de ahora la capital se almacena exclusivamente en capital_h3 VARCHAR(15).

-- 1. Eliminar la FK rota si todavia existe (por si 028 no se ejecuto)
ALTER TABLE political_divisions
DROP CONSTRAINT IF EXISTS fk_capital_territory;

-- 2. Hacer capital_territory_id nullable (quitar NOT NULL)
ALTER TABLE political_divisions
ALTER COLUMN capital_territory_id DROP NOT NULL;

-- 3. Asegurar que capital_h3 existe
ALTER TABLE political_divisions
ADD COLUMN IF NOT EXISTS capital_h3 VARCHAR(15);

-- 4. Reconstruir la FK correcta sobre capital_h3 (idempotente)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_division_capital_h3'
    ) THEN
        ALTER TABLE political_divisions
        ADD CONSTRAINT fk_division_capital_h3
        FOREIGN KEY (capital_h3) REFERENCES territory_details(h3_index) ON DELETE SET NULL;
    END IF;
END $$;

-- 5. Constraint de unicidad (idempotente)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_division_player_name'
    ) THEN
        ALTER TABLE political_divisions
        ADD CONSTRAINT uq_division_player_name UNIQUE (player_id, name);
    END IF;
END $$;

-- 6. Indice sobre capital_h3
CREATE INDEX IF NOT EXISTS idx_political_divisions_capital ON political_divisions(capital_h3);

INSERT INTO schema_migrations (script_name)
VALUES ('029_fix_division_capital_notnull.sql')
ON CONFLICT DO NOTHING;
