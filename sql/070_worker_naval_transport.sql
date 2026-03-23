-- Workers can now be transported by a fleet.
-- transported_by → army_id of the fleet carrying this worker (NULL = not on a fleet).
ALTER TABLE workers
    ADD COLUMN IF NOT EXISTS transported_by INTEGER REFERENCES armies(army_id) ON DELETE SET NULL;

-- ── Migration record ────────────────────────────────────────────────────────
INSERT INTO schema_migrations (script_name)
VALUES ('070_worker_naval_transport.sql')
ON CONFLICT DO NOTHING;
