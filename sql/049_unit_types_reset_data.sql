-- 049_unit_types_reset_data.sql
-- Limpia unit_types y tablas dependientes, e inserta las nuevas unidades por cultura.
--
-- ⚠️  PRECAUCIÓN: TRUNCATE CASCADE elimina también los datos de:
--    troops, unit_combat_counters, unit_terrain_modifiers, unit_requirements
--
-- Columnas: name, attack, defense, health_points, speed, initial_experience,
--           detection_range, gold_upkeep, food_consumption, recruit_cost,
--           is_siege, descrip, culture_id, unit_class
--
-- unit_class valores usados:
--   INFANTRY_1     → infantería básica de inicio (se usa en tropas iniciales)
--   INFANTRY_2     → infantería veterana / pesada
--   INFANTRY_ELITE → unidades de élite (requisito de rango)
--   ARCHER_1       → arqueros / hostigadores de inicio
--   ARCHER_2       → arqueros avanzados
--   CAVALRY_1      → caballería básica
--   CAVALRY_2      → caballería de élite
--   SIEGE          → máquinas de asedio (food_consumption = 0)
--
-- Culturas: 1=Romanos  2=Cartago  3=Íberos  4=Celtas

-- ── 1. Limpiar tablas dependientes ──────────────────────────────────────────
TRUNCATE unit_requirements       RESTART IDENTITY CASCADE;
TRUNCATE unit_terrain_modifiers  RESTART IDENTITY CASCADE;
TRUNCATE unit_combat_counters    RESTART IDENTITY CASCADE;
TRUNCATE troops                  CASCADE;
TRUNCATE unit_types              RESTART IDENTITY CASCADE;

-- ── 2. Insertar nuevas unidades ──────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════════════════════
-- ROMANOS  (culture_id = 1)
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO unit_types (name, attack, defense, health_points, speed, initial_experience, detection_range, gold_upkeep, food_consumption, recruit_cost, is_siege, descrip, culture_id, unit_class) VALUES
('Hastati',        7, 6, 5,  3, 20, 3,   6, 1, 120,  FALSE, 'Base de la legión.',         1, 'INFANTRY_1'),
('Triarii',        6, 9, 7,  2, 30, 3,  15, 1, 300,  FALSE, 'Muy caros, pero el muro final.', 1, 'INFANTRY_2'),
('Equites',        4, 4, 6,  5, 20, 6,   5, 2, 100,  FALSE, 'Movilidad básica.',           1, 'CAVALRY_1'),
('Auxilia',  7, 6, 7,  4, 20, 4,   9, 2, 180,  FALSE, 'Versatilidad aliada.',        1, 'CAVALRY_2'),
('Velites',        8, 3, 4,  4, 20, 3,   4, 1,  90,  FALSE, 'Hostigadores baratos.',       1, 'ARCHER_1'),
('Sagitarii',      6, 4, 4,  3, 20, 3,   4, 1,  80,  FALSE, 'Apoyo constante.',            1, 'ARCHER_2'),
('Pretorianos',   10, 9, 10, 2, 50, 3,  50, 1, 1000, FALSE, 'Solo para el Rango 6.',       1, 'INFANTRY_ELITE'),
('Onagro',         1, 1, 1,  1,100, 0, 250, 1, 1200, TRUE,  'Pieza tecnológica lenta.',    1, 'SIEGE');

-- ══════════════════════════════════════════════════════════════════════════════
-- CARTAGO  (culture_id = 2)
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO unit_types (name, attack, defense, health_points, speed, initial_experience, detection_range, gold_upkeep, food_consumption, recruit_cost, is_siege, descrip, culture_id, unit_class) VALUES
('Infantería Libia',          7, 7, 5,  3, 20, 3,   7, 1, 150,  FALSE, 'Infantería profesional.',       2, 'INFANTRY_1'),
('Mercenarios Galos',         9, 4, 6,  4, 50, 3,  20, 1, 400,  FALSE, 'Reclutamiento instantáneo.',    2, 'INFANTRY_2'),
('Caballería Numida',   5, 3, 6,  7, 20, 6,   5, 2, 100,  FALSE, 'Maestros del mapa H3.',         2, 'CAVALRY_1'),
('Caballería Hispana',  7, 6, 7,  4, 50, 4,  22, 2, 450,  FALSE, 'Carga potente.',                2, 'CAVALRY_2'),
('Honderos Baleares',   8, 3, 4,  4, 20, 3,   5, 1,  90,  FALSE, 'Ignoran armadura.',             2, 'ARCHER_1'),
('Arqueros Fenicios',   6, 6, 4,  3, 40, 3,  10, 1, 200,  FALSE, 'Larga distancia.',              2, 'ARCHER_2'),
('Elefantes',          12, 8, 30, 3, 20, 2,  50, 4, 1200, FALSE, 'Consumo masivo de comida.',     2, 'INFANTRY_ELITE'),
('Ariete',              1, 1, 1,  1,100, 0, 250, 1, 1200, TRUE,  'Asedio protegido.',             2, 'SIEGE');

