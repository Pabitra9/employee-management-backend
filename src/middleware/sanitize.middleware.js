'use strict';

const { filterXSS } = require('xss');

/**
 * Recursively strip XSS payloads (e.g. <script>...) from request input.
 *
 * We use the maintained `xss` library instead of the deprecated `xss-clean`
 * package. Only string values are filtered; object/array structures are walked
 * in place so the sanitized data is what controllers and Mongoose receive.
 *
 * @param {*} value
 * @returns {*}
 */
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return filterXSS(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      value[key] = sanitizeValue(value[key]);
    }
    return value;
  }
  return value;
};

/**
 * Express middleware that sanitizes body, query, and route params.
 *
 * Note: `req.query` is reassigned property-by-property rather than wholesale to
 * stay compatible across Express versions where the object may be read-only.
 */
const xssSanitizer = (req, res, next) => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.params) req.params = sanitizeValue(req.params);
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      req.query[key] = sanitizeValue(req.query[key]);
    }
  }
  next();
};

module.exports = xssSanitizer;
