import express from "express";
import cors from "cors";
import helmet from "helmet";
import { json, urlencoded } from "body-parser";
import { createRouter } from "./router";
import { errorMiddleware } from "./middleware/error.middleware";
import { config } from "../../config/config";
import { httpLogger, logger } from "../../infrastructure/monitoring/logger";
import { closePool } from "../../infrastructure/persistence/postgres/connection";
import { closeRedisClients } from "../../infrastructure/cache/redis.client";
import { closeKafka, initKafka } from "../../infrastructure/messaging/kafka.client";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: config.cors.origin,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true
    })
  );
  app.use(helmet());
  app.use(httpLogger);
  app.use(json({ limit: "2mb" }));
  app.use(urlencoded({ extended: true }));

  app.use("/api", createRouter());

  app.use(errorMiddleware);
  return app;
};

if (require.main === module) {
  const app = createApp();
  const port = config.server.port;
  const server = app.listen(port, async () => {
    logger.info("api_started", { port });
    await initKafka();
  });

  const shutdown = async (signal: string) => {
    logger.info("shutdown_signal_received", { signal });
    server.close(async (err) => {
      if (err) {
        logger.error("http_server_close_error", { error: err.message });
      } else {
        logger.info("http_server_closed");
      }
      await Promise.allSettled([closePool(), closeRedisClients(), closeKafka()]);
      process.exit(err ? 1 : 0);
    });
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}