# Economía de Oro

El oro sigue un flujo en dos niveles:

- **`territory_details.gold_stored`** — almacén del feudo. Aquí se produce y de aquí se cobran impuestos.
- **`players.gold`** — tesoro real del jugador. Aquí llega el oro neto tras la cosecha y los impuestos.

---

## 1. Producción de oro — Cosecha (2 veces al año)

Se ejecuta los **días 75 y 180** del calendario de juego (primavera y otoño).

### Fórmula por feudo

```
gold_producido = floor(población × 0.1 × GOLD_PRODUCTION_MULTIPLIER)
```

> `GOLD_PRODUCTION_MULTIPLIER` está definido en `constants.js` (actualmente `100` por balance de pruebas; valor normal `1`).

El oro producido se acumula en `territory_details.gold_stored` del feudo.

### Soldadas (consumo de tropas en cosecha)

En el mismo ciclo de cosecha se descuentan las soldadas de **todas las tropas del jugador**:

```
gold_consumido = SUM(cantidad_unidad × gold_upkeep)
```

| Unidad            | gold_upkeep / cosecha |
|-------------------|-----------------------|
| Milicia           | 0.50                  |
| Soldados          | 1.50                  |
| Lanceros          | 1.50                  |
| Arqueros          | 2.00                  |
| Ballesteros       | 3.00                  |
| Caballería Ligera | 4.00                  |
| Caballería Pesada | 6.00                  |
| Explorador        | 1.50                  |
| Ariete            | 8.00                  |
| Catapulta         | 22.00                 |

### Balance neto de cosecha

```
net_gold = gold_producido_total - gold_consumido_total
players.gold = GREATEST(0, players.gold + net_gold)
```

El oro nunca baja de 0 en el tesoro del jugador.

---

## 2. Impuestos — día 10 de cada mes

El cobrador de impuestos (`tax_collector.js`) se ejecuta el **día 10 de cada mes** con doble guardia de idempotencia (comprueba la fecha y un registro en `game_config`) para evitar doble ejecución si el servidor se reinicia.

### Tasa efectiva

Cada feudo usa su propia tasa según pertenezca o no a un señorío:

```
tasa_efectiva = señorío.tax_rate          (si el feudo pertenece a un señorío)
              = players.tax_percentage    (si es feudo independiente)
```

Ambas tasas están en escala 1–15 %.

### Cálculo

```
tax_amount = floor(gold_stored × tasa_efectiva / 100)
```

- Se descuenta de `territory_details.gold_stored` del feudo.
- Se ingresa íntegro en `players.gold` (tesoro real).
- Si `gold_stored = 0`, ese feudo no tributa.

---

## 3. Diezmo — día 10 de cada mes (opcional)

Si el jugador tiene activado `players.tithe_active`, el **10 % de la comida almacenada** en cada feudo secundario (no capital) se transfiere a la capital correspondiente.

```
diezmo_feudo = floor(food_stored × 0.10)
```

- Se descuenta de `territory_details.food_stored` del feudo de origen.
- Destino según el tipo de feudo:
  - Feudo de un **señorío** → `political_divisions.capital_h3` del señorío
  - Feudo **libre** (sin señorío) → `players.capital_h3` del jugador
- Se ejecuta el mismo día 10, después del cobro de impuestos.
- Solo afecta a comida; el oro y materiales no se diezman.

---

## Resumen del flujo mensual

```
Día 1   → Solidaridad comida · Consumo civil · Cálculo felicidad · Producción mensual
Día 10  → Cobro de impuestos (gold_stored → players.gold)
Día 10  → Diezmo (food_stored feudo → capital señorío o capital jugador) [si tithe_active]
Día 75  → Cosecha de primavera (producción + soldadas → players.gold)
Día 180 → Cosecha de otoño   (producción + soldadas → players.gold)
```

---

## Ficheros relevantes

| Fichero | Responsabilidad |
|---------|----------------|
| `server/src/logic/turn_engine.js` → `processHarvest` | Producción de oro y pago de soldadas |
| `server/src/logic/tax_collector.js` | Cobro de impuestos de feudos al tesoro |
| `server/src/logic/tithe_system.js` | Diezmo de feudos secundarios a la capital |
| `server/src/config/constants.js` | `GOLD_PRODUCTION_MULTIPLIER` y parámetros de balance |
| `sql/007_troops.sql` | Valores de `gold_upkeep` por tipo de unidad |
