'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Sign a JWT for an authenticated user.
 *
 * Payload shape (per spec): { id, email, role }.
 *
 * @param {{ id: string, email: string, role: string }} payload
 * @returns {string} Signed JWT.
 */
const generateToken = ({ id, email, role }) =>
  jwt.sign({ id, email, role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

/**
 * Verify and decode a JWT.
 * Throws JsonWebTokenError / TokenExpiredError on failure (handled centrally).
 *
 * @param {string} token
 * @returns {{ id: string, email: string, role: string, iat: number, exp: number }}
 */
const verifyToken = (token) => jwt.verify(token, env.jwtSecret);

module.exports = { generateToken, verifyToken };
