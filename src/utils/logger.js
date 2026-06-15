'use strict';

/**
 * Tiny, dependency-free logger with timestamps and levels.
 *
 * Kept intentionally minimal — swap the internals for pino/winston later
 * without touching call sites. Debug logs are silenced in production.
 */
const env = require('../config/env');

const timestamp = () => new Date().toISOString();

const logger = {
  info: (...args) => console.log(`[${timestamp()}] [INFO]`, ...args),
  warn: (...args) => console.warn(`[${timestamp()}] [WARN]`, ...args),
  error: (...args) => console.error(`[${timestamp()}] [ERROR]`, ...args),
  debug: (...args) => {
    if (!env.isProduction) {
      console.debug(`[${timestamp()}] [DEBUG]`, ...args);
    }
  },
};

module.exports = logger;
