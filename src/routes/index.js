'use strict';

const express = require('express');

const authRoutes = require('./auth.routes');
const employeeRoutes = require('./employee.routes');

const router = express.Router();

/**
 * Liveness/health probe — handy for load balancers and uptime checks.
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    data: { uptime: process.uptime(), timestamp: new Date().toISOString() },
  });
});

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);

module.exports = router;
