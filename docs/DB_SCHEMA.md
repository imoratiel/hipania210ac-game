# Esquema de Base de Datos — Marca Hispánica

> Generado automáticamente via MCP PostgreSQL · 2026-03-16

---

## Índice de Tablas

| Tabla | Descripción |
|-------|-------------|
| [active_constructions](#active_constructions) | Construcciones en progreso (puentes, etc.) |
| [ai_usage_stats](#ai_usage_stats) | Estadísticas de uso de modelos IA por bot |
| [armies](#armies) | Ejércitos de los jugadores |
| [army_actions_cooldowns](#army_actions_cooldowns) | Cooldowns de acciones de ejércitos |
| [army_routes](#army_routes) | Rutas A* calculadas para movimiento |
| [bridges](#bridges) | Puentes construidos sobre hexágonos |
| [building_types](#building_types) | Categorías de edificios |
| [buildings](#buildings) | Catálogo de edificios construibles |
| [character_abilities](#character_abilities) | Habilidades de personajes |
| [characters](#characters) | Personajes / dinastía |
| [fief_buildings](#fief_buildings) | Edificio construido en cada feudo (1 por hex) |
| [game_config](#game_config) | Configuración dinámica del juego (group/key/value) |
| [global_settings](#global_settings) | Ajustes globales del sistema |
| [h3_map](#h3_map) | Mapa principal de hexágonos H3 |
| [landmarks](#landmarks) | Puntos de interés geográficos |
| [messages](#messages) | Mensajería entre jugadores |
| [noble_ranks](#noble_ranks) | Rangos nobiliarios y sus requisitos |
| [notifications](#notifications) | Notificaciones del sistema para jugadores |
| [players](#players) | Jugadores y bots |
| [political_divisions](#political_divisions) | Señoríos y divisiones políticas |
| [schema_migrations](#schema_migrations) | Registro de scripts SQL aplicados |
| [settlements](#settlements) | Asentamientos con nombre en el mapa |
| [terrain_types](#terrain_types) | Tipos de terreno y sus propiedades |
| [territory_details](#territory_details) | Datos económicos y de estado de cada feudo |
| [troops](#troops) | Tropas dentro de cada ejército |
| [unit_combat_counters](#unit_combat_counters) | Multiplicadores de daño entre tipos de unidad |
| [unit_requirements](#unit_requirements) | Requisitos de recursos para reclutar unidades |
| [unit_terrain_modifiers](#unit_terrain_modifiers) | Modificadores de terreno por tipo de unidad |
| [unit_types](#unit_types) | Catálogo de tipos de unidad |
| [workers](#workers) | Trabajadores (exploradores, constructores) |
| [workers_types](#workers_types) | Catálogo de tipos de trabajador |
| [world_state](#world_state) | Estado global del mundo (turno, fecha, pausa) |
| [v_map_display](#v_map_display) | Vista — datos de mapa para el frontend |

---

## active_constructions

Construcciones en progreso sobre un hexágono.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `h3_index` | varchar(15) | NO | — | **PK** · FK → h3_map |
| `type` | varchar(20) | SÍ | `'BRIDGE'` | Tipo de construcción |
| `progress_turns` | int | SÍ | `0` | Turnos completados |
| `total_turns` | int | SÍ | `365` | Turnos totales requeridos |
| `player_id` | int | SÍ | — | FK → players |

---

## ai_usage_stats

Estadísticas de consumo de API de IA por bot.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `stat_id` | int | NO | serial | **PK** |
| `bot_id` | int | NO | — | FK → players · UNIQUE(bot_id, model_name) |
| `model_name` | varchar | NO | — | UNIQUE(bot_id, model_name) |
| `calls_count` | int | NO | `0` | |
| `total_tokens` | int | NO | `0` | |
| `estimated_cost` | numeric | NO | `0` | |
| `last_call_at` | timestamptz | SÍ | `now()` | |

---

## armies

Ejércitos activos en el mapa.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `army_id` | int | NO | serial | **PK** |
| `name` | varchar | NO | — | |
| `player_id` | int | NO | — | Propietario |
| `h3_index` | varchar | NO | — | Posición actual |
| `gold_provisions` | numeric | SÍ | `0.00` | |
| `food_provisions` | numeric | SÍ | `0.00` | |
| `wood_provisions` | numeric | SÍ | `0.00` | |
| `stone_provisions` | numeric | SÍ | `0.00` | |
| `iron_provisions` | numeric | SÍ | `0.00` | |
| `speed_penalty_multiplier` | numeric | SÍ | `1.00` | |
| `created_at` | timestamp | SÍ | `now()` | |
| `detection_range` | int | NO | `1` | Rango de detección en hexes |
| `destination` | varchar | SÍ | — | Destino de movimiento actual |
| `recovering` | int | SÍ | `0` | Turnos de recuperación restantes |
| `is_garrison` | bool | NO | `false` | Guarnición fija en feudo |

---

## army_actions_cooldowns

Cooldowns por acción de ejército (p.ej. exploración).

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `id` | int | NO | serial | **PK** |
| `army_id` | int | NO | — | FK → armies |
| `action_type` | varchar | NO | — | |
| `turns_remaining` | int | NO | `1` | |
| `created_at` | timestamp | SÍ | `now()` | |

---

## army_routes

Ruta A* pre-calculada para un ejército.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `army_id` | int | NO | — | **PK** · FK → armies |
| `path` | jsonb | NO | — | Array de h3_index |
| `created_at` | timestamp | SÍ | `now()` | |
| `updated_at` | timestamp | SÍ | `now()` | |

---

## bridges

Hexágonos con puente construido.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `h3_index` | varchar | NO | — | **PK** |
| `constructed_at` | timestamp | SÍ | `now()` | |

---

## building_types

Categorías de edificios (Militar, Económico, etc.).

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `building_type_id` | int | NO | serial | **PK** |
| `name` | varchar | NO | — | |
| `icon_slug` | varchar | SÍ | — | |

---

## buildings

Catálogo de edificios construibles.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `id` | int | NO | serial | **PK** |
| `name` | varchar | NO | — | |
| `type_id` | int | NO | — | FK → building_types |
| `gold_cost` | int | SÍ | `0` | |
| `construction_time_turns` | int | SÍ | `1` | |
| `required_building_id` | int | SÍ | — | FK → buildings (prerequisito) |
| `food_bonus` | int | SÍ | `0` | |
| `description` | text | SÍ | — | |

---

## character_abilities

Habilidades adquiridas por un personaje.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `id` | int | NO | serial | **PK** |
| `character_id` | int | NO | — | FK → characters · UNIQUE(character_id, ability_key) |
| `ability_key` | varchar | NO | — | |
| `level` | int | SÍ | `1` | |

---

## characters

Personajes (comandantes, herederos, familia).

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `id` | int | NO | serial | **PK** |
| `player_id` | int | NO | — | FK → players |
| `name` | varchar | NO | — | |
| `age` | int | SÍ | `20` | |
| `health` | int | SÍ | `100` | |
| `level` | int | SÍ | `1` | |
| `personal_guard` | int | SÍ | `25` | Guardias personales |
| `is_heir` | bool | SÍ | `false` | |
| `is_main_character` | bool | SÍ | `false` | Personaje principal de la dinastía |
| `parent_character_id` | int | SÍ | — | FK → characters (árbol genealógico) |
| `army_id` | int | SÍ | — | Ejército asignado (null = standalone) |
| `created_at` | timestamp | SÍ | `now()` | |
| `h3_index` | varchar | SÍ | — | FK → h3_map · posición actual |
| `destination` | varchar | SÍ | — | FK → h3_map · destino de movimiento |
| `is_captive` | bool | SÍ | `false` | |
| `captured_by_army_id` | int | SÍ | — | FK → armies |
| `ransom_amount` | int | SÍ | — | |
| `ransom_turns_remaining` | int | SÍ | — | |

---

## fief_buildings

Edificio construido en un feudo. **Un único edificio por hexágono** (h3_index es PK).

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `h3_index` | text | NO | — | **PK** · FK → h3_map |
| `building_id` | int | NO | — | FK → buildings |
| `remaining_construction_turns` | int | SÍ | `0` | 0 = completado |
| `is_under_construction` | bool | SÍ | `true` | |
| `created_at` | timestamp | SÍ | `now()` | |

---

## game_config

Configuración dinámica del juego. Clave compuesta `(group, key)`.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `id` | int | NO | serial | **PK** |
| `group` | varchar | SÍ | — | UNIQUE(group, key) |
| `key` | varchar | SÍ | — | |
| `value` | varchar | SÍ | — | |

---

## global_settings

Ajustes de sistema de clave única.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `key` | varchar | NO | — | **PK** |
| `value` | text | NO | — | |
| `updated_at` | timestamptz | SÍ | `now()` | |

---

## h3_map

Tabla principal del mapa. Cada fila es un hexágono H3.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `h3_index` | text | NO | — | **PK** · índice H3 (BIGINT semántico) |
| `terrain_type_id` | int | NO | — | FK → terrain_types |
| `player_id` | int | SÍ | — | FK → players · null = sin dueño |
| `has_road` | bool | SÍ | `false` | |
| `last_update` | timestamp | SÍ | `now()` | |
| `coord_x` | int | SÍ | `0` | Coordenada de cuadrícula |
| `coord_y` | int | SÍ | `0` | Coordenada de cuadrícula |

---

## landmarks

Puntos de interés con nombre en el mapa.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `id` | int | NO | serial | **PK** |
| `name` | varchar | NO | — | |
| `h3_index` | varchar | NO | — | UNIQUE |
| `type` | varchar | SÍ | — | |

---

## messages

Mensajes directos entre jugadores.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `id` | int | NO | serial | **PK** |
| `sender_id` | int | SÍ | — | FK → players |
| `receiver_id` | int | SÍ | — | FK → players |
| `subject` | varchar | SÍ | — | |
| `body` | text | SÍ | — | |
| `h3_index` | text | SÍ | — | Hexágono de contexto (opcional) |
| `is_read` | bool | SÍ | `false` | |
| `sent_at` | timestamp | SÍ | `now()` | |
| `thread_id` | int | SÍ | — | Hilo de conversación |

---

## noble_ranks

Rangos nobiliarios. Determinan el nivel del jugador y el tamaño máximo de señorío.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `id` | int | NO | serial | **PK** |
| `title_male` | varchar | NO | — | |
| `title_female` | varchar | NO | — | |
| `territory_name` | varchar | NO | — | Nombre del territorio (Señorío, Baronía…) |
| `min_fiefs_required` | int | NO | `0` | Mínimo de feudos para alcanzar el rango |
| `level_order` | int | NO | — | Orden jerárquico (1=Infanzón … 8=Rey) |
| `required_parent_rank_id` | int | SÍ | — | Rango padre requerido |
| `required_count` | int | SÍ | `0` | Número de señoríos del rango padre requeridos |
| `max_fiefs_limit` | int | SÍ | `999` | Máximo de feudos por señorío en este rango |

**Datos actuales:**

| id | title_male | min_fiefs | max_fiefs | level_order |
|----|------------|-----------|-----------|-------------|
| 1 | Infanzón | 1 | 100 | 1 |
| 2 | Señor | 30 | 40 | 2 |
| 3 | Barón | 120 | 150 | 3 |
| 4 | Vizconde | 250 | 400 | 4 |
| 5 | Conde | 500 | 600 | 5 |
| 6 | Marqués | 800 | 1000 | 6 |
| 7 | Duque | 1200 | 1500 | 7 |
| 8 | Rey | 2000 | 5000 | 8 |

---

## notifications

Notificaciones del sistema para cada jugador.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `id` | int | NO | serial | **PK** |
| `player_id` | int | NO | — | FK → players |
| `turn_number` | int | NO | — | |
| `type` | varchar | SÍ | `'General'` | Económico, Militar, Impuestos… |
| `content` | text | NO | — | Markdown |
| `is_read` | bool | SÍ | `false` | |
| `created_at` | timestamp | SÍ | `now()` | |

---

## players

Jugadores humanos y bots.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `player_id` | int | NO | serial | **PK** |
| `username` | varchar | NO | — | UNIQUE |
| `color` | varchar | NO | `'#cccccc'` | Color en el mapa |
| `gold` | int | SÍ | `100000` | Tesoro real |
| `created_at` | timestamp | SÍ | `now()` | |
| `role` | varchar | SÍ | `'player'` | player / admin |
| `password` | varchar | SÍ | — | Hash bcrypt |
| `capital_h3` | varchar | SÍ | — | Hexágono capital |
| `display_name` | varchar | NO | — | Nombre visible |
| `is_exiled` | bool | NO | `false` | |
| `is_ai` | bool | NO | `false` | |
| `ai_profile` | varchar | SÍ | — | Perfil de comportamiento IA |
| `deleted` | bool | NO | `false` | Soft delete |
| `tax_percentage` | numeric | SÍ | `10.00` | Tasa global (0-100) para feudos sin señorío |
| `tithe_active` | bool | SÍ | `false` | Diezmo activo |
| `is_initialized` | bool | NO | `false` | Inicialización completada |
| `first_name` | varchar | SÍ | `'Desconocido'` | |
| `last_name` | varchar | SÍ | `'Desconocido'` | |
| `gender` | char(1) | SÍ | `'M'` | M / F |
| `noble_rank_id` | int | SÍ | `1` | FK → noble_ranks |

---

## political_divisions

Señoríos y divisiones políticas de un jugador.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `id` | int | NO | serial | **PK** |
| `player_id` | int | NO | — | FK → players · UNIQUE(player_id, name) |
| `name` | varchar | NO | — | |
| `noble_rank_id` | int | NO | — | FK → noble_ranks |
| `capital_territory_id` | int | SÍ | — | |
| `created_at` | timestamp | SÍ | `now()` | |
| `capital_h3` | varchar | SÍ | — | Hexágono capital |
| `boundary_geojson` | jsonb | SÍ | — | Polígono pre-calculado para el mapa |
| `tax_rate` | numeric | SÍ | `10.00` | Tasa fiscal (1-15) |

---

## schema_migrations

Registro de scripts SQL aplicados.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `id` | int | NO | serial | **PK** |
| `script_name` | varchar | NO | — | UNIQUE |
| `applied_at` | timestamp | SÍ | `now()` | |

---

## settlements

Asentamientos históricos con nombre en el mapa.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `settlement_id` | int | NO | serial | **PK** |
| `h3_index` | text | NO | — | UNIQUE · FK → h3_map |
| `name` | text | NO | — | |
| `type` | text | SÍ | — | ciudad, villa, aldea… |
| `population_rank` | int | SÍ | — | |

---

## terrain_types

Tipos de terreno con sus propiedades económicas y militares.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `terrain_type_id` | int | NO | serial | **PK** |
| `name` | varchar | NO | — | Mar=1, Costa=2, Llanura=3, Río=4, Pantano=5, Bosque=6, Colinas=7, Montaña=8 |
| `color` | varchar | NO | — | Color hex para el mapa |
| `food_output` | int | SÍ | `0` | Producción base de comida por cosecha |
| `wood_output` | int | SÍ | `0` | (desactivado) |
| `stone_output` | int | SÍ | `0` | (desactivado) |
| `iron_output` | int | SÍ | `0` | (desactivado) |
| `fishing_output` | int | SÍ | `0` | (desactivado) |
| `defense_bonus` | int | SÍ | `0` | Bonus defensivo en combate |
| `movement_cost` | numeric | SÍ | `1.0` | Coste de movimiento |
| `is_colonizable` | bool | NO | `true` | Puede ser colonizado |

---

## territory_details

Estado económico y social de cada feudo colonizado.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `territory_id` | int | NO | serial | **PK** |
| `h3_index` | text | NO | — | UNIQUE · FK → h3_map |
| `custom_name` | varchar | SÍ | — | Nombre personalizado |
| `population` | int | SÍ | `200` | Habitantes |
| `happiness` | int | SÍ | `50` | Felicidad (0-100) |
| `happiness_delta` | int | NO | `0` | Variación en el último ciclo mensual |
| `food_stored` | numeric | SÍ | `0` | Reservas de comida |
| `wood_stored` | numeric | SÍ | `0` | (desactivado) |
| `stone_stored` | numeric | SÍ | `0` | (desactivado) |
| `iron_stored` | numeric | SÍ | `0` | (desactivado) |
| `gold_stored` | numeric | SÍ | `0.0` | Oro almacenado en el feudo |
| `farm_level` | int | SÍ | `0` | Nivel de granja |
| `mine_level` | int | SÍ | `0` | (desactivado) |
| `lumber_level` | int | SÍ | `0` | (desactivado) |
| `port_level` | int | SÍ | `0` | |
| `defense_level` | int | SÍ | `0` | |
| `exploration_end_turn` | int | SÍ | — | (desactivado) |
| `discovered_resource` | varchar | SÍ | — | (desactivado) |
| `grace_turns` | int | SÍ | `0` | Turnos de gracia tras colonización |
| `division_id` | int | SÍ | — | FK → political_divisions |
| `is_war_zone` | bool | NO | `false` | Batalla reciente → penalización de felicidad |

---

## troops

Tropas de un ejército, agrupadas por tipo.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `troop_id` | int | NO | serial | **PK** |
| `army_id` | int | SÍ | — | FK → armies |
| `unit_type_id` | int | SÍ | — | FK → unit_types |
| `quantity` | int | NO | `1` | |
| `experience` | numeric | SÍ | `0.00` | |
| `morale` | numeric | SÍ | `100.00` | |
| `last_fed_turn` | int | SÍ | — | |
| `stamina` | numeric | SÍ | `100.0` | |
| `force_rest` | bool | SÍ | `false` | |

---

## unit_combat_counters

Ventajas y desventajas entre tipos de unidad.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `id` | int | NO | serial | **PK** |
| `attacker_type_id` | int | SÍ | — | FK → unit_types |
| `defender_type_id` | int | SÍ | — | FK → unit_types |
| `damage_multiplier` | numeric | SÍ | `1.00` | >1 ventaja, <1 desventaja |

---

## unit_requirements

Recursos necesarios para reclutar una unidad.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `id` | int | NO | serial | **PK** |
| `unit_type_id` | int | SÍ | — | FK → unit_types |
| `resource_type` | varchar | SÍ | — | gold, food, iron… |
| `amount` | int | NO | — | |

---

## unit_terrain_modifiers

Modificadores de combate y movimiento por tipo de unidad y terreno.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `id` | int | NO | serial | **PK** |
| `unit_type_id` | int | SÍ | — | FK → unit_types |
| `terrain_type` | varchar | SÍ | — | Nombre del terreno |
| `attack_modificator` | numeric | SÍ | `1.00` | |
| `defense_modificator` | numeric | SÍ | `1.00` | |
| `speed_modificator` | int | SÍ | `0` | |
| `stamina_drain_modificator` | numeric | SÍ | `1.00` | |

---

## unit_types

Catálogo de tipos de unidad militar.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `unit_type_id` | int | NO | serial | **PK** |
| `name` | varchar | NO | — | |
| `attack` | int | SÍ | `10` | |
| `health_points` | int | SÍ | `100` | |
| `speed` | int | SÍ | `1` | Hexes por turno |
| `detection_range` | int | SÍ | `1` | |
| `gold_upkeep` | numeric | SÍ | `5.00` | Soldada por cosecha |
| `food_consumption` | numeric | SÍ | `2.00` | Comida por turno |
| `is_siege` | bool | SÍ | `false` | |
| `descrip` | text | SÍ | — | |

---

## workers

Trabajadores desplegados en el mapa (exploradores, constructores).

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `id` | int | NO | serial | **PK** |
| `player_id` | int | NO | — | FK → players |
| `h3_index` | varchar | NO | — | Posición actual |
| `type_id` | int | NO | — | FK → workers_types |
| `hp` | int | NO | — | |
| `speed` | int | NO | — | |
| `detection_range` | int | NO | — | |
| `created_at` | timestamp | SÍ | `now()` | |
| `destination_h3` | varchar | SÍ | — | Destino de movimiento |

---

## workers_types

Catálogo de tipos de trabajador.

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `id` | int | NO | serial | **PK** |
| `name` | varchar | NO | — | UNIQUE |
| `hp` | int | NO | `1` | |
| `speed` | int | NO | `1` | |
| `detection_range` | int | NO | `1` | |
| `cost` | int | NO | `0` | Coste en oro |

---

## world_state

Estado global del mundo. Fila única (id=1).

| Columna | Tipo | Nulo | Default | Notas |
|---------|------|------|---------|-------|
| `id` | int | NO | — | **PK** |
| `current_turn` | int | NO | `1` | Turno actual |
| `game_date` | date | NO | `1039-03-01` | Fecha del calendario de juego |
| `is_paused` | bool | SÍ | `true` | |
| `last_updated` | timestamp | SÍ | `now()` | |
| `days_per_year` | int | SÍ | `365` | |

---

## v_map_display

Vista calculada dinámicamente para el frontend del mapa.

| Columna | Tipo | Notas |
|---------|------|-------|
| `h3_index` | text | |
| `terrain_type_id` | int | |
| `terrain_name` | varchar | |
| `terrain_color` | varchar | |
| `has_road` | bool | |
| `is_capital` | bool | Calculado: `h3_index = players.capital_h3` |
| `player_id` | int | |
| `player_color` | varchar | |
| `owner_name` | varchar | |
| `location_name` | varchar | Nombre de asentamiento o feudo personalizado |
| `settlement_type` | text | |
| `population_rank` | int | |
| `coord_x` | int | |
| `coord_y` | int | |

---

## Relaciones clave

```
players ──< h3_map              (player_id)
players ──< armies              (player_id)
players ──< characters          (player_id)
players ──< political_divisions (player_id)
players ──< notifications       (player_id)
players ──< messages            (sender_id, receiver_id)
players >── noble_ranks         (noble_rank_id)

h3_map ──< territory_details   (h3_index)
h3_map ──< fief_buildings       (h3_index)
h3_map ──< settlements          (h3_index)

armies ──< troops               (army_id)
armies ──< characters           (army_id — comandante)

territory_details >── political_divisions (division_id)
political_divisions >── noble_ranks       (noble_rank_id)

buildings >── building_types    (type_id)
buildings >── buildings         (required_building_id — prerequisito)
fief_buildings >── buildings    (building_id)

unit_types ──< troops           (unit_type_id)
unit_types ──< unit_combat_counters
unit_types ──< unit_terrain_modifiers
unit_types ──< unit_requirements
```