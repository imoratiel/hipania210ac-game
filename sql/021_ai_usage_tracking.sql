-- AI Usage Statistics: tracks token consumption and cost per bot/model
CREATE TABLE IF NOT EXISTS ai_usage_stats (
    stat_id         SERIAL PRIMARY KEY,
    bot_id          INTEGER NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    model_name      VARCHAR(100) NOT NULL,
    calls_count     INTEGER NOT NULL DEFAULT 0,
    total_tokens    INTEGER NOT NULL DEFAULT 0,
    estimated_cost  DECIMAL(10, 6) NOT NULL DEFAULT 0,
    last_call_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (bot_id, model_name)
);

-- Global configuration key-value store (used by AIProxyService)
CREATE TABLE IF NOT EXISTS global_settings (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Default AI configuration values
INSERT INTO global_settings (key, value) VALUES
    ('ai_enabled',       'false'),
    ('ai_provider',      'procedural'),
    ('max_token_budget', '100000')
ON CONFLICT (key) DO NOTHING;

INSERT INTO schema_migrations (script_name)
VALUES ('021_ai_usage_tracking.sql');
