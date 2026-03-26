# Hispania 210 AC

Juego de estrategia multijugador por turnos ambientado en la **Península Ibérica del siglo III a.C.**, cuando Romanos, Cartagineses, Íberos y Celtas luchaban por el control del territorio.

El mapa se genera a partir de datos reales de la Península Ibérica usando la cuadrícula hexagonal **H3 (resolución 7)** y datos ESA WorldCover.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Vue 3 + Vite + Leaflet |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL |
| Mapa | H3 (Uber) resolución 7 |
| Autenticación | JWT (cookie HttpOnly) + Google OAuth |
| Despliegue | Docker Compose + GitHub Actions |

---

## Características del juego

- **Colonización** de feudos en mapa hexagonal generado desde datos reales
- **Ejércitos** con movimiento, estamina, reclutamiento y combate en coalición
- **Edificios** por feudo (militares, económicos, religiosos, marítimos) con sistema de conservación
- **Flotas navales** con embarco/desembarco de ejércitos y personajes
- **Personajes** con árbol genealógico, herencia y bonificaciones de combate
- **Diplomacia** entre jugadores (alianza, clientela, devotio, rehenes, mercenariado)
- **Cultura** de los feudos irradiada por templos (Romanos, Cartagineses, Íberos, Celtas)
- **Motor de turnos** automático con cosecha, producción, deterioro de edificios y movimientos
- **Señoríos** con fronteras dinámicas calculadas sobre H3

---

## Estructura del proyecto

```
hispania-210ac/
├── client/          # Frontend Vue 3 + Vite
├── server/
│   ├── src/
│   │   ├── services/    # Lógica de negocio (agnóstica a BD y HTTP)
│   │   ├── models/      # Capa de persistencia (SQL)
│   │   ├── logic/       # Motor de turnos, combate, producción
│   │   └── config/      # Constantes y parámetros de balanceo
│   └── routes/          # API REST
├── sql/             # Migraciones incrementales (001_*.sql …)
├── tools/           # extractor.py — genera el mapa desde GeoTIFF
├── scripts/         # migrate.sh para CI/CD
└── docker-compose.prod.yml
```

---

## Arrancar en local

### Requisitos

- Node.js 18+
- PostgreSQL 14+
- Python 3.8+ (solo para regenerar el mapa)

### 1. Variables de entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales de base de datos
```

### 2. Base de datos

Aplica las migraciones en orden desde `/sql/`:

```bash
psql -U postgres -d hispania210ac -f sql/001_initial.sql
# ... hasta la última migración
```

### 3. Backend

```bash
cd server
npm install
npm start        # http://localhost:3000
```

### 4. Frontend

```bash
cd client
npm install
npm run dev      # http://localhost:5173
```

---

## Docker (producción)

```bash
docker compose -f docker-compose.prod.yml up -d
```

La base de datos se migra automáticamente al arrancar mediante `scripts/migrate.sh`.

---

## Comandos de administración

```bash
# Forzar turno manualmente
node server/admin_tools.js forceTurn

# Forzar cosecha
node server/admin_tools.js forceHarvest

# Forzar producción mensual
node server/admin_tools.js forceMonthlyProduction
```

---

## Generación del mapa

El mapa se genera una sola vez desde archivos GeoTIFF de ESA WorldCover:

```bash
cd tools
cp config.example.py config.py
# Editar config.py con credenciales de BD
python extractor.py
```

El extractor clasifica cada hexágono H3 por tipo de terreno (Mar, Costa, Llanura, Río, Pantano, Bosque, Colinas, Montaña) usando datos de elevación SRTM y análisis de vecindad.

---

## Licencia

Proyecto privado — todos los derechos reservados.
