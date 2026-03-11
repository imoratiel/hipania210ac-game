# Algoritmo de Cosecha (`processHarvest`)

**Archivo:** `server/src/logic/turn_engine.js`

---

## Calendario de ejecución

Cada turno equivale a **1 día** de juego (`game_date + INTERVAL '1 day'`). Los procesos económicos se ejecutan en distintas frecuencias:

| Proceso | Frecuencia | Condición |
|---|---|---|
| Consumo civil de comida (territorio) | **Mensual** | `dayOfMonth === 1` |
| Consumo militar (provisiones → feudo) | **Cada turno** (diario) | siempre |
| Producción pesquera | **Mensual** | `dayOfMonth === 1` |
| **Cosecha agrícola + oro** | **2 veces/año** | `dayOfYear === 75` ó `dayOfYear === 180` |
| Cobro de impuesto fiscal | Mensual | `dayOfMonth === 10` |

`dayOfYear = turno_actual % days_per_year`

Las cosechas representan la siega de **primavera** (día 75) y **otoño** (día 180).

---

## A. Consumo civil — día 1 de cada mes (`processCivilFoodConsumption`)

Todos los feudos con dueño descuentan comida una vez al mes, equivalente a 30 días de consumo:

```
food_stored -= floor(population / 100) × 0.1 × 30
           = floor(population / 100) × 3
```

El valor no baja de 0 (`GREATEST(0, ...)`). Se ejecuta el mismo día que `processMonthlyProduction`.

---

## B. Consumo militar — cada turno (`processMilitaryConsumption`)

Cada ejército calcula su consumo diario de comida:

```
consumo = floor( SUM(quantity × food_consumption) )
```

El consumo se cubre en este orden:
1. **Provisiones del ejército** (`armies.food_provisions`) — se descuenta primero.
2. **Feudo donde está acampado** (`territory_details.food_stored`) — solo si las provisiones se agotan y el feudo es del mismo jugador.

Valores de `food_consumption` por unidad:

| Unidad             | food_consumption/turno |
|--------------------|------------------------|
| Milicia            | 0.1                    |
| Soldados           | 0.1                    |
| Lanceros           | 0.1                    |
| Arqueros           | 0.1                    |
| Ballesteros        | 0.1                    |
| Caballería Ligera  | 0.2                    |
| Caballería Pesada  | 0.3                    |
| Explorador         | 0.1                    |
| Ariete             | 0.1                    |
| Catapulta          | 0.1                    |

---

## C. Producción pesquera — día 1 de cada mes (`processMonthlyProduction`)

Los feudos con `fishing_output > 0` (terrenos costeros y fluviales) producen comida mensualmente:

```
fishingProduction = floor(fishing_output)   // sin multiplicadores actualmente
food_stored += fishingProduction
```

Valores de `fishing_output` por terreno:

| Terreno | fishing_output |
|---|---|
| Mar | 100 |
| Costa | 85 |
| Agua | 70 |
| Río | 50 |
| Pantanos | 40 |
| Tierras de Cultivo | 0 |
| (resto) | 0 |

---

## D. Cosecha agrícola + oro — días 75 y 180 del año (`processHarvest`)

Este es el proceso principal de producción. Se ejecuta **2 veces al año** para todos los jugadores activos.

### D.1 Producción de comida por feudo

**Base del terreno** (`terrain_types.food_output`):

| Terreno              | food_output |
|----------------------|-------------|
| Tierras de Cultivo   | 100         |
| Río                  | 90          |
| Tierras de Secano    | 55          |
| Pantanos             | 30          |
| Estepas              | 35          |
| Costa                | 10          |
| Bosque               | 20          |
| Espesuras            | 10          |
| Oteros               | 15          |
| Colinas              | 10          |
| Alta Montaña / Mar   | 0           |

**Multiplicador de Granja** (`territory_details.farm_level`):

```
farmMultiplier = 1 + (farm_level × 0.10)
```

