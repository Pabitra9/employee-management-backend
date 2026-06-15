'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/** Allowed roles for role-based access control. */
const ROLES = ['admin', 'employee'];

/** How long a password-reset token stays valid. */
const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name must be at most 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // creates a unique index -> 409 on duplicates
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned by default queries
    },
    role: {
      type: String,
      enum: { values: ROLES, message: 'Role must be either admin or employee' },
      default: 'employee',
    },
    // Password reset: only the HASH of the token is stored (never the raw token).
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  {
    timestamps: true, // adds createdAt / updatedAt
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Hash the password before persisting, but only when it changed (so profile
 * updates that don't touch the password don't re-hash an already-hashed value).
 */
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

/**
 * Compare a plaintext candidate against the stored hash.
 * @param {string} candidate
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/**
 * Generate a password-reset token.
 *
 * Returns the RAW token (to be emailed to the user) while storing only its
 * SHA-256 hash on the document — so a leaked database cannot be used to reset
 * passwords. Caller must `save()` afterwards.
 *
 * @returns {string} the raw, un-hashed reset token
 */
userSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
  return rawToken;
};

const User = mongoose.model('User', userSchema);
User.ROLES = ROLES;

module.exports = User;
