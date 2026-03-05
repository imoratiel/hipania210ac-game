# audit/producer_test.py
from shared.kafka_adapter import KafkaAdapter
import time

adapter = KafkaAdapter()
producer = adapter.get_producer()

print("Enviando mensaje de prueba...")

# Enviamos algunos datos de prueba
for i in range(20):
    data = {'id': i, 'message': f'¡Hola, Kafka funciona! mensaje {i}'}
    producer.send('test-topic', value=data)
    print(f"Enviado: {data}")
    time.sleep(1) # Un pequeño respiro

print("Mensaje enviado exitosamente.")
