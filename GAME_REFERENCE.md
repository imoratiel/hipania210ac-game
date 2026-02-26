# Referencia de Juego — Mediev H3

> Documento de referencia para el motor de chat de IA. Contiene todas las mecánicas, reglas y valores numéricos del juego.

---

## 1. Concepto General

Mediev H3 es un juego de estrategia por turnos ambientado en la Edad Media. Los jugadores controlan un reino medieval compuesto por hexágonos (tecnología H3), reclutan tropas, construyen edificios, exploran territorios y conquistan nuevas tierras.

- El mundo es un mapa hexagonal continuo de resolución H3 nivel 8.
- El tiempo avanza por **turnos** que se ejecutan automáticamente.
- Un año de juego tiene 180 turnos (días).

---

## 2. Territorios y Mapa

### Tipos de Terreno

| Terreno | Comida | Madera | Piedra | Hierro | Pesca | Coste movimiento |
|---|---|---|---|---|---|---|
| Mar | 0 | 0 | 0 | 0 | 0 | Infranqueable |
| Costa | 10 | 5 | 5 | 0 | 85 | 1.0 |
| Río | 90 | 10 | 0 | 0 | 50 | 1.5 |
| Tierras de Cultivo | 100 | 5 | 0 | 0 | 0 | 1.0 |
| Tierras de Secano | 55 | 15 | 10 | 5 | 0 | 1.0 |
| Estepas | 35 | 5 | 5 | 5 | 0 | 1.0 |
| Pantanos | 30 | 15 | 0 | 10 | 40 | 3.0 |
| Bosque | 20 | 100 | 10 | 0 | 0 | 2.0 |
| Espesuras | 10 | 120 | 20 | 0 | 0 | 3.0 |
| Colinas | 10 | 20 | 60 | 60 | 0 | 2.0 |
| Oteros | 15 | 10 | 80 | 40 | 0 | 2.0 |
| Alta Montaña | 0 | 5 | 100 | 100 | 0 | 5.0 |
| Asentamiento | 0 | 0 | 0 | 0 | 0 | 1.0 |
| Agua interior | 0 | 0 | 0 | 0 | 70 | 5.0 |

El Mar es completamente infranqueable para ejércitos terrestres.

### Colonización

- **Primer feudo**: No requiere adyacencia. Se convierte automáticamente en la Capital. No tiene período de gracia.
- **Feudos posteriores**: Se obtienen por conquista. Requieren adyacencia a territorio propio existente.
- Coste de fundar capital: **100 oro**.
- Al fundar capital, se reclaman automáticamente los hexágonos adyacentes libres como feudos adicionales.

---

## 3. Población y Recursos

### Límites de Población por Terreno

| Tipo de feudo | Capacidad máxima |
|---|---|
| Capital del jugador | 6.000 habitantes |
| Llanura / Costa | 2.000 habitantes |
| Resto de terrenos | 1.000 habitantes |

Terrenos considerados llanura/costa: tierras de cultivo, tierras de secano, estepas, costa, llanura, pradera, planicie, prado.

### Crecimiento de Población

- Se calcula en el **censo** cada 30 turnos.
- Con comida suficiente: `población = MIN(capacidad, FLOOR(población × 1.01))` → +1% cada censo.
- Sin comida (`food_stored ≤ 0`): `población = MAX(200, FLOOR(población × 0.95))` → −5% por hambruna.
- La población **nunca baja de 200** habitantes (mínimo garantizado).

### Consumo de Comida

- Los habitantes consumen comida de las reservas del feudo cada turno.
- Fórmula: `FLOOR(población / 100) × 0.1` raciones por turno.

### Recursos Almacenados

Cada feudo tiene almacén propio de: Comida 🌾, Madera 🌲, Piedra ⛰️, Hierro ⛏️, Oro 🪙.

---

## 4. Sistema Económico

### Producción Mensual (Día 1 de cada mes, cada 30 turnos)

Produce madera, piedra, hierro y pesca (comida constante):
- Madera: `wood_output × (1 + nivel_leñador × 0.20)`
- Piedra: `stone_output × (1 + nivel_mina × 0.20)`
- Hierro: `iron_output × (1 + nivel_mina × 0.20)`
- Pesca (comida): `fishing_output` (sin multiplicador, siempre constante)

### Cosecha Estacional (Turnos 75 y 180 de cada año)

