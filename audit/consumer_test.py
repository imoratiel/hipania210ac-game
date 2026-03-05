# audit/consumer_test.py
from shared.kafka_adapter import KafkaAdapter

adapter = KafkaAdapter()
# Creamos un consumidor en el grupo 'test-group'
consumer = adapter.get_consumer('test-topic', 'test-group')

print("Consumidor esperando mensajes...")

for message in consumer:
    print(f"¡Mensaje recibido!: {message.value}")