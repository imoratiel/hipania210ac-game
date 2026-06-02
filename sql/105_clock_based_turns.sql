-- Turnos basados en reloj real, alineados a :00/:10/:20/:30/:40/:50 UTC
-- El turno esperado se calcula como: floor((now - epoch) / 600s) + 1

ALTER TABLE world_state ADD COLUMN IF NOT EXISTS game_epoch_timestamp TIMESTAMPTZ;

-- Epoch = próximo múltiplo de 10 min desde el Unix epoch (primer turno que disparará el engine)
UPDATE world_state
SET game_epoch_timestamp = TO_TIMESTAMP((FLOOR(EXTRACT(EPOCH FROM NOW()) / 600) + 1) * 600),
    current_turn = 0
WHERE id = 1;

-- Turno de 10 minutos
UPDATE game_config
SET value = '600'
WHERE "group" = 'gameplay' AND key = 'turn_duration_seconds';

INSERT INTO schema_migrations (script_name)
VALUES ('105_clock_based_turns.sql')
ON CONFLICT DO NOTHING;
