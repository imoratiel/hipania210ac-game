-- 2. Building Definitions (Static data)
CREATE TABLE buildings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type_id INT NOT NULL REFERENCES building_types(building_type_id),
    gold_cost INT DEFAULT 0,
    construction_time_turns INT DEFAULT 1,
    required_building_id INT NULL REFERENCES buildings(id),
    food_bonus INT DEFAULT 0,
    description TEXT
);

-- 3. Fief Buildings (Dynamic data - replaces adding columns to h3_map)
-- This table links a specific hex (h3_index) with a building and its status
CREATE TABLE fief_buildings (
    h3_index TEXT PRIMARY KEY REFERENCES h3_map(h3_index),
    building_id INT NOT NULL REFERENCES buildings(id),
    remaining_construction_turns INT DEFAULT 0,
    is_under_construction BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

TRUNCATE TABLE building_types RESTART IDENTITY CASCADE;

-- 4. Initial Data Seed
INSERT INTO building_types (name, icon_slug) VALUES 
('military',''), ('religious',''), ('economic',''), ('other','');

INSERT INTO buildings (name, type_id, gold_cost, construction_time_turns, food_bonus) 
VALUES 
('Barracks', 1, 5000, 3, 0),
('Church', 2, 3000, 2, 5),
('Market', 3, 4000, 2, 10);

-- Fortress requires Barracks (ID 1)
INSERT INTO buildings (name, type_id, gold_cost, construction_time_turns, required_building_id) 
VALUES 
('Fortress', 1, 15000, 6, 1);


-- (Cambiando el nombre al que corresponda en tu secuencia)
INSERT INTO schema_migrations (script_name) 
VALUES ('019_buildings.sql');