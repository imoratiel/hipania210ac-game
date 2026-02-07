# Mapeo de Base de Datos - Antigravity

## Tabla: unit_types
- unit_type_id (SERIAL PK)
- name (VARCHAR)
- attack (INT)
- health_points (INT)
- speed (INT)
- detection_range (INT)
- gold_upkeep (DECIMAL 10,2)
- food_consumption (DECIMAL 10,2)
- is_siege (BOOLEAN)
- descrip (TEXT)

## Tabla: armies
- army_id (SERIAL PK)
- name VARCHAR(100) 
- player_id (INT)
- h3_index (VARCHAR 15) <- Usar siempre para localización
- name (TEXT)
- gold_provisions, food_provisions, wood_provisions, etc. (DECIMAL 12,2)
- rest_level (DECIMAL 5,2) 0 a 100, al llegar a 0 se detiene. Si en un turno no se mueves, está descansando y recupera.
- created_at (TIMESTAMP)

## Tabla: territory_details
- h3_index (VARCHAR 15 PK) <- ¡OJO! No tiene columna 'id'
- wood_stored, iron_stored, stone_stored, food_stored (INT)
- discovered_resource (VARCHAR)

## Tabla: unit_requirements 
- id (SERIAL PK)
- unit_type_id (INT FK -> unit_types.unit_type_id)
- resource_type VARCHAR(20),
- amount INT NOT NULL

## Tabla: unit_terrain_modifiers 
- troop_id (SERIAL PK)
- unit_type_id (INT FK -> unit_types.unit_type_id)
- terrain_type VARCHAR(30)
- attack_modificator (DECIMAL 3,2)
- defense_modificator (DECIMAL 3,2)
- speed_modificator (INT)
- stamina_drain_modificator (DECIMAL 3,2)

## Tabla: unit_combat_counters 
- id (SERIAL PK)
- attacker_type_id (INT FK -> unit_types.unit_type_id)
- defender_type_id (INT FK -> unit_types.unit_type_id)
- damage_multiplier (DECIMAL 3,2)

## Tabla: troops 
- troop_id (SERIAL PK)
- army_id (INT FK -> armies.army_id)
- unit_type_id (INT FK -> unit_types.unit_type_id)
- quantity (INT)
- experience (DECIMAL 5,2)
- morale (DECIMAL(5,2)
- last_fed_turn (INT)
