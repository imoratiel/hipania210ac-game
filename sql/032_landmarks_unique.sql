-- Añade UNIQUE constraint en landmarks.h3_index
-- Necesario para ON CONFLICT (h3_index) DO NOTHING en el ETL de landmarks.
-- Si ya existe la tabla sin el constraint, esta migración lo añade de forma segura.

-- Eliminar duplicados si los hubiera (mantiene el de menor id)
DELETE FROM landmarks
WHERE id NOT IN (
    SELECT MIN(id)
    FROM landmarks
    GROUP BY h3_index
);

-- Convertir el índice normal existente a UNIQUE
DROP INDEX IF EXISTS idx_landmarks_h3;
ALTER TABLE landmarks ADD CONSTRAINT landmarks_h3_index_unique UNIQUE (h3_index);

CREATE INDEX IF NOT EXISTS idx_landmarks_h3 ON landmarks(h3_index);



INSERT INTO schema_migrations (script_name)
VALUES ('032_landmarks_unique.sql')
ON CONFLICT DO NOTHING;
