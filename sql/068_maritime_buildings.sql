-- 068_maritime_buildings.sql
-- Añade el tipo de edificio marítimo y los 4 puertos por cultura (210 a.C. Hispania).
-- Restricciones: solo en terreno Costa, máximo 1 por Pagus, no requieren prereq.

INSERT INTO building_types (name, icon_slug)
VALUES ('maritime', 'port');

-- Romanos: Portus
INSERT INTO buildings (name, type_id, gold_cost, construction_time_turns, culture_id, description)
SELECT 'Portus',
       bt.building_type_id,
       150000, 60, 1,
       'Puerto romano para el comercio marítimo y el transporte de legiones.'
FROM building_types bt WHERE bt.name = 'maritime';

-- Cartagineses: Cothon (puerto artificial, históricamente auténtico)
INSERT INTO buildings (name, type_id, gold_cost, construction_time_turns, culture_id, description)
SELECT 'Cothon',
       bt.building_type_id,
       150000, 60, 2,
       'Puerto artificial cartaginés con instalaciones navales avanzadas.'
FROM building_types bt WHERE bt.name = 'maritime';

-- Íberos: Emporio (de Emporion, nombre real de colonia comercial ibérica)
INSERT INTO buildings (name, type_id, gold_cost, construction_time_turns, culture_id, description)
SELECT 'Emporio',
       bt.building_type_id,
       150000, 60, 3,
       'Emporio costero ibero para el intercambio con los pueblos del Mediterráneo.'
FROM building_types bt WHERE bt.name = 'maritime';

-- Celtas: Embarcadero
INSERT INTO buildings (name, type_id, gold_cost, construction_time_turns, culture_id, description)
SELECT 'Embarcadero',
       bt.building_type_id,
       150000, 60, 4,
       'Instalación costera celta para el cabotaje y las rutas atlánticas.'
FROM building_types bt WHERE bt.name = 'maritime';

INSERT INTO schema_migrations (script_name)
VALUES ('068_maritime_buildings.sql')
ON CONFLICT DO NOTHING;
