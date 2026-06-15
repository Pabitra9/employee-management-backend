'use strict';

const asyncHandler = require('../middleware/asyncHandler');
const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * POST /api/auth/register
 * Public — register a new user account.
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const result = await authService.register({ name, email, password, role });
  return sendSuccess(res, 201, 'User registered successfully', result);
});

/**
 * POST /api/auth/login
 * Public — authenticate and receive a JWT.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  return sendSuccess(res, 200, 'Login successful', result);
});

/**
 * GET /api/auth/me
 * Protected — return the currently authenticated user's profile.
 */
const getProfile = asyncHandler(async (req, res) => {
  // req.user is populated by the authenticate middleware.
  const user = await authService.getProfile(req.user._id);
  return sendSuccess(res, 200, 'Profile fetched successfully', { user });
});

/**
 * PUT /api/auth/me
 * Protected — update the caller's own name and/or password.
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, password } = req.body;
  const user = await authService.updateProfile(req.user._id, { name, password });
  return sendSuccess(res, 200, 'Profile updated successfully', { user });
});

/**
 * POST /api/auth/logout
 * Protected — stateless logout.
 *
 * JWTs are stateless, so "logout" is primarily a client concern (discard the
 * token). We clear an optional auth cookie and return success. For true
 * server-side invalidation you would add a token denylist / rotate secrets.
 */
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  return sendSuccess(res, 200, 'Logged out successfully');
});

module.exports = { register, login, getProfile, updateProfile, logout };
