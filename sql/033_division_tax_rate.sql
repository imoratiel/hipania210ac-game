-- 033_division_tax_rate.sql
-- Añade columna tax_rate a political_divisions.
-- Permite que cada señorío tenga su propia tasa impositiva independiente
-- de la tasa global del jugador (players.tax_percentage).

ALTER TABLE political_divisions
ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00;

-- Constraint: tasa entre 0% y 100%
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_division_tax_rate'
    ) THEN
        ALTER TABLE political_divisions
        ADD CONSTRAINT chk_division_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 100);
    END IF;
END$$;

INSERT INTO schema_migrations (script_name)
VALUES ('033_division_tax_rate.sql')
ON CONFLICT DO NOTHING;
