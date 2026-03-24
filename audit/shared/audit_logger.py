"""
shared/audit_logger.py

Logger de auditoría para los consumers Kafka del proyecto.
Escribe un fichero de log independiente por tipo de canal.

Uso:
    from shared.audit_logger import AuditLogger
    log = AuditLogger('tax')          # → audit/logs/tax.log
    log = AuditLogger('military')     # → audit/logs/military.log
    log.write(kafka_message, extra_fields)
"""

import os
import json
import logging
from datetime import datetime, timezone
from pathlib import Path


# Directorio de logs: audit/logs/ relativo a la raíz del proyecto.
# __file__ está en audit/shared/, subimos dos niveles y bajamos a audit/logs/
_BASE_DIR  = Path(__file__).resolve().parent.parent   # …/audit/
_LOGS_DIR  = _BASE_DIR / 'logs'


def _ensure_logs_dir():
    _LOGS_DIR.mkdir(parents=True, exist_ok=True)


class AuditLogger:
    """
    Logger de auditoría para un canal Kafka específico.

    Cada instancia escribe en su propio fichero:
        audit/logs/<channel>.log

    Formato de cada línea (JSON-Lines):
        {
            "received_at": "2026-03-05T15:23:41.123Z",  ← hora local con ms
            "offset":      42,                           ← offset Kafka
            "partition":   0,
            "topic":       "tax.collection",
            "event_type":  "TAX_COLLECTION",
            "payload":     { ...campos del mensaje... }
        }
    """

    def __init__(self, channel: str):
        """
        :param channel: nombre del canal, se usa como nombre del fichero de log.
                        Ej: 'tax', 'military'
        """
        _ensure_logs_dir()

        self.channel  = channel
        self.log_path = _LOGS_DIR / f'{channel}.log'

        # Logger estándar de Python, añade handler de fichero rotativo-simple
        self._logger = logging.getLogger(f'audit.{channel}')
        self._logger.setLevel(logging.DEBUG)

        # Evitar handlers duplicados si el módulo se reimporta
        if not self._logger.handlers:
            fh = logging.FileHandler(self.log_path, encoding='utf-8')
            fh.setFormatter(logging.Formatter('%(message)s'))  # solo el JSON
            self._logger.addHandler(fh)

        print(f'[AUDIT {channel.upper()}] Log en: {self.log_path}')

    def write(self, kafka_message, extra: dict = None):
        """
        Escribe una entrada de log para un mensaje Kafka recibido.

        :param kafka_message: objeto message de KafkaConsumer
        :param extra:         campos adicionales a incluir en el payload (opcional)
        """
        received_at = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.') + \
                      f'{datetime.now(timezone.utc).microsecond // 1000:03d}Z'

        payload = dict(kafka_message.value) if kafka_message.value else {}
        if extra:
            payload.update(extra)

        entry = {
            'received_at': received_at,
            'offset':      kafka_message.offset,
            'partition':   kafka_message.partition,
            'topic':       kafka_message.topic,
            'event_type':  payload.pop('eventType', '?'),
            'payload':     payload,
        }

        self._logger.info(json.dumps(entry, ensure_ascii=False))
        return entry   # útil para imprimir en consola también
