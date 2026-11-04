const express = require('express');
const {
  createGig,
  getGigs,
  getMyGigs,
  getGigById,
  updateGig,
  deleteGig,
} = require('../controllers/gigController');
const {
  gigCreateValidationRules,
  gigUpdateValidationRules,
  mongoIdParamRule,
  validate,
} = require('../middleware/validators');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Public browsing — no auth required
router.get('/', getGigs);

// Must come before /:id so "mine" is not parsed as a gig id
router.get('/mine', verifyToken, requireRole('freelancer'), getMyGigs);

router.get('/:id', mongoIdParamRule('id'), validate, getGigById);

// Freelancer-only, ownership re-checked in the controller for update/delete
router.post('/', verifyToken, requireRole('freelancer'), gigCreateValidationRules, validate, createGig);

router.put(
  '/:id',
  verifyToken,
  requireRole('freelancer'),
  mongoIdParamRule('id'),
  gigUpdateValidationRules,
  validate,
  updateGig
);

router.delete('/:id', verifyToken, requireRole('freelancer'), mongoIdParamRule('id'), validate, deleteGig);

module.exports = router;

// REFERENCES
// Express.js (n.d.) ‘Express routing’. Express documentation. Available at: https://expressjs.com/en/guide/routing.html (Accessed: 12 October 2026).
// Express.js (n.d.) ‘Using middleware’. Express documentation. Available at: https://expressjs.com/en/guide/using-middleware.html (Accessed: 12 October 2026).
// OpenJS Foundation (n.d.) ‘Modules: CommonJS modules’. Node.js documentation. Available at: https://nodejs.org/api/modules.html (Accessed: 12 October 2026).
// express-validator (n.d.) ‘Validation Chain API’. Available at: https://express-validator.github.io/docs/api/validation-chain/ (Accessed: 12 October 2026).
// MongoDB, Inc. (n.d.) ‘ObjectId’. MongoDB Manual. Available at: https://www.mongodb.com/docs/manual/reference/method/ObjectId/ (Accessed: 12 October 2026)
