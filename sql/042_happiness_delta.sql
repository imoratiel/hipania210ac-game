-- 042_happiness_delta.sql
-- Añade columna happiness_delta a territory_details para registrar
-- el cambio de felicidad en el último ciclo mensual.

ALTER TABLE territory_details
ADD COLUMN IF NOT EXISTS happiness_delta INT NOT NULL DEFAULT 0;

INSERT INTO schema_migrations (script_name)
VALUES ('042_happiness_delta.sql')
ON CONFLICT DO NOTHING;
