"""
MultiAuditor.py

Auditor centralizado de eventos Kafka usando hilos independientes por tópico.
Un único proceso, un único contenedor Docker, N hilos — uno por tópico configurado.

Configuración: edita únicamente el diccionario TOPICS_CONFIG al inicio del archivo.

Variables de entorno:
    KAFKA_BROKERS          → broker(s) separados por coma (default: localhost:9093)
    KAFKA_STARTUP_DELAY    → segundos de espera al arrancar (default: 5)
"""

import os
import sys
import json
import time
import signal
import logging
import threading
from datetime import datetime, timezone
from pathlib import Path

from shared.kafka_adapter import KafkaAdapter

# ─────────────────────────────────────────────────────────────────────────────
#  CONFIGURACIÓN — edita solo este diccionario para añadir/quitar tópicos
# ─────────────────────────────────────────────────────────────────────────────
TOPICS_CONFIG = {
    # "nombre_topico": {
    #     "log_file":   ruta del fichero de log (relativa al directorio de este script)
    #     "group_id":   consumer group Kafka (único por tópico para no interferir)
    # }
    "tax.collection": {
        "log_file": "logs/tax.log",
        "group_id": "auditor-tax",
    },
    "army.movement": {
        "log_file": "logs/military.log",
        "group_id": "auditor-military",
    },
    "harvest.events": {
        "log_file": "logs/harvest.log",
        "group_id": "auditor-harvest",
    },
    "salary.payments": {
        "log_file": "logs/salary.log",
        "group_id": "auditor-salary",
    },
}

# ─────────────────────────────────────────────────────────────────────────────
#  Parámetros de reconexión
# ─────────────────────────────────────────────────────────────────────────────
RECONNECT_BASE_DELAY  = 5    # segundos de espera base tras error
RECONNECT_MAX_DELAY   = 120  # techo de backoff exponencial
BROKERS               = os.getenv('KAFKA_BROKERS', 'localhost:9093').split(',')
STARTUP_DELAY         = int(os.getenv('KAFKA_STARTUP_DELAY', '5'))

# ─────────────────────────────────────────────────────────────────────────────
#  Logging de arranque (stdout) — separa del logging por fichero
# ─────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d [%(name)s] %(message)s',
    datefmt='%Y-%m-%dT%H:%M:%S',
)
_main_log = logging.getLogger('MultiAuditor')


# ─────────────────────────────────────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────────────────────────────────────
def _build_file_logger(topic: str, log_path: Path) -> logging.Logger:
    """
    Crea un logger de Python dedicado a un fichero concreto.
    Cada hilo tiene su propia instancia → los logs no se mezclan entre tópicos.
    """
    log_path.parent.mkdir(parents=True, exist_ok=True)

    logger = logging.getLogger(f'audit.{topic}')
    logger.setLevel(logging.DEBUG)
    logger.propagate = False   # evita que suba al root logger (stdout)

    if not logger.handlers:
        fh = logging.FileHandler(log_path, encoding='utf-8')
        fh.setFormatter(logging.Formatter('%(message)s'))  # solo el JSON
        logger.addHandler(fh)

    return logger


def _now_ms() -> str:
    """Timestamp ISO 8601 con milisegundos y sufijo Z."""
    now = datetime.now(timezone.utc)
    return now.strftime('%Y-%m-%dT%H:%M:%S.') + f'{now.microsecond // 1000:03d}Z'


def _build_entry(msg) -> dict:
    """Construye el dict que se serializa en cada línea del log."""
    payload = dict(msg.value) if msg.value else {}
    return {
        'received_at': _now_ms(),
        'offset':      msg.offset,
        'partition':   msg.partition,
        'topic':       msg.topic,
        'event_type':  payload.pop('eventType', 'UNKNOWN'),
        'payload':     payload,
    }


