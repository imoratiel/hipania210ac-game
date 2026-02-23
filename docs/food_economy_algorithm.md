# Algoritmo de Economía Alimentaria — Mediev H3

> Archivo de referencia técnica. Fuente: `server/src/logic/turn_engine.js`
> Última revisión: 2026-02-23 (añadida: Cosecha de Emergencia)

---

## 1. Calendario de Juego

Cada turno avanza **1 día** en el calendario de juego.

| Evento | Condición de disparo |
|---|---|
| Consumo diario de comida | **Cada turno** |
| Consumo militar (tropas) | **Cada turno** |
| Censo poblacional | Cada **30 turnos** |
| Producción mensual (madera/piedra/hierro/pesca) | Día **1** de cada mes |
| Cosecha agrícola | Días **75** y **180** del año (× 2 veces/año) |
| Cosecha de Emergencia (milagrosa) | Durante cosecha, si el feudo está en situación crítica |
| Cobro de impuestos | Día **10** de cada mes |
| Diezmo (si activo) | Día **10** de cada mes |

---

## 2. Consumo Diario de Comida (Cada turno)

### Lógica

Todos los feudos **con propietario** consumen comida automáticamente de `territory_details.food_stored`.

```
consumo_por_feudo = FLOOR(population / 100.0) × 0.1
```

**Ejemplo:** Feudo con 500 habitantes → `FLOOR(500 / 100) × 0.1 = 0.5` comida/turno

### SQL ejecutado

```sql
UPDATE territory_details
SET food_stored = GREATEST(0, food_stored - (FLOOR(population / 100.0) * 0.1))
WHERE h3_index IN (SELECT h3_index FROM h3_map WHERE player_id IS NOT NULL)
```

> `GREATEST(0, ...)` impide que `food_stored` quede en negativo.

---

## 3. Consumo Militar (Cada turno)

Procesado en `processMilitaryConsumption()`. Cada ejército consume en **cascada de prioridad**:

### Fuentes de consumo (en orden)

1. **`armies.food_provisions`** — Las provisiones propias del ejército se consumen primero.
2. **`territory_details.food_stored`** del feudo donde está estacionado — Solo si el feudo **pertenece al mismo jugador** que el ejército.
3. **Hambruna** — Si ambas fuentes se agotan, queda un déficit registrado en el log.

### Fórmula

```
consumo_total_ejército = SUM(troops.quantity × unit_types.food_consumption)
```

### Flujo detallado

```
consumedFromArmy = MIN(army.food_provisions, consumo_total)
deficit = consumo_total - consumedFromArmy

SI deficit > 0 Y feudo del mismo jugador:
    consumedFromFief = MIN(territory.food_stored, deficit)
    deficit = deficit - consumedFromFief

SI deficit > 0:
    → HAMBRUNA registrada en engine.log (sin notificación al jugador actualmente)
```

### Seguridad

- Un ejército **no puede** consumir comida de un feudo enemigo aunque esté ocupándolo.
- Ambas actualizaciones usan `GREATEST(0, ...)` para evitar valores negativos en BD.

---

## 4. Censo Poblacional (Cada 30 turnos)

Condicional: `((newTurn - 1) % 30) === 0`

### Caso A — Feudo con comida (`food_stored > 0`)

Crecimiento del **1% por periodo**, limitado por el tope máximo de terreno:

```
nueva_población = MIN(pop_cap, FLOOR(población × 1.01))
```

**Topes de población** (`server/src/config/constants.js`):

| Tipo de feudo | Tope |
|---|---|
| Capital del jugador | 6.000 |
| Llanura / Costa | 2.000 |
| Resto (montaña, bosque, pantano…) | 1.000 |

### Caso B — Feudo sin comida (`food_stored ≤ 0`)

**Hambruna**: pierde el **5% de su población**, nunca por debajo de `MIN_FIEF_POPULATION = 200`.

```
nueva_población = MAX(200, FLOOR(población × 0.95))
```

Se genera notificación `FAMINE` si `deaths > 0`:
> *"🚨 HAMBRUNA en {h3_index} — Sin reservas de comida, la población ha descendido en N habitantes."*

---

## 5. Cosecha Agrícola (Días 75 y 180 del año)

