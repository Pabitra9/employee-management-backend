'use strict';

const asyncHandler = require('../middleware/asyncHandler');
const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/apiResponse');
const env = require('../config/env');

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
 * POST /api/auth/forgot-password
 * Public — request a password-reset link.
 *
 * Always returns the same generic message (whether or not the email exists) to
 * prevent email enumeration. In non-production, the reset token/URL is included
 * in the response so the flow can be tested without a configured email service.
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);

  const data = {};
  if (!env.isProduction && result.resetUrl) {
    data.resetToken = result.resetToken;
    data.resetUrl = result.resetUrl;
    data.note = 'Dev only: in production this is emailed, not returned.';
  }

  return sendSuccess(
    res,
    200,
    'If an account with that email exists, a password reset link has been sent.',
    data
  );
});

/**
 * POST /api/auth/reset-password
 * Public — set a new password using a valid reset token.
 * Body: { token, password }
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const user = await authService.resetPassword(token, password);
  return sendSuccess(res, 200, 'Password has been reset successfully. Please log in.', {
    user,
  });
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

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  logout,
};
