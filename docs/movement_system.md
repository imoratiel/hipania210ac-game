# Sistema de Movimiento de Ejércitos

## 1. Velocidad y Casillas por Turno

Cada tipo de unidad tiene un atributo `speed` en `unit_types.speed`. Este valor indica el **número máximo de casillas** que puede avanzar en un único turno.

```
maxCells = min(speed) de todas las unidades del ejército
```

- El ejército avanza a la velocidad de su unidad **más lenta**.
- Si alguna unidad tiene `force_rest = TRUE` (stamina = 0), el ejército tiene **maxCells = 0** y no puede moverse ese turno.

---

## 2. Costes de Terreno

Cada hexágono tiene un coste de movimiento definido en `terrain_types.movement_cost`. Este valor se usa para calcular el consumo de stamina.

| Terreno            | movement_cost | Infranqueable |
|--------------------|--------------|---------------|
| Tierras de Cultivo | 1.0          |               |
| Tierras de Secano  | 1.0          |               |
| Estepas            | 1.0          |               |
| Costa              | 1.0          |               |
| Asentamiento       | 1.0          |               |
| Puente             | 1.0          |               |
| Río                | 1.5          |               |
| Colinas            | 2.0          |               |
| Bosque             | 2.0          |               |
| Oteros             | 2.0          |               |
| Espesuras          | 3.0          |               |
| Pantanos           | 3.0          |               |
| Alta Montaña       | 5.0          |               |
| Agua               | 5.0          |               |
| Mar                | —            | ✓             |

El coste mínimo aplicado es siempre 1, aunque el valor del terreno sea menor.

---

## 3. Elección de Ruta (Algoritmo A*)

La ruta se calcula mediante **A\*** usando la rejilla H3 como grafo.

### Funcionamiento

1. Se parte del hexágono actual del ejército hacia el destino.
2. Para cada hexágono evaluado se consulta su coste de terreno (con caché en memoria durante el cálculo).
3. La **heurística** es la distancia de rejilla H3: `h3.gridDistance(hex, destino)` — es admisible porque es el mínimo de saltos posibles.
4. La puntuación de cada nodo es `f = g + h`, donde:
   - `g` = coste acumulado desde el origen
   - `h` = distancia H3 al destino
5. Los hexágonos con `movement_cost < 0` (mar) son **ignorados** (infranqueables).
6. El algoritmo explora hasta un máximo de **15.000 nodos** para evitar bloqueos en mapas grandes.

La ruta calculada se almacena como un array JSON en `army_routes.path` y se reutiliza turno a turno hasta que el ejército llega o recibe nuevas órdenes.

---

## 4. Ejecución del Movimiento por Turno

Cada turno, el motor procesa cada ejército con destino asignado:

```
1. Si alguna tropa tiene force_rest = TRUE (stamina = 0) → bloqueado, no mueve
2. Calcular maxCells = min(speed) de las tropas
3. Cargar ruta desde army_routes.path
4. Repetir hasta (pasos = maxCells) o (sin ruta):
   a. Coger siguiente hexágono de la ruta
   b. Mover el ejército al hexágono
   c. Descontar stamina a todas las tropas (ver §5)
   d. Si alguna tropa llega a stamina = 0:
        - force_rest = TRUE en esa tropa
        - Detener el bucle
5. Si llegó al destino: limpiar destino y ruta
```

No existe "esfuerzo extra" ni contador `recovering`. El sistema es puramente stamina-driven.

---

## 5. Cansancio (Stamina)

Cada tropa (`troops`) tiene un valor individual de `stamina` en el rango **0–100**.

### Cálculo exacto del consumo por movimiento

Al entrar en un hexágono, la stamina se descuenta en dos pasos:

```
1. stamina_cost  = movement_cost_terreno × STAMINA_COST_PER_HEX
2. nueva_stamina = max(0, stamina_actual - stamina_cost)
```

