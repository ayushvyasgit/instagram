import { Kafka } from 'kafkajs';
import { config } from './env.js';

const kafka = new Kafka({
  clientId: config.KAFKA_CLIENT_ID,
  brokers: config.KAFKA_BROKERS,
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'instagram-consumer-group' });

let isProducerConnected = false;
let isConsumerConnected = false;

// Initialize Kafka
export const initializeKafka = async () => {
  try {
    await producer.connect();
    isProducerConnected = true;
    console.log('✅ Kafka Producer connected');

    await consumer.connect();
    isConsumerConnected = true;
    console.log('✅ Kafka Consumer connected');
  } catch (error) {
    console.error('Kafka initialization error:', error);
    // Don't throw - allow app to run without Kafka in development
    console.warn('⚠️  Running without Kafka');
  }
};

// Event publisher
export const publishEvent = async (topic, event) => {
  if (!isProducerConnected) {
    console.warn('Kafka producer not connected, skipping event publish');
    return;
  }

  try {
    await producer.send({
      topic,
      messages: [
        {
          key: event.id || event.aggregateId,
          value: JSON.stringify(event),
          timestamp: Date.now().toString(),
        },
      ],
    });
    console.log(`📤 Event published to ${topic}:`, event.type);
  } catch (error) {
    console.error('Error publishing event:', error);
  }
};

// Event Topics
export const TOPICS = {
  POST_CREATED: 'post.created',
  POST_UPDATED: 'post.updated',
  POST_DELETED: 'post.deleted',
  COMMENT_CREATED: 'comment.created',
  COMMENT_UPDATED: 'comment.updated',
  COMMENT_DELETED: 'comment.deleted',
  LIKE_ADDED: 'like.added',
  LIKE_REMOVED: 'like.removed',
  USER_FOLLOWED: 'user.followed',
  USER_UNFOLLOWED: 'user.unfollowed',
};

// Subscribe to topics
export const subscribeToTopics = async (topics, handler) => {
  if (!isConsumerConnected) {
    console.warn('Kafka consumer not connected, skipping subscription');
    return;
  }

  try {
    await consumer.subscribe({ topics, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = JSON.parse(message.value.toString());
        console.log(`📥 Event received from ${topic}:`, event.type);
        await handler(topic, event);
      },
    });
  } catch (error) {
    console.error('Error subscribing to topics:', error);
  }
};

// Graceful shutdown
export const disconnectKafka = async () => {
  if (isProducerConnected) {
    await producer.disconnect();
    console.log('Kafka Producer disconnected');
  }
  if (isConsumerConnected) {
    await consumer.disconnect();
    console.log('Kafka Consumer disconnected');
  }
};

export { producer, consumer };
export default kafka;