Procesado en `processHarvest()`. Se dispara **2 veces al año**.

### Fórmulas de producción por feudo

| Recurso | Fórmula |
|---|---|
| Comida | `FLOOR(terrain.food_output × (1 + farm_level × 0.20) × 2)` |
| Madera | `FLOOR(terrain.wood_output × (1 + lumber_level × 0.20))` |
| Piedra | `FLOOR(terrain.stone_output × (1 + mine_level × 0.20))` |
| Hierro | `FLOOR(terrain.iron_output × (1 + mine_level × 0.20))` |
| Oro | `FLOOR(population × 0.1 × GOLD_BALANCE_MULTIPLIER)` |

> **⚠️ Balance test activo:** `GOLD_BALANCE_MULTIPLIER = 10` (línea 70 de `turn_engine.js`).
> Restaurar a `1` para comportamiento normal.
> **⚠️ Balance x2 activo en comida:** El factor `× 2` al final de la fórmula de comida es un multiplicador de prueba.

### Multiplicador de edificios

```
farm_multiplier   = 1 + (farm_level   × 0.20)
lumber_multiplier = 1 + (lumber_level × 0.20)
mine_multiplier   = 1 + (mine_level   × 0.20)
```

> Cada nivel de edificio añade **+20%** de producción base.

### Consumo de tropas en cosecha

Durante la cosecha también se calcula el consumo global de tropas del jugador:

```
consumo_comida_tropas = SUM(troops.quantity × unit_types.food_consumption)   [todos los ejércitos]
consumo_oro_tropas    = SUM(troops.quantity × unit_types.gold_upkeep)
```

Y se calcula el **balance neto** para la notificación:

```
net_food = total_food_producida - consumo_comida_tropas
net_gold = total_gold_producida - consumo_oro_tropas
```

> **Importante:** Este cálculo de consumo en cosecha es **informativo** (para la notificación). El consumo real turno a turno lo gestiona `processMilitaryConsumption()`.

### Destino de los recursos

| Recurso | Destino |
|---|---|
| Comida, Madera, Piedra, Hierro | `territory_details` del feudo que lo produce |
| Oro (neto) | `players.gold` (tesoro global del jugador) |

---

## 5b. Cosecha de Emergencia (Milagrosa)

Procesado **dentro de `processHarvest()`**, para cada feudo de forma individual y **antes** de aplicar la producción al stock.

### Condición de activación

El feudo se considera en situación crítica si, tras sumar la producción normal de esta cosecha, sigue sin poder cubrir **el consumo de un solo turno**:

```
nextTurnConsumption = FLOOR(population / 100.0) × 0.1
foodAfterHarvest    = food_stored + normalFoodProduction

Activar si: nextTurnConsumption > 0  AND  foodAfterHarvest < nextTurnConsumption
```

**Ejemplo:** Feudo con 500 hab., `food_stored = 0`, producción normal = 0.3:
- `nextTurnConsumption = 0.5`
- `foodAfterHarvest = 0 + 0.3 = 0.3 < 0.5` → **¡Cosecha Milagrosa activada!**

### Multiplicador aleatorio

```javascript
miracleMultiplier = 2.0 + Math.random() * 2.0  // rango: [2.0, 4.0)
foodProduction    = FLOOR(normalFoodProduction × miracleMultiplier)
```

El multiplicador es **independiente por feudo** y **por cosecha**: dos feudos en crisis el mismo turno reciben multiplicadores distintos.

### Restricciones de balance

- Solo afecta a la **comida** — madera, piedra, hierro y oro **no se ven alterados**.
- Solo se activa si el feudo tiene `population ≥ 100` (por debajo, `nextTurnConsumption = 0` y la condición nunca se cumple).
- Solo ocurre en los días de cosecha (75 y 180); **no** en la producción mensual ni en turnos normales.

### Feedback

**Log de motor** (`engine.log`):
```
[TURN 75] ✨ COSECHA MILAGROSA en 88283082bfffffff (player 3): ×3.14, +8 comida extra
```

**Notificación al jugador** (sección añadida al resumen de cosecha):
```
✨ ¡Cosecha Milagrosa!
Los campesinos han redoblado esfuerzos ante la hambruna y la producción ha aumentado:
• 88283082bfffffff: ×3.14 (+8 comida extra)
```

