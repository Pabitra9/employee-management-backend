'use strict';

/**
 * Wraps an async route handler so rejected promises are forwarded to Express's
 * error handling chain instead of crashing the process or hanging the request.
 *
 * Without this every controller would need its own try/catch.
 *
 * @param {Function} fn async (req, res, next) => {...}
 * @returns {Function} Express middleware.
 *
 * @example
 *   router.get('/', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
