'use strict';

const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { connectDB, disconnectDB } = require('./config/db');

let server;

/**
 * Boot sequence: connect to MongoDB first, then start accepting traffic.
 */
const start = async () => {
  try {
    await connectDB();

    server = app.listen(env.port, () => {
      logger.info(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
      logger.info(`API docs available at http://localhost:${env.port}/api-docs`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

/**
 * Graceful shutdown — stop accepting connections, close the DB, then exit.
 * @param {string} signal
 */
const shutdown = async (signal) => {
  logger.warn(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      await disconnectDB();
      logger.info('Process terminated cleanly');
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

// Crash-safety nets: log and exit so a process manager can restart cleanly.
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  shutdown('unhandledRejection');
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

['SIGTERM', 'SIGINT'].forEach((sig) => process.on(sig, () => shutdown(sig)));

start();
