"""
test_military_producer.py

Script de prueba para verificar el canal army.movement.
Produce dos mensajes: ARMY_MOVED y ARMY_ARRIVED.

Uso:
    python audit/test_military_producer.py

Con military_consumer.py corriendo en otra terminal deberías ver ambos mensajes.
"""

import os
import json
import datetime
from shared.kafka_adapter import KafkaAdapter

BROKERS = os.getenv('KAFKA_BROKERS', 'localhost:9093').split(',')
TOPIC   = os.getenv('KAFKA_MILITARY_TOPIC', 'army.movement')

print(f"[TEST] Conectando a {BROKERS} → topic '{TOPIC}' ...")

adapter  = KafkaAdapter(bootstrap_servers=BROKERS)
producer = adapter.get_producer()

now = datetime.datetime.utcnow().isoformat() + "Z"

messages = [
    {
        "eventType":      "ARMY_MOVED",
        "timestamp":      now,
        "army_id":        7,
        "player_id":      3,
        "from":           "8928308280fffff",
        "to":             "8928308281fffff",
        "destination":    "892830828dfffff",
        "steps":          2,
        "force_exhausted": False,
        "arrived":        False,
    },
    {
        "eventType":      "ARMY_ARRIVED",
        "timestamp":      now,
        "army_id":        12,
        "player_id":      5,
        "from":           "892830828cfffff",
        "to":             "892830828dfffff",
        "destination":    "892830828dfffff",
        "steps":          1,
        "force_exhausted": True,
        "arrived":        True,
    },
]

for msg in messages:
    print(f"\n[TEST] Enviando {msg['eventType']}:\n{json.dumps(msg, indent=2)}")
    future = producer.send(TOPIC, msg)
    result = future.get(timeout=10)
    print(f"[TEST] ✅ Entregado — partition={result.partition} offset={result.offset}")

producer.flush()
print("\n[TEST] Todos los mensajes enviados. Comprueba military_consumer.py.")
