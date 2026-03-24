-- 043_cultures_noble_ranks_schema.sql
-- Crea la tabla cultures y añade culture_id FK a noble_ranks.
-- Los rangos existentes (Infanzón…Rey) quedan con culture_id = NULL (cultura por defecto).

-- ── 1. Tabla de culturas ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cultures (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- ── 2. FK culture_id en noble_ranks ──────────────────────────────────────────
-- Nullable: los rangos medievales hispanos existentes no tienen cultura asignada.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'noble_ranks' AND column_name = 'culture_id'
    ) THEN
        ALTER TABLE noble_ranks
        ADD COLUMN culture_id INT DEFAULT NULL;
    END IF;
END$$;

-- FK (añadir solo si no existe ya)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_noble_rank_culture'
    ) THEN
        ALTER TABLE noble_ranks
        ADD CONSTRAINT fk_noble_rank_culture
        FOREIGN KEY (culture_id) REFERENCES cultures(id);
    END IF;
END$$;

-- Índice para búsquedas por cultura
CREATE INDEX IF NOT EXISTS idx_noble_ranks_culture ON noble_ranks(culture_id);

-- ── 3. Registro de migración ──────────────────────────────────────────────────
INSERT INTO schema_migrations (script_name)
VALUES ('043_cultures_noble_ranks_schema.sql')
ON CONFLICT DO NOTHING;
