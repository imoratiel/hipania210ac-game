-- Migración: Mover lógica de capital de h3_map a players
-- La columna is_capital ya fue eliminada en 008_h3_xy.sql
-- Ahora actualizamos la vista v_map_display para calcular is_capital dinámicamente

-- Recrear la vista v_map_display con cálculo dinámico de is_capital
DROP VIEW IF EXISTS v_map_display CASCADE;

CREATE OR REPLACE VIEW v_map_display AS
SELECT
    m.h3_index,
    m.terrain_type_id,
    t.name AS terrain_name,
    t.color AS terrain_color,
    m.has_road,
    -- Calcular is_capital dinámicamente: TRUE si este h3_index es la capital del jugador propietario
    CASE
        WHEN m.player_id IS NOT NULL AND p_owner.capital_h3 = m.h3_index THEN TRUE
        ELSE FALSE
    END AS is_capital,
    m.player_id,
    p_owner.color AS player_color,
    p_owner.username AS owner_name,
    m.building_type_id,
    bt.icon_slug,
    COALESCE(td.custom_name, s.name) AS location_name,
    s.type AS settlement_type,
    s.population_rank,
    m.coord_x, 
    m.coord_y 
FROM h3_map m
JOIN terrain_types t ON m.terrain_type_id = t.terrain_type_id
LEFT JOIN players p_owner ON m.player_id = p_owner.player_id
LEFT JOIN building_types bt ON m.building_type_id = bt.building_type_id
LEFT JOIN settlements s ON m.h3_index = s.h3_index
LEFT JOIN territory_details td ON m.h3_index = td.h3_index;

-- Verificar que la vista funciona correctamente
DO $$
DECLARE
    view_count INT;
    capital_count INT;
BEGIN
    -- Contar registros en la vista
    SELECT COUNT(*) INTO view_count FROM v_map_display;
    RAISE NOTICE 'Vista v_map_display recreada: % registros totales', view_count;

    -- Contar capitales detectadas
    SELECT COUNT(*) INTO capital_count FROM v_map_display WHERE is_capital = TRUE;
    RAISE NOTICE 'Capitales detectadas en la vista: %', capital_count;

    IF view_count > 0 THEN
        RAISE NOTICE '✓ Vista v_map_display actualizada correctamente';
    ELSE
        RAISE WARNING '⚠ Vista v_map_display está vacía (esto es normal si no hay datos)';
    END IF;
END $$;

-- Insert default values if they don't exist
INSERT INTO game_config ("group", "key", "value")
VALUES
    ('exploration', 'turns_required', '5'),
    ('exploration', 'gold_cost', '100')
ON CONFLICT ("group", "key") DO NOTHING;


-- 1. Añadimos el presupuesto de puntos de movimiento actual
ALTER TABLE armies ADD COLUMN movement_points DECIMAL(5,2) DEFAULT 0.0;

-- 3. Comentario para el esquema
COMMENT ON COLUMN armies.movement_points IS 'Puntos de movimiento restantes para el turno actual (permite decimales para penalizaciones)';

-- 1. Eliminamos el descanso a nivel de ejército (si existía)
ALTER TABLE armies DROP COLUMN IF EXISTS rest_level;

-- 2. Añadimos el descanso a nivel de unidad dentro del ejército
-- Usamos un valor de 0 a 100
ALTER TABLE troops ADD COLUMN stamina DECIMAL(5,2) DEFAULT 100.0;

-- 3. Comentario para el esquema
COMMENT ON COLUMN troops.stamina IS 'Nivel de fatiga de este grupo específico de unidades dentro del ejército (0-100)';

-- Añadimos el campo para el bloqueo de movimiento por agotamiento
ALTER TABLE troops ADD COLUMN force_rest BOOLEAN DEFAULT FALSE;

-- Comentario para el esquema
COMMENT ON COLUMN troops.force_rest IS 'Si es TRUE, la unidad está colapsada y no puede moverse hasta recuperar el 25% de stamina';

