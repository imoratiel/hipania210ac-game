"""
military_consumer.py

Consumidor de eventos de auditoría de movimiento de tropas.
Escucha el topic `army.movement` y registra cada movimiento en:
    audit/logs/military.log

Eventos:
  - ARMY_MOVED   → el ejército avanzó N pasos pero no llegó al destino
  - ARMY_ARRIVED → el ejército alcanzó su destino

Uso:
    python audit/military_consumer.py

Variables de entorno (opcionales):
    KAFKA_BROKERS          → broker(s) separados por coma (default: localhost:9093)
    KAFKA_MILITARY_TOPIC   → topic a consumir (default: army.movement)
    KAFKA_STARTUP_DELAY    → segundos de espera al arrancar (default: 3)
"""

import os
import time
from shared.kafka_adapter import KafkaAdapter
from shared.audit_logger import AuditLogger

BROKERS = os.getenv('KAFKA_BROKERS', 'localhost:9093').split(',')
TOPIC   = os.getenv('KAFKA_MILITARY_TOPIC', 'army.movement')
GROUP   = 'military-audit-group'

STARTUP_DELAY = int(os.getenv('KAFKA_STARTUP_DELAY', '3'))
if STARTUP_DELAY > 0:
    print(f"[AUDIT MIL] Esperando {STARTUP_DELAY}s para que Kafka esté listo...")
    time.sleep(STARTUP_DELAY)

adapter  = KafkaAdapter(bootstrap_servers=BROKERS)
consumer = adapter.get_consumer(TOPIC, GROUP)
log      = AuditLogger('military')

print(f"[AUDIT MIL] Consumidor iniciado → topic={TOPIC} brokers={BROKERS}")
print("[AUDIT MIL] Esperando eventos de movimiento de tropas...\n")

for message in consumer:
    entry      = log.write(message)
    event_type = entry['event_type']
    p          = entry['payload']
    army_id    = p.get('army_id', '?')
    player_id  = p.get('player_id', '?')
    from_hex   = p.get('from', '?')
    to_hex     = p.get('to', '?')
    steps      = p.get('steps', 0)
    exhausted  = p.get('force_exhausted', False)
    destination = p.get('destination', '?')

    exhausted_tag = ' ⚠️ AGOTADO' if exhausted else ''

    if event_type == 'ARMY_ARRIVED':
        print(
            f"[AUDIT MIL] offset={message.offset:>6} | "
            f"✅ Ejército {army_id} (jugador {player_id}) "
            f"LLEGÓ a {to_hex} en {steps} pasos{exhausted_tag} · {entry['received_at']}"
        )
    else:
        print(
            f"[AUDIT MIL] offset={message.offset:>6} | "
            f"🚶 Ejército {army_id} (jugador {player_id}) "
            f"{from_hex} → {to_hex} ({steps} pasos, destino: {destination}){exhausted_tag} · {entry['received_at']}"
        )
