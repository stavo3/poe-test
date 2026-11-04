// Monitoring routes (admin only).
// GET /api/monitoring/summary returns uptime, database state and counters for
// the key security / business events recorded in the audit log.
const express = require('express');
const mongoose = require('mongoose');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/summary', verifyToken, requireRole('admin'), (req, res) => {
  res.status(200).json({
    ...logger.getMetrics(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    nodeVersion: process.version,
  });
});

module.exports = router;
