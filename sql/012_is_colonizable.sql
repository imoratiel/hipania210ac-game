-- Migration 012: Add is_colonizable to terrain_types
-- Controls which terrain types can be claimed as territory during capital founding

ALTER TABLE terrain_types
    ADD COLUMN IF NOT EXISTS is_colonizable BOOLEAN NOT NULL DEFAULT TRUE;

-- Impassable / non-colonizable terrain
UPDATE terrain_types SET is_colonizable = FALSE WHERE name IN ('Río', 'Mar', 'Agua');

-- Show result
SELECT terrain_type_id, name, is_colonizable FROM terrain_types ORDER BY terrain_type_id;