# ─────────────────────────────────────────────────────────────────────────────
#  Worker por hilo
# ─────────────────────────────────────────────────────────────────────────────
def _worker(topic: str, config: dict, stop_event: threading.Event):
    """
    Hilo consumidor para un único tópico.

    Ciclo de vida:
        conectar → consumir mensajes → loguear
        si falla → esperar (backoff) → reconectar → repetir

    Nunca termina por sí solo salvo que stop_event sea señalado.
    """
    log_path   = Path(__file__).parent / config['log_file']
    group_id   = config['group_id']
    file_log   = _build_file_logger(topic, log_path)
    thread_log = logging.getLogger(f'worker.{topic}')

    thread_log.info(f'Hilo iniciado → topic={topic} log={log_path}')

    retry_delay = RECONNECT_BASE_DELAY

    while not stop_event.is_set():
        consumer = None
        try:
            adapter  = KafkaAdapter(bootstrap_servers=BROKERS)
            consumer = adapter.get_consumer(topic, group_id)
            thread_log.info(f'Conectado a {topic}')
            retry_delay = RECONNECT_BASE_DELAY  # reset backoff tras conexión exitosa

            for msg in consumer:
                if stop_event.is_set():
                    break

                try:
                    entry = _build_entry(msg)
                    file_log.info(json.dumps(entry, ensure_ascii=False))
                    thread_log.info(
                        f'offset={msg.offset:>7} | {entry["event_type"]} | '
                        f'{json.dumps(entry["payload"], ensure_ascii=False)}'
                    )

                except (ValueError, TypeError) as parse_err:
                    # Mensaje con formato inesperado — loguea y continúa
                    thread_log.warning(
                        f'offset={msg.offset} | Payload inválido: {parse_err} | raw={msg.value!r}'
                    )

        except Exception as conn_err:
            thread_log.error(
                f'Error en {topic}: {conn_err}. '
                f'Reconectando en {retry_delay}s...'
            )
            # Backoff exponencial con techo
            stop_event.wait(timeout=retry_delay)
            retry_delay = min(retry_delay * 2, RECONNECT_MAX_DELAY)

        finally:
            # Intento de cierre limpio del consumer si existe
            if consumer is not None:
                try:
                    consumer.close()
                except Exception:
                    pass

    thread_log.info(f'Hilo detenido para {topic}')


# ─────────────────────────────────────────────────────────────────────────────
#  Main
# ─────────────────────────────────────────────────────────────────────────────
def main():
    if STARTUP_DELAY > 0:
        _main_log.info(f'Esperando {STARTUP_DELAY}s para que Kafka esté listo...')
        time.sleep(STARTUP_DELAY)

    active_topics = {t: c for t, c in TOPICS_CONFIG.items()}
    _main_log.info(
        f'Iniciando MultiAuditor con {len(active_topics)} tópico(s): '
        f'{list(active_topics.keys())}'
    )
    _main_log.info(f'Brokers: {BROKERS}')

    stop_event = threading.Event()
    threads    = []

    # Arrancar un hilo por tópico
    for topic, config in active_topics.items():
        t = threading.Thread(
            target=_worker,
            args=(topic, config, stop_event),
            name=f'auditor-{topic}',
            daemon=True,   # muere si el proceso principal termina abruptamente
        )
        t.start()
        threads.append(t)
        _main_log.info(f'  ✓ Hilo arrancado: {t.name}')

    # Señal de shutdown limpio (SIGTERM / SIGINT / Ctrl-C)
    def _shutdown(signum, frame):
        _main_log.info('Señal de parada recibida — cerrando hilos...')
        stop_event.set()

    signal.signal(signal.SIGTERM, _shutdown)
    signal.signal(signal.SIGINT,  _shutdown)

    _main_log.info('MultiAuditor activo. Ctrl-C para detener.')

    # Mantener el proceso principal vivo y monitorizar hilos
    while not stop_event.is_set():
        time.sleep(10)
        alive = sum(1 for t in threads if t.is_alive())
        if alive < len(threads):
            _main_log.warning(f'Atención: {len(threads) - alive} hilo(s) caído(s)')

    # Esperar cierre ordenado de los hilos (máx. 10s)
    for t in threads:
        t.join(timeout=10)

    _main_log.info('MultiAuditor detenido.')


if __name__ == '__main__':
    main()