- `movement_cost_terreno` viene de `terrain_types.movement_cost` (tabla §2).
- `STAMINA_COST_PER_HEX = 5` es el multiplicador definido en `constants.js`.
- El resultado nunca baja de 0.
- Si `nueva_stamina = 0`, la tropa entra en `force_rest = TRUE` automáticamente.

**Ejemplos con valores reales:**

| Terreno          | movement_cost | × 5 | Stamina consumida |
|------------------|--------------|-----|-------------------|
| Tierras/Costa/Puente | 1.0      | ×5  | **5**             |
| Río              | 1.5          | ×5  | **7.5**           |
| Colinas/Bosque/Oteros | 2.0     | ×5  | **10**            |
| Espesuras/Pantanos | 3.0        | ×5  | **15**            |
| Alta Montaña/Agua | 5.0         | ×5  | **25**            |

**Casillas máximas antes de agotarse** (stamina 100, sin recuperación):

| Terreno          | Coste/casilla | Casillas hasta stamina=0 |
|------------------|--------------|--------------------------|
| Tierras/Estepa   | 5            | **20 casillas**          |
| Río              | 7.5          | **13 casillas**          |
| Colinas/Bosque   | 10           | **10 casillas**          |
| Espesuras/Pantanos | 15         | **6 casillas**           |
| Alta Montaña     | 25           | **4 casillas**           |

**Balance neto por turno** (stamina ini=100, maxCells=3, recuperación +4 si no mueve):

| Terreno          | Gasto/turno | Recuperación | **Net** | Turnos hasta agotarse |
|------------------|------------|-------------|---------|----------------------|
| Tierras/Estepa   | −15        | +4          | **−11** | ~9 turnos            |
| Río              | −22.5      | +4          | **−18.5** | ~5 turnos          |
| Colinas/Bosque   | −30        | +4          | **−26** | ~4 turnos            |
| Espesuras/Pantanos | −45      | +4          | **−41** | ~2-3 turnos          |
| Alta Montaña     | −75 (3 pasos) | +4       | **−71** | ~1-2 turnos          |

### Recuperación pasiva

Cada turno, **si el ejército no se movió**, las tropas recuperan stamina:

```
nueva_stamina = min(100, stamina_actual + STAMINA_RECOVERY_PER_TURN)
```

Si una tropa tenía `force_rest = TRUE` y su stamina alcanza **≥ 25**, se libera automáticamente (`force_rest = FALSE`).

### Constantes

| Parámetro                        | Valor | Ubicación |
|----------------------------------|-------|-----------|
| Stamina máxima                   | 100   | `constants.js` |
| `STAMINA_COST_PER_HEX`           | 5     | `constants.js` |
| `STAMINA_RECOVERY_PER_TURN`      | +4    | `constants.js` |
| Umbral para liberar `force_rest` | 25    | `constants.js` |

---

## 6. Orden de Procesamiento en el Motor de Turnos

```
1. processArmyMovements()   — mueve todos los ejércitos con destino
2. processWorkerMovements() — mueve trabajadores
3. processArmyRecovery()    — recupera stamina (solo ejércitos que NO se movieron)
```

El movimiento ocurre **antes** de la recuperación para que el cansancio generado en el turno actual se recupere en el mismo turno (ciclo natural). Los ejércitos que se movieron no recuperan stamina ese turno.

---

## 7. Tablas de Base de Datos Relevantes

| Tabla          | Columnas clave                                              |
|----------------|-------------------------------------------------------------|
| `armies`       | `h3_index`, `destination`                                  |
| `army_routes`  | `army_id`, `path` (JSONB array de hexágonos)               |
| `troops`       | `army_id`, `stamina`, `force_rest`, `unit_type_id`         |
| `unit_types`   | `speed` (casillas máximas por turno del tipo de unidad)    |
| `terrain_types`| `movement_cost`                                            |
| `h3_map`       | `h3_index`, `terrain_type_id`                              |
