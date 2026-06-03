UPDATE game_config
SET value = '1200'
WHERE "group" = 'gameplay' AND key = 'turn_duration_seconds';

INSERT INTO schema_migrations (script_name)
VALUES ('104_turn_duration_20min.sql')
ON CONFLICT DO NOTHING;