Ejemplo: Granja nivel 2 → ×1.20

**Multiplicador global de balance** (`constants.js → HARVEST.FOOD_PRODUCTION_MULTIPLIER`):

```
foodProduction = floor(food_output × farmMultiplier × FOOD_PRODUCTION_MULTIPLIER)
```

- Valor actual: **2.5** *(fase de pruebas — valor canónico: 1)*

**Ejemplo completo** — Tierras de Cultivo con Granja nivel 1:
```
floor(100 × 1.10 × 2.5) = 275 comida por cosecha
```

### D.2 Cosecha Milagrosa (emergencia alimentaria)

Si tras añadir la producción normal el feudo sigue sin poder alimentar a su población el día siguiente, se activa un multiplicador de emergencia:

**Condición:**
```
nextDayConsumption = floor(population / 100) × 0.1
foodAfterHarvest   = food_stored + foodProduction

Si foodAfterHarvest < nextDayConsumption → se activa
```

**Cálculo:**
```
miracleMultiplier ∈ [2.0, 4.0)   (aleatorio uniforme)
foodProduction = floor(foodProduction × miracleMultiplier)
```

El evento aparece en el log y en la notificación de cosecha del jugador.

### D.3 Producción de oro por feudo

Independiente del terreno, proporcional a la población:

```
goldProduction = floor(population × 0.1 × GOLD_PRODUCTION_MULTIPLIER)
```

- `GOLD_PRODUCTION_MULTIPLIER` = **100** *(fase de pruebas — valor canónico: 1)*

Ejemplo: 500 habitantes → 5.000 oro por cosecha.

### D.4 Consumo de tropas en cosecha

En `processHarvest` también se descuenta el consumo global de tropas del jugador (suma de todos sus ejércitos):

```
totalFoodConsumption = floor( SUM(quantity × food_consumption) )
totalGoldConsumption = floor( SUM(quantity × gold_upkeep) )
```

Valores de `gold_upkeep` por unidad:

| Unidad             | gold_upkeep/turno |
|--------------------|-------------------|
| Milicia            | 0.50              |
| Soldados           | 1.50              |
| Lanceros           | 1.50              |
| Arqueros           | 2.00              |
| Ballesteros        | 3.00              |
| Caballería Ligera  | 4.00              |
| Caballería Pesada  | 6.00              |
| Explorador         | 1.50              |
| Ariete             | 8.00              |
| Catapulta          | 22.00             |

### D.5 Balance neto y escritura en BD

```
netFood = totalFoodProduced - totalFoodConsumption
netGold = totalGoldProduced - totalGoldConsumption
```

- **Comida:** se escribe feudo a feudo durante el cálculo (`food_stored += foodProduction`).
- **Oro:** se aplica al finalizar sobre el jugador (`gold = GREATEST(0, gold + netGold)`). Nunca baja de 0.

### D.6 Notificación al jugador

```
🌾 Producción Total:
• Comida: +X
• Oro: +X

⚔️ Consumo de Tropas:
• Comida: -X
• Oro: -X

💰 Balance Neto:
• Comida: ±X
• Oro: ±X

[✨ Cosecha Milagrosa si aplica]
```

Si hay consumo de oro, se envía también una notificación de tipo `Militar` con el pago de soldadas.

---

## Constantes de balance actuales

Ubicación: `server/src/config/constants.js → HARVEST`

| Constante                    | Valor actual | Valor canónico |
|------------------------------|-------------|----------------|
| `FOOD_PRODUCTION_MULTIPLIER` | 2.5         | 1              |
| `GOLD_PRODUCTION_MULTIPLIER` | 100         | 1              |
| `EMERGENCY_HARVEST_MIN`      | 2.0         | —              |
| `EMERGENCY_HARVEST_MAX`      | 4.0         | —              |

> Los multiplicadores están elevados intencionalmente durante la fase de pruebas.
