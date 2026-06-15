'use strict';

const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

/**
 * Establish the MongoDB connection.
 *
 * Mongoose 8 buffers commands until connected, but we await an explicit
 * connection here so the process fails fast (and visibly) if the database is
 * unreachable at startup.
 *
 * @returns {Promise<typeof mongoose>}
 */
const connectDB = async () => {
  // `strictQuery` avoids silently dropping unknown query fields.
  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

  // Surface connection drops that happen *after* the initial connect.
  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err.message}`);
  });
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  return conn;
};

/** Gracefully close the connection (used during shutdown). */
const disconnectDB = async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
};

module.exports = { connectDB, disconnectDB };