-- ══════════════════════════════════════════════════════════════════════════════
-- ÍBEROS  (culture_id = 3)
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO unit_types (name, attack, defense, health_points, speed, initial_experience, detection_range, gold_upkeep, food_consumption, recruit_cost, is_siege, descrip, culture_id, unit_class) VALUES
('Caetrati',    6, 5, 5, 5, 20, 3,  5, 1, 100,  FALSE, 'Guerrilla barata.',       3, 'INFANTRY_1'),
('Scutarii',    8, 5, 6, 4, 20, 3,  7, 1, 150,  FALSE, 'Crítico con Falcata.',    3, 'INFANTRY_2'),
('Jinetes con Lanza',  6, 4, 6, 6, 20, 6,  6, 2, 120,  FALSE, 'Golpe y fuga.',           3, 'CAVALRY_1'),
('Jinetes de Élite',  8, 6, 7, 4, 40, 4, 20, 2, 400,  FALSE, 'Polivalentes.',           3, 'CAVALRY_2'),
('Falarica',    7, 3, 4, 4, 20, 3,  4, 1,  80,  FALSE, 'Daño por fuego.',         3, 'ARCHER_1'),
('Honderos',    6, 4, 4, 5, 30, 3,  6, 1, 120,  FALSE, 'Muy rápidos.',            3, 'ARCHER_2'),
('Devotio',     8, 8, 7, 4, 60, 3,  0, 1, 900,  FALSE, 'Coste Oro 0 (Lealtad).', 3, 'INFANTRY_ELITE'),
('Ariete',      1, 1, 1, 1,100, 1,250, 0, 1200, TRUE,  'Asedio protegido.',       3, 'SIEGE');

-- ══════════════════════════════════════════════════════════════════════════════
-- CELTAS  (culture_id = 4)
-- ══════════════════════════════════════════════════════════════════════════════
INSERT INTO unit_types (name, attack, defense, health_points, speed, initial_experience, detection_range, gold_upkeep, food_consumption, recruit_cost, is_siege, descrip, culture_id, unit_class) VALUES
('Celtíberos',               8, 6, 5,  3, 20, 3,  7, 1, 140,  FALSE, 'Duros y feroces.',         4, 'INFANTRY_1'),
('Lanceros del Norte',       5, 8, 6,  2, 20, 3,  7, 1, 150,  FALSE, 'Muro de escudos.',         4, 'INFANTRY_2'),
('Cazadores',                7, 3, 4,  5, 20, 3,  4, 1,  80,  FALSE, 'Sigilo en bosques.',       4, 'ARCHER_1'),
('Lanzahachas',              8, 5, 4,  3, 30, 3,  8, 1, 150,  FALSE, 'Rompe-escudos.',           4, 'INFANTRY_2'),
('Caballería Exploración',      4, 3, 5,  6, 20, 6,  4, 2,  70,  FALSE, 'Visión en el mapa.',       4, 'CAVALRY_1'),
('Nobles a Caballo',         9, 7, 7,  4, 50, 4, 25, 2, 550,  FALSE, 'Carga devastadora.',       4, 'CAVALRY_2'),
('Carros',                   9, 7, 12, 5, 60, 4, 60, 2, 1200, FALSE, 'Unidad de prestigio.',     4, 'INFANTRY_ELITE'),
('Ariete',                   1, 1, 1,  1,100, 1,250, 0, 1200, TRUE,  'Asedio protegido.',        4, 'SIEGE');

-- ── 3. Verificación ──────────────────────────────────────────────────────────
SELECT culture_id, unit_class, COUNT(*) as units
FROM unit_types
GROUP BY culture_id, unit_class
ORDER BY culture_id, unit_class;

INSERT INTO schema_migrations (script_name)
VALUES ('049_unit_types_reset_data.sql')
ON CONFLICT DO NOTHING;
