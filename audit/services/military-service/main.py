# /services/military-service/main.py
from shared.kafka_adapter import KafkaAdapter
from logic import procesar_movimiento_tropas

adapter = KafkaAdapter('localhost:9092')
consumer = adapter.subscribe('game.military', 'military-group')

print("Servicio Militar iniciado. Esperando eventos...")

for message in consumer:
    # La lógica de Kafka está escondida aquí dentro
    evento = message.value
    
    # Aquí llamamos a la lógica pura
    procesar_movimiento_tropas(evento)