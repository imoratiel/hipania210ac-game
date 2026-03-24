-- 069_naval_system.sql
-- Naval system: fleets, ship types, embarkation, naval movement.

-- ── Step 1: Naval passability flag on terrain_types ────────────────────────
ALTER TABLE terrain_types ADD COLUMN IF NOT EXISTS is_naval_passable BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE terrain_types SET is_naval_passable = TRUE WHERE name IN ('Mar', 'Costa');

-- ── Step 2: ship_types catalog ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ship_types (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    culture_id          INT REFERENCES cultures(id),
    category            VARCHAR(20) NOT NULL CHECK (category IN ('transport', 'warship')),
    transport_capacity  INT NOT NULL DEFAULT 0,   -- troops per ship (0 for warships)
    gold_cost           INT NOT NULL,
    upkeep_gold         INT NOT NULL DEFAULT 0,
    attack              INT NOT NULL DEFAULT 0,
    defense             INT NOT NULL DEFAULT 0,
    speed               INT NOT NULL DEFAULT 2,   -- hexes/turn at sea
    description         TEXT
);

-- ── Step 3: fleet_ships (ships inside a fleet) ─────────────────────────────
CREATE TABLE IF NOT EXISTS fleet_ships (
    id              SERIAL PRIMARY KEY,
    army_id         INT NOT NULL REFERENCES armies(army_id) ON DELETE CASCADE,
    ship_type_id    INT NOT NULL REFERENCES ship_types(id),
    quantity        INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    UNIQUE (army_id, ship_type_id)
);

-- ── Step 4: Extend armies table ────────────────────────────────────────────
ALTER TABLE armies
    ADD COLUMN IF NOT EXISTS is_naval        BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS transported_by  INT REFERENCES armies(army_id),
    ADD COLUMN IF NOT EXISTS anchored_at_h3  TEXT;

-- ── Step 5: Seed ship_types ────────────────────────────────────────────────

-- Romano (culture_id = 1)
INSERT INTO ship_types (name, culture_id, category, transport_capacity, gold_cost, upkeep_gold, attack, defense, speed, description) VALUES
    ('Navis Oneraria', 1, 'transport', 100, 8000,  200, 1, 3, 2,
     'Nave de carga romana. Capaz de transportar hasta 100 soldados o suministros.'),
    ('Trireme',        1, 'warship',     0, 15000, 500, 8, 5, 3,
     'Buque de guerra romano de tres hileras de remos. Rápido y letal en el combate naval.');

-- Cartaginés (culture_id = 2)
INSERT INTO ship_types (name, culture_id, category, transport_capacity, gold_cost, upkeep_gold, attack, defense, speed, description) VALUES
    ('Hippo',          2, 'transport', 100, 8000,  200, 1, 3, 2,
     'Nave de carga cartaginesa de fondo plano, ideal para el comercio y el transporte de tropas.'),
    ('Pentecóntero',   2, 'warship',     0, 15000, 500, 8, 5, 3,
     'Galera cartaginesa de cincuenta remos. Ágil y temida en el Mediterráneo occidental.');

-- Íbero (culture_id = 3)
INSERT INTO ship_types (name, culture_id, category, transport_capacity, gold_cost, upkeep_gold, attack, defense, speed, description) VALUES
    ('Barca de Carga', 3, 'transport', 100, 8000,  200, 1, 3, 2,
     'Embarcación ibérica robusta para el transporte costero de tropas y mercancías.'),
    ('Liburna',        3, 'warship',     0, 15000, 500, 7, 5, 3,
     'Nave de guerra ligera ibérica, rápida y maniobrable en las costas peninsulares.');

-- Celta (culture_id = 4)
INSERT INTO ship_types (name, culture_id, category, transport_capacity, gold_cost, upkeep_gold, attack, defense, speed, description) VALUES
    ('Currach de Carga',   4, 'transport', 100, 8000,  200, 1, 3, 2,
     'Embarcación celta de madera y cuero. Sorprendentemente capaz en costas atlánticas.'),
    ('Currach de Guerra',  4, 'warship',     0, 15000, 500, 7, 4, 3,
     'Nave de guerra celta. Usada por los pueblos costeros del norte para razzias y defensa.');

-- ── Migration record ────────────────────────────────────────────────────────
INSERT INTO schema_migrations (script_name)
VALUES ('069_naval_system.sql')
ON CONFLICT DO NOTHING;
