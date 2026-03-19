-- 063_characters_xp_birthturn.sql
-- Añade birth_turn y xp al sistema de personajes.
-- birth_turn: turno de juego en que nació el personaje (para envejecimiento preciso)
-- xp:         experiencia acumulada para subir de nivel (umbral = level * 10)

ALTER TABLE characters
    ADD COLUMN IF NOT EXISTS birth_turn INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS xp         INTEGER NOT NULL DEFAULT 0;

-- Índice útil para el ciclo anual de envejecimiento
CREATE INDEX IF NOT EXISTS idx_characters_player_age
    ON characters (player_id, age);

INSERT INTO schema_migrations (script_name)
VALUES ('063_characters_xp_birthturn.sql')
ON CONFLICT DO NOTHING;
