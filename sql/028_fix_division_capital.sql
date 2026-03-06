-- 028_fix_division_capital.sql
-- Corrige la referencia rota de capital_territory_id (INT -> territory_details.territory_id inexistente)
-- y añade capital_h3 VARCHAR(15) que referencia la PK real de territory_details.

-- 1. Añadir columna correcta
ALTER TABLE political_divisions
ADD COLUMN IF NOT EXISTS capital_h3 VARCHAR(15);

-- 2. Eliminar la FK rota si existe (puede no existir si falló en 027)
ALTER TABLE political_divisions
DROP CONSTRAINT IF EXISTS fk_capital_territory;

-- 3. Añadir FK correcta
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_division_capital_h3'
    ) THEN
        ALTER TABLE political_divisions
        ADD CONSTRAINT fk_division_capital_h3
        FOREIGN KEY (capital_h3) REFERENCES territory_details(h3_index) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Índice para búsquedas por capital
CREATE INDEX IF NOT EXISTS idx_political_divisions_capital ON political_divisions(capital_h3);

-- 5. Constraint de unicidad para idempotencia en creación de divisiones
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_division_player_name'
    ) THEN
        ALTER TABLE political_divisions
        ADD CONSTRAINT uq_division_player_name UNIQUE (player_id, name);
    END IF;
END $$;

INSERT INTO schema_migrations (script_name)
VALUES ('028_fix_division_capital.sql')
ON CONFLICT DO NOTHING;
