'use strict';

/**
 * Centralized, validated environment configuration.
 *
 * Loading every `process.env` access through this single module means:
 *  - we fail fast at boot if a required variable is missing, and
 *  - the rest of the codebase imports typed-ish, defaulted values instead of
 *    reaching into `process.env` everywhere.
 */
const dotenv = require('dotenv');

dotenv.config();

/** Variables the application cannot run without. */
const REQUIRED_VARS = ['MONGO_URI', 'JWT_SECRET'];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  // eslint-disable-next-line no-console
  console.error(
    `\n[config] Missing required environment variables: ${missing.join(', ')}\n` +
      '[config] Copy .env.example to .env and fill in the values.\n'
  );
  process.exit(1);
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5050,

  mongoUri: process.env.MONGO_URI,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',

  // CORS: "*" (allow all) or a comma-separated allow-list of origins.
  clientUrl: process.env.CLIENT_URL || '*',

  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
    employeeEmail: process.env.SEED_EMPLOYEE_EMAIL || 'employee@example.com',
    employeePassword: process.env.SEED_EMPLOYEE_PASSWORD || 'Employee@123',
  },
};

env.isProduction = env.nodeEnv === 'production';
env.isDevelopment = env.nodeEnv === 'development';

module.exports = env;
