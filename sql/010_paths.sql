-- 1. Eliminamos el campo obsoleto (como solicitaste)
ALTER TABLE armies DROP COLUMN IF EXISTS movement_points;

-- 2. Tabla para almacenar las rutas calculadas
CREATE TABLE army_routes (
    army_id INT PRIMARY KEY REFERENCES armies(army_id) ON DELETE CASCADE,
    path JSONB NOT NULL, -- Lista ordenada de hexágonos H3: ["88392...", "88392..."]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Comentario explicativo
COMMENT ON TABLE army_routes IS 'Almacena el camino pre-calculado para cada ejército en movimiento';
COMMENT ON COLUMN army_routes.path IS 'Array JSON con los índices H3 del camino completo, excluyendo la posición actual';