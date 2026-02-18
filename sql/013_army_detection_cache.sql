-- Migration 013: Cache max detection_range on armies table
-- Avoids a troops+unit_types JOIN on every fog-of-war visibility query.
-- Updated by the application whenever troops are added, removed, or merged.

ALTER TABLE armies
    ADD COLUMN IF NOT EXISTS detection_range INT NOT NULL DEFAULT 1;

-- Populate existing armies with their actual max detection range
UPDATE armies a
SET detection_range = COALESCE((
    SELECT MAX(ut.detection_range)
    FROM troops t
    JOIN unit_types ut ON ut.unit_type_id = t.unit_type_id
    WHERE t.army_id = a.army_id
), 1);

-- Show result
SELECT army_id, name, detection_range FROM armies ORDER BY army_id;
