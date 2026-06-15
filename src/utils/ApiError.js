'use strict';

/**
 * Operational (expected) application error carrying an HTTP status code.
 *
 * Throw this anywhere in the request lifecycle; the global error handler reads
 * `statusCode` / `message` / `errors` to build a consistent response.
 *
 * @example
 *   throw new ApiError(404, 'Employee not found');
 *   throw new ApiError(422, 'Validation failed', [{ field: 'email', message: '...' }]);
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP status code.
   * @param {string} message    Human-readable message.
   * @param {Array<object>} [errors] Optional field-level error details.
   */
  constructor(statusCode, message, errors = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
    // Marks errors we threw on purpose vs. unexpected programmer errors.
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
