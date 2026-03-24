# Motor de Felicidad de Feudos

## Cuándo se ejecuta

Una vez al mes, el **día 1 de cada mes de juego**, justo después de que se hayan descontado todos los consumos:

1. Solidaridad de comida entre feudos del señorío
2. Consumo civil de la población
3. Consumo militar de las tropas (corre cada turno)
4. **→ Cálculo de felicidad** ← aquí
5. Producción mensual

## Columna en base de datos

`territory_details.happiness` — entero entre 0 y 100, valor por defecto 50.

## Lógica de cálculo

La felicidad funciona por **inercia**: cada mes se calcula un delta (positivo o negativo) que se suma al valor actual del feudo. El resultado siempre se acota entre 0 y 100.

```
nueva_felicidad = CLAMP(felicidad_actual + delta, 0, 100)
```

El delta se compone de tres factores independientes:

---

### 1. Impuestos

Se usa la tasa efectiva del feudo (escala 1–15 %):
- Si el feudo pertenece a un señorío → `political_divisions.tax_rate`
- Si no tiene señorío → `players.tax_percentage` (normalizado a 1–15)

| Tasa efectiva | Delta |
|---------------|-------|
| 1 % – 5 %     | **+2** |
| 6 % – 10 %    | 0      |
| 11 % – 15 %   | **−2** |

---

### 2. Autonomía alimentaria

Se calcula **después** de aplicar todos los consumos del mes, por lo que refleja el stock real disponible.

```
autonomía = food_stored / consumo_mensual
consumo_mensual = floor(población / 100) × 3
```

| Condición              | Delta  |
|------------------------|--------|
| `food_stored = 0`      | **−15** (hambruna) |
| autonomía < 6 meses    | **−5**  |
| autonomía 6–24 meses   | 0       |
| autonomía > 24 meses   | **+2**  |

> Si la población es 0, no se aplica penalización de comida.

---

### 3. Seguridad

| Condición                        | Delta  |
|----------------------------------|--------|
| Guarnición presente en el feudo  | **+1** |
| Feudo marcado como zona de guerra (`is_war_zone = TRUE`) | **−10** |

La columna `is_war_zone` se activa externamente (p. ej. tras una batalla) y se desactiva manualmente o por el motor de turnos.

---

## Ejemplo

Feudo con felicidad actual 60, tasa impositiva 8 %, autonomía 4 meses, sin guarnición, sin zona de guerra:

```
delta = 0 (impuesto neutro)
      - 5 (autonomía < 6 meses)
      + 0 (sin guarnición)
      + 0 (sin zona de guerra)
      = -5

nueva_felicidad = CLAMP(60 - 5, 0, 100) = 55
```

## Ficheros relevantes

| Fichero | Responsabilidad |
|---------|----------------|
| `server/src/services/FiefService.js` | Función pura `calculateHappiness(fiefData, context)` |
| `server/src/logic/turn_engine.js` | `processHappiness()` — consulta DB y aplica el cálculo en batch |
| `sql/041_happiness_war_zone.sql` | Añade columna `is_war_zone` a `territory_details` |
