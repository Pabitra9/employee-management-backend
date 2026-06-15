'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const xssSanitizer = require('./middleware/sanitize.middleware');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

/* -------------------------------------------------------------------------- */
/* Core / proxy                                                               */
/* -------------------------------------------------------------------------- */
// Trust the first proxy hop so rate-limiting & req.ip work behind a load
// balancer / reverse proxy (Heroku, Nginx, etc.).
app.set('trust proxy', 1);

/* -------------------------------------------------------------------------- */
/* Security middleware                                                         */
/* -------------------------------------------------------------------------- */
// Secure HTTP headers.
app.use(helmet());

// CORS — allow-all in dev, or a configured allow-list of origins.
const corsOptions =
  env.clientUrl === '*'
    ? { origin: '*' }
    : {
        origin: env.clientUrl.split(',').map((o) => o.trim()),
        credentials: true,
      };
app.use(cors(corsOptions));

// Global rate limit: 100 requests / 15 min / IP.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
  })
);

/* -------------------------------------------------------------------------- */
/* Body parsing                                                               */
/* -------------------------------------------------------------------------- */
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/* -------------------------------------------------------------------------- */
/* Input sanitization (run AFTER body parsing)                                */
/* -------------------------------------------------------------------------- */
// Strip `$`/`.` operators to prevent NoSQL/MongoDB injection.
app.use(mongoSanitize());
// Strip XSS payloads from string inputs.
app.use(xssSanitizer);

/* -------------------------------------------------------------------------- */
/* Request logging                                                            */
/* -------------------------------------------------------------------------- */
if (!env.isProduction) {
  app.use(morgan('dev'));
}

/* -------------------------------------------------------------------------- */
/* API documentation                                                          */
/* -------------------------------------------------------------------------- */
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { customSiteTitle: 'Employee Management API Docs' })
);

/* -------------------------------------------------------------------------- */
/* Routes                                                                      */
/* -------------------------------------------------------------------------- */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Employee Management API',
    data: { docs: '/api-docs', health: '/api/health' },
  });
});

app.use('/api', routes);

/* -------------------------------------------------------------------------- */
/* Error handling (must be last)                                              */
/* -------------------------------------------------------------------------- */
app.use(notFound);
app.use(errorHandler);

module.exports = app;
