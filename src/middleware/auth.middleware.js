'use strict';

const asyncHandler = require('./asyncHandler');
const ApiError = require('../utils/ApiError');
const tokenService = require('../services/token.service');
const User = require('../models/user.model');

/**
 * Authentication middleware.
 *
 * 1. Extracts a Bearer token from the `Authorization` header.
 * 2. Verifies the JWT signature/expiry.
 * 3. Loads the user and attaches it to `req.user` for downstream handlers.
 *
 * Throws 401 on any failure.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Not authorized: no token provided');
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new ApiError(401, 'Not authorized: no token provided');
  }

  // verifyToken throws JsonWebTokenError / TokenExpiredError, which the global
  // error handler maps to 401 responses.
  const decoded = tokenService.verifyToken(token);

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'Not authorized: user no longer exists');
  }

  req.user = user;
  next();
});

module.exports = authenticate;