---

## 6. Producción Mensual (Día 1 de cada mes)

Procesado en `processMonthlyProduction()`. Solo recursos industriales y pesca. **No incluye comida agrícola.**

| Recurso | Fórmula |
|---|---|
| Madera | `FLOOR(terrain.wood_output × (1 + lumber_level × 0.20))` |
| Piedra | `FLOOR(terrain.stone_output × (1 + mine_level × 0.20))` |
| Hierro | `FLOOR(terrain.iron_output × (1 + mine_level × 0.20))` |
| Comida (Pesca) | `FLOOR(terrain.fishing_output)` — sin multiplicador de edificio |

> La pesca es un suministro **constante** mensual de comida, independiente de las cosechas estacionales.

---

## 7. Flujo Completo por Turno (Orden de ejecución)

```
TURNO N
│
├─ 1. Avanzar fecha (+ 1 día calendario)
│
├─ 2. Consumo diario de comida [SIEMPRE]
│      food_stored -= FLOOR(pop / 100) × 0.1  (por feudo)
│
├─ 3. Censo poblacional [cada 30 turnos]
│      ┌─ Con comida:  pop = MIN(cap, FLOOR(pop × 1.01))
│      └─ Sin comida:  pop = MAX(200, FLOOR(pop × 0.95))  → notif FAMINE
│
├─ 4. Exploraciones completadas [SIEMPRE]
│
├─ 5. Movimiento de ejércitos [SIEMPRE]
│
├─ 6. Recuperación de stamina [SIEMPRE]
│
├─ 7. Consumo militar de comida [SIEMPRE]
│      1º armies.food_provisions → 2º territory.food_stored → 3º Hambruna
│
├─ 8. Producción mensual [solo día 1 del mes]
│      Madera + Piedra + Hierro + Pesca → territory_details
│
├─ 9. Cosecha agrícola [solo días 75 y 180 del año]
│      ┌─ Por feudo: Comida×2 + Materiales + Oro×10
│      ├─ ¿Crítico? (food_stored + prod < consumo_1_turno)
│      │     └─ Comida × random[2.0, 4.0) — solo ese feudo, solo la comida
│      └─ Notificación HARVEST (+ sección "Cosecha Milagrosa" si aplica)
│
├─ 10. Cobro de impuestos [solo día 10 del mes]
│       gold_stored × tax_rate% → players.gold
│
└─ 11. Diezmo [solo día 10 del mes, si activo]
        10% de recursos de feudos secundarios → capital
```

---

## 8. Resumen de Multiplicadores Activos (Estado Actual)

| Multiplicador | Valor actual | Valor normal | Archivo / Línea |
|---|---|---|---|
| Comida en cosecha (base) | `× 2` | `× 1` | `turn_engine.js:63` |
| Cosecha de emergencia | `× random[2.0, 4.0)` | N/A (condicional) | `turn_engine.js` — sección EMERGENCY HARVEST |
| Oro en cosecha | `× 10` | `× 1` | `turn_engine.js:70-71` |
| Tasa de impuestos | `taxRate × 1` | `taxRate × 1` | `tax_collector.js:43` |

---

## 9. Identificación de Problemas Potenciales de Balance

### Escenario de hambruna rápida
Un feudo con 500 hab. consume `0.5` comida/turno. Si la cosecha produce `500 × 1 × farm_mult × 2`, se necesita tener reservas suficientes entre las dos cosechas anuales (≈ 90 turnos de separación entre días 75 y 180).

### Ciclo alimentario esperado (sin tropas)
```
Días entre cosechas: ~90 turnos
Consumo acumulado entre cosechas (500 hab): 90 × 0.5 = 45 unidades de comida
Producción por cosecha (terrain.food_output = 10, farm_level 0): 10 × 1.0 × 2 = 20
→ DÉFICIT: el feudo requiere food_output ≥ 3 para autosostenerse a 500 hab. sin granja
```

### Nota sobre el consumo militar y la cosecha
El cálculo de consumo en `processHarvest()` es **solo para la notificación**, no descuenta comida de los feudos. El descuento real ocurre turno a turno en `processMilitaryConsumption()`.
