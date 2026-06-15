'use strict';

const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Validation middleware.
 *
 * Runs after a set of express-validator chains and collects their results.
 * On failure it throws a 422 with field-level details; otherwise it passes
 * control to the next handler.
 *
 * @example
 *   router.post('/login', loginValidator, validate, authController.login);
 */
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array().map((err) => ({
    // express-validator v7 exposes the field as `path`.
    field: err.path || err.param,
    message: err.msg,
  }));

  return next(new ApiError(422, 'Validation failed', errors));
};

module.exports = validate;
