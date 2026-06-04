ALTER TABLE bug_reports
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Nuevo'
        CHECK (status IN ('Nuevo','Pendiente de arreglo','Corregido','Descartado'));

INSERT INTO schema_migrations (script_name)
VALUES ('108_bug_reports_status.sql')
ON CONFLICT DO NOTHING;
