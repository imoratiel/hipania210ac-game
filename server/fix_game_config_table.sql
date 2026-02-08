-- Fix game_config table to support ON CONFLICT
-- This adds a UNIQUE constraint on (group, key) if it doesn't exist

-- First, check if the table exists, if not create it
CREATE TABLE IF NOT EXISTS game_config (
    "group" VARCHAR(50) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drop the constraint if it already exists (to avoid errors)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'game_config_group_key_unique'
    ) THEN
        ALTER TABLE game_config DROP CONSTRAINT game_config_group_key_unique;
    END IF;
END $$;

-- Add the UNIQUE constraint
ALTER TABLE game_config
ADD CONSTRAINT game_config_group_key_unique UNIQUE ("group", "key");

-- Insert default values if they don't exist
INSERT INTO game_config ("group", "key", "value")
VALUES
    ('exploration', 'turns_required', '5'),
    ('exploration', 'gold_cost', '100'),
    ('infrastructure', 'prod_multiplier_per_level', '0.20'),
    ('infrastructure', 'upgrade_cost_gold_base', '100'),
    ('buildings', 'port_base_cost', '10000')
ON CONFLICT ("group", "key") DO NOTHING;

-- Display current configuration
SELECT * FROM game_config ORDER BY "group", "key";
