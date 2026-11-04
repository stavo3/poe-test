const rateLimit = require('express-rate-limit');

// Applied to /api/auth/register and /api/auth/login.
// Tight limit to slow down credential stuffing / brute force attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // Default 10. Can be raised via AUTH_RATE_LIMIT_MAX so the full automated
  // API test run (which makes >10 auth requests) isn't throttled.
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again later.' },
});

// Applied to booking creation. Prevents booking-spam / gig-scraping abuse.
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: Number(process.env.BOOKING_RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many booking requests. Please try again later.' },
});

// General baseline limiter applied to the whole API as defence in depth.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
});

module.exports = { authLimiter, bookingLimiter, generalLimiter };
