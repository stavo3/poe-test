

const express = require('express');
const {
  createBooking,
  getMyBookings,
  getFreelancerBookings,
  getFreelancerIncome,
  getFreelancerTaxSummary,
} = require('../controllers/bookingController');
const { bookingCreateValidationRules, validate } = require('../middleware/validators');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { bookingLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Client-only: create a booking (rate limited — sensitive/abusable action)
router.post(
  '/',
  verifyToken,
  requireRole('client'),
  bookingLimiter,
  bookingCreateValidationRules,
  validate,
  createBooking
);

// Client-only: bookings they made
router.get('/mine', verifyToken, requireRole('client'), getMyBookings);

// Freelancer-only: bookings received against their gigs
router.get('/freelancer', verifyToken, requireRole('freelancer'), getFreelancerBookings);

// Freelancer-only: income generated from bookings
router.get('/freelancer/income', verifyToken, requireRole('freelancer'), getFreelancerIncome);

// Freelancer-only: income + estimated tax summary for the dashboard
router.get('/freelancer/tax-summary', verifyToken, requireRole('freelancer'), getFreelancerTaxSummary);

module.exports = router;

// REFERENCES
// Express.js (n.d.) ‘Express routing’. Express documentation. Available at: https://expressjs.com/en/guide/routing.html (Accessed: 12 October 2026).
// Express.js (n.d.) ‘Using middleware’. Express documentation. Available at: https://expressjs.com/en/guide/using-middleware.html (Accessed: 12 October 2026).
// OpenJS Foundation (n.d.) ‘Modules: CommonJS modules’. Node.js documentation. Available at: https://nodejs.org/api/modules.html (Accessed: 12 October 2026).
// express-validator (n.d.) ‘Validation Chain API’. Available at: https://express-validator.github.io/docs/api/validation-chain/ (Accessed: 12 October 2026)
