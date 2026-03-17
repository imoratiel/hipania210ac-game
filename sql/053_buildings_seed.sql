-- 053_buildings_seed.sql
-- Seed de edificios culturales.
-- 4 edificios × 4 culturas = 16 registros.
-- Los parámetros (type_id, gold_cost, turns) son iguales entre culturas;
-- solo el nombre varía.
--
-- type_id: 1=militar  2=religioso  3=económico
-- Culturas: 1=Romanos  2=Cartagineses  3=Íberos  4=Celtas

-- ── Edificios base (sin requisito) ───────────────────────────────────────────
INSERT INTO buildings (name, type_id, gold_cost, construction_time_turns, required_building_id, culture_id) VALUES
-- Militar básico
('Castrum',                 1, 50000, 15, NULL, 1),
('Cuartel de Mercenarios',  1, 50000, 15, NULL, 2),
('Escuela de Guerreros',    1, 50000, 15, NULL, 3),
('Campo Tribal',            1, 50000, 15, NULL, 4),
-- Religioso
('Templo del Juno',         2, 30000, 15, NULL, 1),
('Templo de Baal',          2, 30000, 15, NULL, 2),
('Santuario de Neton',      2, 30000, 15, NULL, 3),
('Claro Sagrado',           2, 30000, 15, NULL, 4),
-- Económico
('Foro',                    3, 30000, 20, NULL, 1),
('Factoría Comercial',      3, 30000, 20, NULL, 2),
('Lonja de Metales',        3, 30000, 20, NULL, 3),
('Feria de Ganado',         3, 30000, 20, NULL, 4);

-- ── Edificios avanzados (requieren el militar básico de su cultura) ───────────
INSERT INTO buildings (name, type_id, gold_cost, construction_time_turns, required_building_id, culture_id)
VALUES
('Castellum',       1, 100000, 45, (SELECT id FROM buildings WHERE name = 'Castrum'),                1),
('Ciudadela Púnica',1, 100000, 45, (SELECT id FROM buildings WHERE name = 'Cuartel de Mercenarios'), 2),
('Oppida',          1, 100000, 45, (SELECT id FROM buildings WHERE name = 'Escuela de Guerreros'),   3),
('Castro',          1, 100000, 45, (SELECT id FROM buildings WHERE name = 'Campo Tribal'),           4);

-- ── Verificación ─────────────────────────────────────────────────────────────
SELECT c.name AS cultura, b.name, bt.name AS tipo, b.gold_cost, b.construction_time_turns,
       req.name AS requiere
FROM buildings b
JOIN building_types bt ON b.type_id = bt.building_type_id
JOIN cultures c ON b.culture_id = c.id
LEFT JOIN buildings req ON b.required_building_id = req.id
ORDER BY b.culture_id, b.type_id, b.id;

INSERT INTO schema_migrations (script_name)
VALUES ('053_buildings_seed.sql')
ON CONFLICT DO NOTHING;
