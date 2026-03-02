import { createClient } from "redis";
import { config } from "../../config/config";
import { logger } from "../monitoring/logger";

let cacheClient: ReturnType<typeof createClient> | null = null;
let rateClient: ReturnType<typeof createClient> | null = null;

export const getCacheRedis = () => {
  if (!cacheClient) {
    cacheClient = createClient({ url: config.redis.cacheUrl });
    cacheClient.on("error", (err) => logger.error("redis_cache_error", { error: err.message }));
    cacheClient
      .connect()
      .then(() => logger.info("redis_cache_connected", { url: config.redis.cacheUrl }))
      .catch((err) => logger.error("redis_cache_connect_failed", { error: err.message }));
  }
  return cacheClient;
};

export const getRateRedis = () => {
  if (!rateClient) {
    rateClient = createClient({ url: config.redis.rateUrl });
    rateClient.on("error", (err) => logger.error("redis_rate_error", { error: err.message }));
    rateClient
      .connect()
      .then(() => logger.info("redis_rate_connected", { url: config.redis.rateUrl }))
      .catch((err) => logger.error("redis_rate_connect_failed", { error: err.message }));
  }
  return rateClient;
};

export const closeRedisClients = async () => {
  const tasks: Promise<unknown>[] = [];
  if (cacheClient) tasks.push(cacheClient.quit());
  if (rateClient) tasks.push(rateClient.quit());
  await Promise.allSettled(tasks);
};