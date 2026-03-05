"""
tax_consumer.py

Consumidor de eventos de auditoría fiscal.
Escucha el topic `tax.collection` y registra cada recaudación en:
    audit/logs/tax.log

Uso:
    python audit/tax_consumer.py

Variables de entorno (opcionales):
    KAFKA_BROKERS       → broker(s) separados por coma (default: localhost:9093)
    KAFKA_TAX_TOPIC     → topic a consumir (default: tax.collection)
    KAFKA_STARTUP_DELAY → segundos de espera al arrancar (default: 3)
"""

import os
import time
from shared.kafka_adapter import KafkaAdapter
from shared.audit_logger import AuditLogger

BROKERS = os.getenv('KAFKA_BROKERS', 'localhost:9093').split(',')
TOPIC   = os.getenv('KAFKA_TAX_TOPIC', 'tax.collection')
GROUP   = 'tax-audit-group'

STARTUP_DELAY = int(os.getenv('KAFKA_STARTUP_DELAY', '3'))
if STARTUP_DELAY > 0:
    print(f"[AUDIT TAX] Esperando {STARTUP_DELAY}s para que Kafka esté listo...")
    time.sleep(STARTUP_DELAY)

adapter  = KafkaAdapter(bootstrap_servers=BROKERS)
consumer = adapter.get_consumer(TOPIC, GROUP)
log      = AuditLogger('tax')

print(f"[AUDIT TAX] Consumidor iniciado → topic={TOPIC} brokers={BROKERS}")
print("[AUDIT TAX] Esperando eventos de recaudación fiscal...\n")

for message in consumer:
    entry     = log.write(message)
    player_id = entry['payload'].get('player_id', '?')
    amount    = entry['payload'].get('amount', 0)
    tax_rate  = entry['payload'].get('tax_rate', '?')
    turn      = entry['payload'].get('turn', '?')

    print(
        f"[AUDIT TAX] offset={message.offset:>6} | "
        f"Jugador {player_id} recolectó {amount} de oro "
        f"(tasa {tax_rate}% · turno {turn} · {entry['received_at']})"
    )
