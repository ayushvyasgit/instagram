export const config = {
  server: {
    // Prefer APP_PORT from .local.env, fallback to PORT, then 4000
    port: Number(process.env.APP_PORT || process.env.PORT) || 4000
  },
  db: {
    // Use DATABASE_URL if provided, otherwise construct from POSTGRES_* envs
    url:
      process.env.DATABASE_URL ||
      `postgres://${process.env.POSTGRES_USER || "postgres"}:${process.env.POSTGRES_PASSWORD || "password"}@${process.env.POSTGRES_HOST || "localhost"}:5432/${process.env.POSTGRES_DB || "instagram"}`
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? "dev-secret",
    expiresIn: "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "dev-refresh",
    refreshExpiresIn: "7d"
  },
  redis: {
    // Separate hosts for cache and rate limiting, both from .local.env
    cacheUrl: `redis://${process.env.REDIS_CACHE_HOST || "localhost"}:6379`,
    rateUrl: `redis://${process.env.REDIS_RATE_HOST || "localhost"}:6379`
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || `kafka:${process.env.KAFKA_BROKER_PORT || "9092"}`).split(",")
  },
  cors: {
    origin: process.env.FRONTEND_ORIGIN || `http://localhost:${process.env.FRONTEND_PORT || "3000"}`
  },
  uploads: {
    dir: process.env.UPLOAD_DIR ?? "uploads",
    maxSizeBytes: 5 * 1024 * 1024,
    allowedMime: ["image/jpeg", "image/png", "image/webp"]
  }
};