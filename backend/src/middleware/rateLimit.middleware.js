import redis from '../config/redis.js';
import { RateLimitError } from '../utils/errors.js';

export const createRateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 1000, // 1 minute
    maxRequests = 1000,
    keyPrefix = 'ratelimit',
    skipSuccessfulRequests = false,
  } = options;

  return async (req, res, next) => {
    try {
      // Use IP or user ID for rate limiting
      const identifier = req.user?.id || req.ip || 'anonymous';
      const key = `${keyPrefix}:${identifier}`;

      // Get current count
      const current = await redis.get(key);
      const count = current ? parseInt(current) : 0;

      if (count >= maxRequests) {
        const ttl = await redis.ttl(key);
        
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', Date.now() + ttl * 1000);
        
        return res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: ttl,
        });
      }
      // Increment counter
      const newCount = count + 1;

      if (count === 0) {
        // First request in window
        await redis.setex(key, Math.ceil(windowMs / 1000), newCount);
      } else {
        await redis.incr(key);
      }

      // Set headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - newCount);

      // Skip incrementing on successful requests if configured
      if (skipSuccessfulRequests) {
        res.on('finish', () => {
          if (res.statusCode < 400) {
            redis.decr(key);
          }
        });
      }

      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      // If Redis fails, allow request through
      next();
    }
  };
};

// Preset rate limiters
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50, // 5 requests per 15 minutes
  keyPrefix: 'auth',
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
  keyPrefix: 'api',
});

export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 200, // 20 uploads per hour
  keyPrefix: 'upload',
});