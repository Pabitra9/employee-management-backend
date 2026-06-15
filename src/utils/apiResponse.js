'use strict';

/**
 * Helpers that enforce the project-wide response envelope.
 *
 * Success: { success: true, message, data }
 * Error:   { success: false, message, errors? }
 */

/**
 * Send a standardized success response.
 *
 * @param {import('express').Response} res
 * @param {number} statusCode  HTTP status code (e.g. 200, 201).
 * @param {string} message     Human-readable success message.
 * @param {object} [data={}]   Payload returned to the client.
 */
const sendSuccess = (res, statusCode, message, data = {}) =>
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });

/**
 * Send a standardized error response.
 *
 * @param {import('express').Response} res
 * @param {number} statusCode      HTTP status code (e.g. 400, 401, 404).
 * @param {string} message         Human-readable error message.
 * @param {Array<object>} [errors] Optional field-level error details.
 */
const sendError = (res, statusCode, message, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { sendSuccess, sendError };
