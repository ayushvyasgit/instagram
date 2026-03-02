import { Kafka } from "kafkajs";
import { config } from "../../config/config";
import { logger } from "../monitoring/logger";

const kafka = new Kafka({ brokers: config.kafka.brokers });

export const kafkaProducer = kafka.producer();
export const kafkaConsumer = kafka.consumer({ groupId: "instagram-service" });

export const initKafka = async () => {
  try {
    await kafkaProducer.connect();
    logger.info("kafka_producer_connected", { brokers: config.kafka.brokers });
    // Consumer will be connected explicitly where needed (worker)
  } catch (err: any) {
    logger.error("kafka_connect_failed", { error: err.message });
  }
};

export const closeKafka = async () => {
  try {
    await kafkaProducer.disconnect();
    await kafkaConsumer.disconnect();
    logger.info("kafka_disconnected");
  } catch (err: any) {
    logger.error("kafka_disconnect_failed", { error: err.message });
  }
};