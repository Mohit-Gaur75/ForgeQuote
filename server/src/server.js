// server/src/server.js
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { disconnectDatabase } from './config/database.js';

const server = app.listen(env.PORT, () => {
  logger.info(`⚡ ForgeQuote API server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

// Graceful Shutdown Handler
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await disconnectDatabase();
      logger.info('Database connection closed cleanly.');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during database disconnection.');
      process.exit(1);
    }
  });

  // Force exit after 10s timeout
  setTimeout(() => {
    logger.error('Shutdown timeout reached. Forcing process exit.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