Ocurre dos veces al año:
- Comida agrícola: `food_output × (1 + nivel_granja × 0.20)`
- Oro: `FLOOR(población × 0.1)` por feudo

Si la comida almacenada cae por debajo del consumo previsto del siguiente turno, se activa la **Cosecha Milagrosa**: multiplicador aleatorio entre 2.0× y 4.0× sobre la producción agrícola.

### Consumo Militar (Cada turno)

Las tropas consumen raciones por turno:
1. Primero consumen de las **provisiones del ejército** (`armies.food_provisions`).
2. Si se agotan, consumen del **almacén de comida del feudo** donde están estacionadas (solo si es feudo propio).
3. Si ambas fuentes se agotan → alerta de **Hambruna Militar**.

---

## 5. Edificios de Feudo

Cada feudo puede tener un único edificio a la vez.

### Catálogo de Edificios

| Edificio | Tipo | Coste (oro) | Turnos construcción | Requisito previo | Bono |
|---|---|---|---|---|---|
| Cuartel | Militar | 5.000 | 15 | Ninguno | Permite reclutar |
| Iglesia | Religioso | 3.000 | 20 | Ninguno | +5% comida |
| Mercado | Económico | 4.000 | 20 | Ninguno | +10% comida |
| Fortaleza | Militar | 15.000 | 60 | Cuartel | Permite reclutar |

### Reglas de Construcción

- Solo un edificio por feudo. No se puede construir si ya hay uno (completado o en construcción).
- La **Fortaleza** requiere que el feudo ya tenga un **Cuartel** completado.
- Edificios base (Cuartel, Iglesia, Mercado) no requieren prerequisito.
- Un edificio en construcción se completa automáticamente al llegar el turno final; se envía notificación al jugador.

### Ampliación de Edificios

- Cuando el feudo tiene un edificio completado que tiene mejora disponible (ej. Cuartel → Fortaleza), aparece el botón **"Ampliar edificio"**.
- La ampliación reemplaza el edificio actual con la versión mejorada. El edificio anterior deja de existir.

### Mejoras de Infraestructura (Sistema legacy)

Además de los edificios de feudo, existen mejoras de nivel en territorio:
- **Granja**: requiere terreno con producción de comida > 0.
- **Leñador**: requiere terreno con producción de madera > 0.
- **Mina**: requiere recurso descubierto (hay que explorar primero).
- **Puerto**: solo en terreno costero.

Coste de mejora (escala exponencial): `100 × 2^nivel_actual` oro.
Puerto: `10.000 × 2^nivel_actual` oro.

Cada nivel añade **+20%** de producción del recurso correspondiente.

---

## 6. Exploración y Recursos Mineros

- Coste: **100 oro**.
- Duración: **5 turnos**.
- Solo los terrenos de **Montaña** (Alta Montaña, Colinas, Oteros) pueden contener recursos mineros.
- En cualquier otro terreno, el resultado es siempre "Sin recursos".

### Probabilidad de Descubrimiento (solo Montaña/Colinas)

| Resultado | Probabilidad |
|---|---|
| Oro | 2% |
| Hierro | 3% |
| Piedra | 20% |
| Sin recursos | 75% |

Hasta que un feudo sea explorado, sus recursos mineros son desconocidos. La mina no puede construirse sin explorar primero.

---

## 7. Reclutamiento de Tropas

### Dónde se Puede Reclutar

Solo se puede reclutar en:
1. La **Capital** del jugador.
2. Un feudo con **edificio militar completado** (Cuartel o Fortaleza).

No se puede reclutar en feudos ordinarios sin edificio militar.

### Pool de Población (Red de Suministro)

La población disponible para reclutar en un feudo no se limita al feudo en sí:
- Se calcula la **red conectada**: todos los feudos contiguos del mismo jugador dentro de un radio máximo de **10 hexágonos** (BFS).
- Los feudos más allá de esa distancia no contribuyen al pool, aunque sean contiguos.
- Por cada feudo en la red: `población reclutable = MAX(0, población_actual - 200)`.
- El total reclutable = suma de toda la red.
- La deducción se aplica empezando por el feudo de reclutamiento y luego los vecinos más cercanos (orden BFS).

### Catálogo de Unidades

