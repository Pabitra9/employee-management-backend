'use strict';

const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const tokenService = require('./token.service');

/**
 * Build the JWT payload from a user document. Single source of truth so the
 * payload shape ({ id, email, role }) stays consistent everywhere.
 */
const buildTokenPayload = (user) => ({
  id: user._id.toString(),
  email: user.email,
  role: user.role,
});

/**
 * Register a new user.
 *
 * @param {{ name: string, email: string, password: string, role?: string }} input
 * @returns {Promise<{ user: object, token: string }>}
 * @throws {ApiError} 409 if the email is already registered.
 */
const register = async ({ name, email, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'Email is already registered');
  }

  const user = await User.create({ name, email, password, role });
  const token = tokenService.generateToken(buildTokenPayload(user));

  return { user: user.toJSON(), token };
};

/**
 * Authenticate a user with email + password.
 *
 * @param {{ email: string, password: string }} input
 * @returns {Promise<{ user: object, token: string }>}
 * @throws {ApiError} 401 on bad credentials.
 */
const login = async ({ email, password }) => {
  // password is `select: false`, so request it explicitly for comparison.
  const user = await User.findOne({ email }).select('+password');

  // Same generic message whether the email or password is wrong (avoids
  // leaking which accounts exist).
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = tokenService.generateToken(buildTokenPayload(user));
  return { user: user.toJSON(), token };
};

/**
 * Fetch a user's profile by id.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 * @throws {ApiError} 404 if not found.
 */
const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user.toJSON();
};

/**
 * Update the caller's own profile (name and/or password).
 * Email and role are intentionally NOT updatable here.
 *
 * @param {string} userId
 * @param {{ name?: string, password?: string }} updates
 * @returns {Promise<object>}
 * @throws {ApiError} 404 if not found.
 */
const updateProfile = async (userId, { name, password }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (typeof name !== 'undefined') user.name = name;
  if (typeof password !== 'undefined') user.password = password; // re-hashed by pre-save hook

  await user.save();
  return user.toJSON();
};

module.exports = { register, login, getProfile, updateProfile };
