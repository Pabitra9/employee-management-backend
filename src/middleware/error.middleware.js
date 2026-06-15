'use strict';

const env = require('../config/env');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');
const { sendError } = require('../utils/apiResponse');

/**
 * 404 handler for unmatched routes. Mounted after all real routes.
 */
const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Global error handler. Must be the LAST middleware registered.
 *
 * Normalizes known error shapes (our ApiError, Mongoose, JWT) into the
 * standard error envelope so clients always get a predictable response.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // --- Mongoose: invalid ObjectId / cast failure -------------------------
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for "${err.path}": ${err.value}`;
  }

  // --- Mongoose: duplicate key (unique index violation) ------------------
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value: ${field} already exists`;
    errors = [{ field, message: `${field} must be unique` }];
  }

  // --- Mongoose: schema validation ---------------------------------------
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // --- JWT ---------------------------------------------------------------
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  // Log server-side faults with the stack; client (4xx) errors stay quiet.
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${statusCode}`, err.stack);
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;
  // Expose stack traces only outside production to aid debugging.
  if (!env.isProduction && statusCode >= 500) body.stack = err.stack;

  res.status(statusCode).json(body);
};

module.exports = { notFound, errorHandler };