| Unidad | Ataque | HP | Velocidad | Detección | Mantenimiento oro | Consumo comida | Coste reclutamiento |
|---|---|---|---|---|---|---|---|
| Milicia | 5 | 30 | 2 | 1 | 0,50 | 0,1 | 25 oro |
| Soldados | 12 | 80 | 2 | 2 | 1,50 | 0,1 | 100 oro + 3 hierro |
| Lanceros | 10 | 90 | 2 | 2 | 1,50 | 0,1 | 80 oro + 1 madera + 1 hierro |
| Arqueros | 13 | 50 | 2 | 3 | 2,00 | 0,1 | 120 oro + 2 madera |
| Ballesteros | 16 | 55 | 2 | 2 | 3,00 | 0,1 | 150 oro + 2 madera + 1 hierro |
| Caballería Ligera | 14 | 75 | 4 | 4 | 4,00 | 0,2 | 250 oro + 1 hierro |
| Caballería Pesada | 22 | 130 | 3 | 2 | 6,00 | 0,3 | 500 oro + 2 hierro |
| Explorador | 1 | 40 | 5 | 6 | 1,50 | 0,1 | 100 oro |
| Ariete | 5 | 200 | 1 | 1 | 8,00 | 0,1 | 200 oro + 10 madera |
| Catapulta | 35 | 210 | 1 | 1 | 22,00 | 0,1 | 600 oro + 10 madera + 50 hierro |

---

## 8. Ejércitos y Movimiento

### Límite de Ejércitos

- Fórmula: `2 + FLOOR(número_de_feudos / 10)`.
- Base garantizada: **2 ejércitos** siempre disponibles.
- Cada 10 feudos adicionales se desbloquea 1 ejército más.

### Puntos de Movimiento (PM)

- PM del ejército = **velocidad mínima** de todas las unidades que lo componen.
- Por turno el ejército puede avanzar hasta que agote sus PM o llegue al destino.
- **Coste de stamina**: 10 puntos por hexágono.
- **Máximo de hexágonos por turno**: 4 (independiente del PM).
- Si el ejército tiene alguna unidad con `force_rest = TRUE` → PM = 0, sin movimiento posible.

### Costes de Movimiento por Terreno

| Terreno | Coste de movimiento |
|---|---|
| Costa, Tierras cultivo, Estepas, Secano, Asentamiento | 1,0 |
| Río | 1,5 |
| Bosque, Colinas, Oteros | 2,0 |
| Pantanos | 3,0 |
| Alta Montaña, Agua interior | 5,0 |
| Mar | Infranqueable (−1) |

Si al final de un turno el ejército tiene PM insuficientes para cruzar el siguiente hex, pero tiene al menos 0,1 de stamina: entra en **Último Esfuerzo** — avanza pero su stamina queda a 0 y entra en `force_rest`.

### Stamina

- Stamina máxima: **100**.
- Coste por hexágono: **10**.
- Recuperación en reposo: **+4 por turno**.
- Estado `force_rest`: se activa cuando la stamina baja del **25%** durante el movimiento. Bloquea todo movimiento hasta recuperar.
- Estado `recovering`: se activa tras el Último Esfuerzo. Dura **1 turno**.

### Niebla de Guerra

- Cada feudo propio revela **2 hexágonos** a su alrededor.
- El rango de detección de cada ejército = `detection_range` máximo de sus unidades.
- El Explorador tiene detección 6 (máxima del juego), ideal para espionaje.

---

## 9. Combate y Conquista

### Conquista de Feudo (vs. Milicia)

Para conquistar un feudo debe haber un ejército propio en ese hexágono **sin ejércitos enemigos presentes**. Si hay enemigos, hay que derrotarlos primero.

**Poder de la milicia defensora:**
- `milicianos = FLOOR(población × 0.1) + (nivel_defensa × 10)`
- Poder defensor = `milicianos × 3 × varianza(0.85–1.15)`

**Resultado:**
- Victoria: ratio atacante/defensor ≥ 1,1
- Derrota: ratio ≤ 0,9
- Empate: ratio entre 0,9 y 1,1 (territorio cambia de manos igual)

**Bajas:**
- Atacante en victoria: 5–15% de bajas.
- Atacante en derrota: 20–35% de bajas.
- Milicia en victoria atacante: 70–100% de bajas.
- Milicia en derrota atacante: 30–50% de bajas.

**Experiencia:** Las unidades supervivientes ganan XP = `(milicianos muertos × 1 + propios muertos × 2) / supervivientes`.

### Combate P2P (Ejército vs. Ejército)

