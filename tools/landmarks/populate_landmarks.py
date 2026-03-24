#!/usr/bin/env python3
"""
Landmarks ETL - OpenStreetMap -> PostgreSQL
Descarga pueblos, ciudades y picos de Overpass API y los inserta
en la tabla landmarks usando índices H3.
"""

import json
import logging
import sys
import time
from pathlib import Path

import h3
import psycopg2
from psycopg2.extras import execute_values
import requests

# ── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('landmarks.log', encoding='utf-8'),
    ]
)
log = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────

CONFIG_PATH = Path(__file__).parent / 'config.json'


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        log.error(f"config.json no encontrado en {CONFIG_PATH}")
        log.error("Copia config.json.example a config.json y rellena los valores.")
        sys.exit(1)
    with CONFIG_PATH.open(encoding='utf-8') as f:
        return json.load(f)


# ── Extracción (Overpass API) ─────────────────────────────────────────────────

def build_overpass_query(bbox: dict) -> str:
    """Construye la consulta Overpass QL para el BBOX dado."""
    s = bbox['min_lat']
    w = bbox['min_lng']
    n = bbox['max_lat']
    e = bbox['max_lng']
    return f"""
[out:json][timeout:300][bbox:{s},{w},{n},{e}];
(
  node["place"~"^(village|town|hamlet|city)$"];
  node["natural"="peak"];
);
out body;
"""


def fetch_overpass(url: str, query: str, retries: int = 3, backoff: float = 15.0) -> dict:
    """Llama a la API Overpass con reintentos y backoff exponencial."""
    log.info("Descargando datos de Overpass API...")
    log.info(f"  URL: {url}")

    for attempt in range(1, retries + 1):
        try:
            response = requests.post(
                url,
                data={'data': query},
                timeout=360,
            )
            response.raise_for_status()
            data = response.json()
            # Overpass devuelve remark cuando el query agotó su timeout server-side
            if 'remark' in data:
                log.warning(f"Overpass remark (posible timeout server): {data['remark']}")
            count = len(data.get('elements', []))
            if count == 0 and 'remark' in data:
                log.warning("0 elementos con remark: reintentando...")
                raise requests.exceptions.RequestException("Overpass timeout server-side")
            log.info(f"Descarga completada: {count} elementos recibidos")
            return data

        except requests.exceptions.Timeout:
            log.warning(f"Timeout en intento {attempt}/{retries}")
        except requests.exceptions.HTTPError as e:
            log.warning(f"HTTP {e.response.status_code} en intento {attempt}/{retries}: {e}")
        except requests.exceptions.RequestException as e:
            log.warning(f"Error de red en intento {attempt}/{retries}: {e}")

        if attempt < retries:
            wait = backoff * attempt
            log.info(f"Reintentando en {wait:.0f}s...")
            time.sleep(wait)

    log.error("Todos los reintentos fallaron. Abortando.")
    sys.exit(1)


# ── Transformación ────────────────────────────────────────────────────────────

# Mapeo de tipos OSM a tipos del juego
TYPE_MAP = {
    'village': 'pueblo',
    'town':    'pueblo',
    'hamlet':  'pueblo',
    'city':    'pueblo',
    'peak':    'monte',
}


