import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || 'redispass',
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 500);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

// Cache helper functions
export const cacheService = {
  async get(key) {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set(key, value, ttl = 3600) {
    await redis.setex(key, ttl, JSON.stringify(value));
  },

  async del(key) {
    await redis.del(key);
  },

  async delPattern(pattern) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};

export default redis;