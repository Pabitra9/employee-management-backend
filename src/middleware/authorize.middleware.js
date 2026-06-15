'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Role-based authorization middleware factory.
 *
 * Must run *after* `authenticate` (it relies on `req.user`).
 *
 * @param {...string} allowedRoles Roles permitted to access the route.
 * @returns {import('express').RequestHandler}
 *
 * @example
 *   router.post('/', authenticate, authorize('admin'), createEmployee);
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Not authorized: authentication required'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(
      new ApiError(403, 'Forbidden: you do not have permission to perform this action')
    );
  }

  return next();
};

module.exports = authorize;
