from kafka import KafkaConsumer, KafkaProducer
import json

class KafkaAdapter:
    def __init__(self, bootstrap_servers=['localhost:9093']):
        self.servers = bootstrap_servers

    def get_producer(self):
        return KafkaProducer(
            bootstrap_servers=self.servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )

    def get_consumer(self, topic, group_id):
        return KafkaConsumer(
            topic,
            bootstrap_servers=self.servers,
            group_id=group_id,
            auto_offset_reset='earliest',
            value_deserializer=lambda x: json.loads(x.decode('utf-8'))
        )