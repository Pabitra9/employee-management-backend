'use strict';

const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * Lazily-built SMTP transport. Only created when SMTP credentials are present;
 * otherwise we run in "dev mode" and log emails to the console instead.
 */
let transporter = null;
if (env.smtp.host && env.smtp.user) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure, // true for 465, false for 587/STARTTLS
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
  logger.info(`Email transport ready (SMTP ${env.smtp.host}:${env.smtp.port})`);
} else {
  logger.warn('SMTP not configured — password-reset emails will be logged, not sent.');
}

/**
 * Send an email, or log it if no SMTP transport is configured.
 *
 * @param {{ to: string, subject: string, text: string, html?: string }} message
 * @returns {Promise<{ delivered: boolean }>}
 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    logger.info(
      `\n----- DEV EMAIL (not actually sent) -----\n` +
        `To: ${to}\nSubject: ${subject}\n\n${text}\n` +
        `-----------------------------------------`
    );
    return { delivered: false };
  }

  await transporter.sendMail({ from: env.smtp.from, to, subject, text, html });
  logger.info(`Email sent to ${to}: ${subject}`);
  return { delivered: true };
};

/**
 * Send the password-reset email.
 *
 * @param {string} to       Recipient email.
 * @param {string} resetUrl Full reset link (points at the frontend).
 */
const sendPasswordResetEmail = (to, resetUrl) => {
  const subject = 'Reset your password';
  const text =
    `You requested a password reset.\n\n` +
    `Open this link to choose a new password (valid for 15 minutes):\n${resetUrl}\n\n` +
    `If you did not request this, you can safely ignore this email.`;
  const html =
    `<p>You requested a password reset.</p>` +
    `<p><a href="${resetUrl}">Click here to choose a new password</a> (valid for 15 minutes).</p>` +
    `<p>If you did not request this, you can safely ignore this email.</p>`;
  return sendEmail({ to, subject, text, html });
};

module.exports = { sendEmail, sendPasswordResetEmail };
