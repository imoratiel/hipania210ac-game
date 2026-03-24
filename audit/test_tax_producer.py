"""
test_tax_producer.py

Script de prueba para verificar el canal tax.collection.
Produce mensajes TAX_COLLECTION manualmente sin necesidad de que el juego esté corriendo.

Uso:
    python audit/test_tax_producer.py

Con el tax_consumer.py corriendo en otra terminal deberías ver el mensaje inmediatamente.
"""

import os
import json
import datetime
from shared.kafka_adapter import KafkaAdapter

BROKERS = os.getenv('KAFKA_BROKERS', 'localhost:9093').split(',')
TOPIC   = os.getenv('KAFKA_TAX_TOPIC', 'tax.collection')

print(f"[TEST] Conectando a {BROKERS} → topic '{TOPIC}' ...")

adapter  = KafkaAdapter(bootstrap_servers=BROKERS)
producer = adapter.get_producer()

message = {
    "eventType":  "TAX_COLLECTION",
    "timestamp":  datetime.datetime.utcnow().isoformat() + "Z",
    "player_id":  999,
    "amount":     1500,
    "tax_rate":   5,
    "turn":       42,
}

print(f"[TEST] Enviando: {json.dumps(message, indent=2)}")

future = producer.send(TOPIC, message)
result = future.get(timeout=10)   # bloquea hasta confirmación del broker

producer.flush()

print(f"[TEST] ✅ Mensaje entregado — partition={result.partition} offset={result.offset}")
print(f"[TEST] Si tax_consumer.py está activo, deberías ver el mensaje ahora.")
