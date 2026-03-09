import app from './app.js';
import { config } from './config/env.js';
import pool from './config/database.js';
import { initializeDatabase } from './config/database.js';
import redis from './config/redis.js';
import { initializeBucket } from './config/minio.js';
import { initializeKafka, disconnectKafka } from './config/kafka.js';


const PORT = config.PORT;

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  // Stop accepting new connections
  server.close(async () => {
    console.log('HTTP server closed');
    try {
      // Close database connections
      await pool.end();
      console.log('Database connections closed');
      // Close Redis connectioninitializeDatabase
      await redis.quit();
      await disconnectKafka();
      console.log('Kafka connections closed');
      console.log('Redis connection closed');

      console.log('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};
const initializeServices = async () => {
  try {
    // Initialize Database
    await initializeDatabase();
    // Initialize MinIO
    await initializeBucket();
    // Initialize Kafka
    await initializeKafka();
    console.log('✅ All services initialized');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    // Continue anyway - services can fail gracefully
  }
};

await initializeServices();

// Start server
const server = app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Instagram Backend Server`);
  console.log(`📍 Environment: ${config.NODE_ENV}`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log('='.repeat(50));
});

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

export default server;