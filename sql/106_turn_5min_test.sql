-- Turno de 5 minutos para pruebas
-- Incluye la columna game_epoch_timestamp si no existe aún (de 105)

ALTER TABLE world_state ADD COLUMN IF NOT EXISTS game_epoch_timestamp TIMESTAMPTZ;

UPDATE game_config
SET value = '300'
WHERE "group" = 'gameplay' AND key = 'turn_duration_seconds';

-- Epoch = próximo múltiplo de 5 min desde el Unix epoch
UPDATE world_state
SET game_epoch_timestamp = TO_TIMESTAMP((FLOOR(EXTRACT(EPOCH FROM NOW()) / 300) + 1) * 300),
    current_turn = 0
WHERE id = 1;

INSERT INTO schema_migrations (script_name)
VALUES ('106_turn_5min_test.sql')
ON CONFLICT DO NOTHING;
