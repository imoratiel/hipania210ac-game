-- 057_oauth_accounts.sql
-- Tabla para vincular cuentas OAuth (Google) a jugadores.
-- UNIQUE(provider, email) actúa como barrera anti-multicuentas.

CREATE TABLE IF NOT EXISTS oauth_accounts (
    id          SERIAL PRIMARY KEY,
    player_id   INT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    provider    VARCHAR(32)  NOT NULL,    -- 'google'
    provider_id VARCHAR(128) NOT NULL,
    email       VARCHAR(255),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, provider_id),
    UNIQUE(provider, email)
);

-- El campo password pasa a ser opcional (usuarios OAuth no tienen contraseña)
ALTER TABLE players ALTER COLUMN password DROP NOT NULL;

INSERT INTO schema_migrations (script_name)
VALUES ('057_oauth_accounts.sql')
ON CONFLICT DO NOTHING;
