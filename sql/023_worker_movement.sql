-- Add destination_h3 to workers for turn-based straight-line movement
ALTER TABLE workers ADD COLUMN IF NOT EXISTS destination_h3 VARCHAR(20) NULL;

-- Partial index: only rows that actually have a destination need fast lookup
CREATE INDEX IF NOT EXISTS idx_workers_destination ON workers(destination_h3)
    WHERE destination_h3 IS NOT NULL;

-- Gestión de obras en progreso (incluye trabajadores consumidos)
CREATE TABLE IF NOT EXISTS active_constructions (
    h3_index VARCHAR(15) PRIMARY KEY, -- Solo puede haber una obra por hexágono
    type VARCHAR(20) DEFAULT 'BRIDGE', -- Extensible a otros edificios
    progress_turns INT DEFAULT 0,
    total_turns INT DEFAULT 365, -- 1 año = 365 turnos (o el valor que definas)
    player_id INT REFERENCES players(player_id)
);

-- Tabla de puentes finalizados (la "fuente de verdad" para el movimiento)
CREATE TABLE IF NOT EXISTS bridges (
    h3_index VARCHAR(15) PRIMARY KEY, -- Índice donde está el puente
    constructed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public.terrain_types
(terrain_type_id, "name", color, food_output, wood_output, stone_output, iron_output, fishing_output, defense_bonus, movement_cost, is_colonizable)
VALUES(15, 'Puente', '#505050', 90, 10, 0, 0, 5, 200, 1.0, false);

INSERT INTO schema_migrations (script_name)
VALUES ('023_worker_movement.sql');
