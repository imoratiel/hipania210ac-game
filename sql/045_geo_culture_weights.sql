-- 045_geo_culture_weights.sql
-- Tabla de pesos culturales por hexágono para spawn con solapamiento.
-- Añade culture_id y unit_class a unit_types para tropas culturales.

-- ── 1. Tabla geo_culture_weights ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS geo_culture_weights (
    h3_index   VARCHAR(15)  NOT NULL,
    culture_id INT          NOT NULL REFERENCES cultures(id) ON DELETE CASCADE,
    weight     INT          NOT NULL DEFAULT 1 CHECK (weight > 0),
    PRIMARY KEY (h3_index, culture_id)
);

CREATE INDEX IF NOT EXISTS idx_gcw_h3_index   ON geo_culture_weights(h3_index);
CREATE INDEX IF NOT EXISTS idx_gcw_culture_id ON geo_culture_weights(culture_id);

-- ── 2. Columnas culture_id y unit_class en unit_types ────────────────────────
ALTER TABLE unit_types
    ADD COLUMN IF NOT EXISTS culture_id INT DEFAULT NULL REFERENCES cultures(id),
    ADD COLUMN IF NOT EXISTS unit_class VARCHAR(20) DEFAULT NULL;
-- unit_class: INFANTRY_1, ARCHER_1 (básicos de inicio), INFANTRY_2, etc.

CREATE INDEX IF NOT EXISTS idx_unit_types_culture ON unit_types(culture_id);

-- ── 3. Tropas básicas de inicio por cultura ───────────────────────────────────
-- Resetear secuencia por si los inserts anteriores usaron IDs explícitos
SELECT setval('unit_types_unit_type_id_seq', (SELECT MAX(unit_type_id) FROM unit_types));

INSERT INTO unit_types (name, attack, health_points, speed, detection_range, gold_upkeep, food_consumption, is_siege, descrip, culture_id, unit_class)
VALUES
    -- ROMANOS
    ('Hastati',           8,  60, 2, 1, 0.80, 0.001, FALSE,
     'Infantería básica romana con lanza y escudo.',           1, 'INFANTRY_1'),
    ('Velites',           10, 40, 2, 2, 1.00, 0.001, FALSE,
     'Escaramuzadores ligeros romanos con jabalinas.',         1, 'ARCHER_1'),

    -- CARTAGINESES
    ('Libio',             8,  65, 2, 1, 0.80, 0.001, FALSE,
     'Infantería básica cartaginesa de leva africana.',        2, 'INFANTRY_1'),
    ('Honderos Baleares', 11, 35, 2, 3, 1.00, 0.001, FALSE,
     'Especialistas en honda reclutados en las Baleares.',     2, 'ARCHER_1'),

    -- ÍBEROS
    ('Escutari',          9,  55, 2, 1, 0.80, 0.001, FALSE,
     'Guerrero íbero con escudo redondo y falcata.',           3, 'INFANTRY_1'),
    ('Hondero Ibero',     9,  40, 2, 2, 1.00, 0.001, FALSE,
     'Hondero íbero ágil y preciso.',                         3, 'ARCHER_1'),

    -- CELTAS
    ('Guerrero Celta',    10, 65, 2, 1, 0.80, 0.001, FALSE,
     'Feroz guerrero celta con espada larga y grito de guerra.', 4, 'INFANTRY_1'),
    ('Arquero Celta',     9,  45, 2, 2, 1.00, 0.001, FALSE,
     'Arquero celta experto en emboscadas en el bosque.',      4, 'ARCHER_1')
ON CONFLICT DO NOTHING;

-- ── 4. Registro de migración ──────────────────────────────────────────────────
INSERT INTO schema_migrations (script_name)
VALUES ('045_geo_culture_weights.sql')
ON CONFLICT DO NOTHING;