def transform(elements: list, h3_resolution: int) -> list:
    """
    Transforma los elementos OSM a registros para landmarks.
    - Descarta elementos sin nombre o sin coordenadas.
    - Un único landmark por celda H3 (primer hallazgo por prioridad: city > town > village > hamlet > peak).
    """
    log.info(f"Transformando {len(elements)} elementos -> H3 resolución {h3_resolution}...")

    # Prioridad para desempate cuando varios nodos caen en la misma celda H3
    priority = {'city': 0, 'town': 1, 'village': 2, 'hamlet': 3, 'peak': 4}

    # {h3_index: (priority, record)}
    best_per_cell: dict = {}

    skipped_no_name = 0
    skipped_no_coords = 0

    for el in elements:
        lat = el.get('lat')
        lng = el.get('lon')
        if lat is None or lng is None:
            skipped_no_coords += 1
            continue

        tags = el.get('tags', {})
        # Intentar nombre en español primero, luego genérico, luego latín
        name = (
            tags.get('name:es')
            or tags.get('name')
            or tags.get('name:la')
        )
        if not name:
            skipped_no_name += 1
            continue

        # Tipo OSM
        osm_type = tags.get('place') or tags.get('natural') or 'unknown'
        landmark_type = TYPE_MAP.get(osm_type, osm_type)
        prio = priority.get(osm_type, 99)

        # Convertir a H3
        try:
            h3_index = h3.latlng_to_cell(lat, lng, h3_resolution)
        except Exception as e:
            log.warning(f"Error convirtiendo ({lat}, {lng}) a H3: {e}")
            continue

        record = {
            'name':     name[:100],
            'h3_index': h3_index,
            'type':     landmark_type,
        }

        # Guardar solo el de mayor prioridad por celda
        existing = best_per_cell.get(h3_index)
        if existing is None or prio < existing[0]:
            best_per_cell[h3_index] = (prio, record)

    records = [v[1] for v in best_per_cell.values()]

    log.info(f"Transformación completada:")
    log.info(f"  Landmarks únicos: {len(records)}")
    log.info(f"  Descartados sin nombre: {skipped_no_name}")
    log.info(f"  Descartados sin coordenadas: {skipped_no_coords}")

    # Resumen por tipo
    from collections import Counter
    type_counts = Counter(r['type'] for r in records)
    for t, c in sorted(type_counts.items()):
        log.info(f"    {t}: {c}")

    return records


# ── Carga (PostgreSQL) ────────────────────────────────────────────────────────

def load_to_db(db_config: dict, records: list, batch_size: int = 500) -> int:
    """
    Inserta landmarks en PostgreSQL por lotes.
    Idempotente gracias a ON CONFLICT (h3_index) DO NOTHING.
    REQUISITO: la tabla landmarks debe tener UNIQUE constraint en h3_index
               (ejecuta sql/032_landmarks_unique.sql antes de correr este script).
    """
    if not records:
        log.info("Sin registros para insertar.")
        return 0

    log.info(f"Conectando a PostgreSQL en {db_config['host']}:{db_config['port']}...")

    conn = psycopg2.connect(**db_config)
    insert_sql = """
        INSERT INTO landmarks (name, h3_index, type)
        VALUES %s
        ON CONFLICT (h3_index) DO NOTHING
    """

    total_inserted = 0
    try:
        with conn.cursor() as cur:
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                values = [(r['name'], r['h3_index'], r['type']) for r in batch]
                execute_values(cur, insert_sql, values)
                conn.commit()
                total_inserted += len(batch)
                pct = total_inserted / len(records) * 100
                log.info(f"  Lote insertado: {total_inserted}/{len(records)} ({pct:.0f}%)")

    except psycopg2.errors.UndefinedObject:
        conn.rollback()
        log.error("ON CONFLICT falló: falta UNIQUE constraint en landmarks.h3_index")
        log.error("Ejecuta sql/032_landmarks_unique.sql y vuelve a intentarlo.")
        raise
    except Exception as e:
        conn.rollback()
        log.error(f"Error en inserción: {e}")
        raise
    finally:
        conn.close()

    return total_inserted


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    log.info("=" * 60)
    log.info("LANDMARKS ETL  |  OpenStreetMap -> PostgreSQL")
    log.info("=" * 60)

    cfg = load_config()

    bbox         = cfg['bbox']
    h3_res       = cfg.get('h3_resolution', 7)
    overpass_url = cfg.get('overpass_url', 'https://overpass-api.de/api/interpreter')
    db_cfg       = cfg['db']
    batch_size   = cfg.get('batch_size', 500)

    log.info(f"BBOX:          lat=[{bbox['min_lat']}, {bbox['max_lat']}]  lng=[{bbox['min_lng']}, {bbox['max_lng']}]")
    log.info(f"H3 resolución: {h3_res}")
    log.info(f"Batch size:    {batch_size}")

    # 1. Extracción
    query = build_overpass_query(bbox)
    data  = fetch_overpass(overpass_url, query)

    # 2. Transformación
    records = transform(data.get('elements', []), h3_res)

    if not records:
        log.warning("Sin landmarks para cargar. Verifica el BBOX y los datos OSM.")
        return

    # 3. Carga
    total = load_to_db(db_cfg, records, batch_size)

    log.info("=" * 60)
    log.info(f"ETL COMPLETADO: {total} landmarks insertados/actualizados")
    log.info("=" * 60)


if __name__ == '__main__':
    main()
