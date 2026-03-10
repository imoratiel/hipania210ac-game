-- 039_character_capture.sql
-- Adds capture/ransom state to characters for post-battle mechanics

ALTER TABLE characters
    ADD COLUMN IF NOT EXISTS is_captive              BOOLEAN  DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS captured_by_army_id     INT      REFERENCES armies(army_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS ransom_amount           INT      DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS ransom_turns_remaining  INT      DEFAULT NULL;

COMMENT ON COLUMN characters.is_captive             IS 'TRUE when character is held captive by an enemy army';
COMMENT ON COLUMN characters.captured_by_army_id    IS 'Army currently holding this character captive';
COMMENT ON COLUMN characters.ransom_amount          IS 'Gold required to ransom this character (set when capture occurs)';
COMMENT ON COLUMN characters.ransom_turns_remaining IS 'Turns remaining before ransom offer expires';

INSERT INTO schema_migrations (script_name)
VALUES ('039_character_capture.sql')
ON CONFLICT DO NOTHING;
