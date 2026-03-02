import { Pool } from "pg";
import { config } from "../../../config/config";
import { logger } from "../../monitoring/logger";

let pool: Pool | null = null;

export const getPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: config.db.url,
      max: 10
    });
    pool.on("error", (err) => {
      logger.error("postgres_pool_error", { error: err.message });
    });
    logger.info("postgres_pool_created", { url: config.db.url });
  }
  return pool;
};

export const closePool = async () => {
  if (pool) {
    await pool.end();
    logger.info("postgres_pool_closed");
    pool = null;
  }
};

