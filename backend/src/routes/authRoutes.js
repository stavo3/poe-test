const express = require('express');
const { register, login, getProfile } = require('../controllers/authController');
const { registerValidationRules, loginValidationRules, validate } = require('../middleware/validators');
const { verifyToken } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
// Creates an Express router for authentication-related endpoints.
const router = express.Router();
// Defines the registration endpoint with rate limiting and request validation.
router.post('/register', authLimiter, registerValidationRules, validate, register);
router.post('/login', authLimiter, loginValidationRules, validate, login);

router.get('/profile', verifyToken, getProfile);

module.exports = router;

//REFERENCES
//Express.js (n.d.) ‘Express routing’. Express documentation.
//Available at: https://expressjs.com/en/guide/routing.html
//(Accessed: 12 October 2026).

//Express.js (n.d.) ‘Using middleware’. Express documentation.
//Available at: https://expressjs.com/en/guide/using-middleware.html
//(Accessed: 12 October 2026).
//OpenJS Foundation (n.d.) ‘Modules: CommonJS modules’.

//Node.js documentation.
//Available at: https://nodejs.org/api/modules.html
//(Accessed: 12 October 2026).
