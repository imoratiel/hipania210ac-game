CREATE TABLE IF NOT EXISTS bug_reports (
    id          SERIAL PRIMARY KEY,
    player_id   INTEGER REFERENCES players(player_id) ON DELETE SET NULL,
    message     TEXT NOT NULL,
    image_path  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations (script_name)
VALUES ('107_bug_reports.sql')
ON CONFLICT DO NOTHING;