Cuando dos ejércitos de distintos jugadores se encuentran en el mismo hexágono, el jugador atacante puede iniciar combate.

### Período de Gracia

- Los feudos recién conquistados tienen **3 turnos de gracia**.
- Durante la gracia: no se puede reconquistar inmediatamente.
- El contador decrece 1 por turno automáticamente.
- Los feudos con gracia activa no pueden reforzarse con tropas.

### Derrumbe de Capital (Efecto Dominó)

Cuando se conquista la **Capital** de un jugador:
1. Se buscan todos los feudos del jugador dentro de **5 saltos BFS** de la capital caída.
2. Todos esos feudos pasan automáticamente al conquistador (sin combate adicional).
3. Cada feudo transferido recibe `grace_turns = 3`.
4. Si el jugador pierde todos sus feudos → entra en **Exilio**.

### Sucesión de Capital

Si el jugador conserva feudos tras perder la capital:
- El feudo con mayor población se convierte automáticamente en la nueva capital.

---

## 10. Estado de Exilio

Cuando un jugador pierde absolutamente todos sus feudos:
- Queda marcado como `is_exiled = TRUE`.
- Puede colonizar **cualquier hexágono libre** del mapa sin requisito de adyacencia (igual que la primera colonización).
- Al colonizar un nuevo feudo, el exilio se cancela y el jugador retoma su reino desde cero.

---

## 11. Sistema de Turnos

### Cada Turno (continuo)

1. Consumo de comida de los habitantes.
2. Decremento de períodos de gracia de feudos.
3. Avance de construcciones de edificios (−1 turno restante).
4. Movimiento automático de ejércitos con destino asignado.
5. Recuperación de stamina y estado `recovering` de ejércitos.
6. Consumo militar de comida (provisiones → almacén del feudo → alerta).
7. Procesado de exploraciones completadas.

### Cada 30 Turnos (censo mensual)

- Producción mensual de recursos (madera, piedra, hierro, pesca).
- Crecimiento o decrecimiento de población.

### Turnos 75 y 180 de cada año (cosecha)

- Producción agrícola estacional.
- Producción de oro por población.
- Posible Cosecha Milagrosa de emergencia.

---

## 12. Espionaje

- Requiere tener un **Explorador** en el mismo hexágono que el ejército enemigo.
- Coste: 100 raciones de las provisiones del ejército explorador.
- Si el ejército no tiene provisiones: coste alternativo de **1.000 oro** del jugador.
- Resultado: se revela la composición y estado del ejército enemigo.

---

## 13. Restricciones y Reglas Especiales

| Situación | Restricción |
|---|---|
| Feudo con `grace_turns > 0` | No se puede reforzar ni ser reconquistado |
| Ejército con `force_rest = TRUE` | Movimiento bloqueado hasta recuperar stamina |
| Ejército con `recovering > 0` | Movimiento bloqueado durante ese turno |
| Ejército con enemigos en el hex | No se puede conquistar el feudo hasta derrotarlos |
| Población = 200 | No se puede reclutar más ni decrece por hambruna |
| Feudo sin Cuartel/Fortaleza y no es capital | No se puede reclutar en ese feudo |
| Edificio en construcción | No cuenta como "completado" para reclutamiento ni para prerequisitos |
| Mina sin exploración previa | No se puede construir |
| Puerto en terreno no costero | No se puede construir |

---

## 14. Mensajería

Los jugadores pueden enviarse mensajes directos. Los mensajes del sistema (cosecha, construcción completada, territorio perdido, etc.) tienen remitente `NULL` y aparecen como notificaciones automáticas.

---

## 15. Glosario

| Término | Definición |
|---|---|
| Feudo | Hexágono controlado por un jugador |
| Capital | Feudo principal del jugador; tiene cap. de población 6.000 |
| Grace turns | Turnos de inmunidad tras conquista |
| Force rest | Estado de descanso forzado por agotamiento de stamina |
| Recovering | Estado post-esfuerzo que bloquea el siguiente turno |
| BFS | Búsqueda en amplitud; define conectividad de feudos |
| PM | Puntos de movimiento por turno |
| Stamina | Resistencia de una tropa; se recupera en reposo |
| Pool de reclutamiento | Suma de población reclutable de todos los feudos conectados |
| Red conectada | Conjunto de feudos adyacentes y contiguos del mismo jugador |
