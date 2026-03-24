-- Update troop food consumption to match per-person daily rate (POP/1000)
-- Infantry/ranged: 0.001/turn (1 person equivalent)
-- Cavalry + Scout: 0.003/turn (horse also eats, ~3 persons equivalent)
-- Siege engines: 0 (no living creatures to feed)

UPDATE unit_types SET food_consumption = 0.001 WHERE name IN ('Milicia', 'Soldados', 'Lanceros', 'Arqueros', 'Ballesteros');
UPDATE unit_types SET food_consumption = 0.003 WHERE name IN ('Caballería Ligera', 'Caballería Pesada', 'Explorador');
UPDATE unit_types SET food_consumption = 0.000 WHERE name IN ('Ariete', 'Catapulta');

INSERT INTO schema_migrations (script_name)
VALUES ('040_food_consumption.sql')
ON CONFLICT DO NOTHING;
