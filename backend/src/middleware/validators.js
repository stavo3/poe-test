const { body, param, validationResult } = require('express-validator');
const { ALLOWED_ROLES } = require('../models/User');

// Access-control hardening: the 'admin' role can never be self-assigned through
// the public registration endpoint (admins are provisioned by seeding only).
const SELF_REGISTER_ROLES = ALLOWED_ROLES.filter((r) => r !== 'admin');
const { CATEGORIES } = require('../models/Gig');

const registerValidationRules = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email address is required.')
    .normalizeEmail(),
  body('password')
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      'Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.'
    ),
  body('role')
    .trim()
    .toLowerCase()
    .isIn(SELF_REGISTER_ROLES)
    .withMessage(`Role must be one of: ${SELF_REGISTER_ROLES.join(', ')}.`),
];

const loginValidationRules = [
  body('email').trim().isEmail().withMessage('A valid email address is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

const gigCreateValidationRules = [
  body('title').trim().isLength({ min: 3, max: 120 }).withMessage('Title must be 3-120 characters.'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be 10-2000 characters.'),
  body('category')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}.`),
  body('price').isFloat({ min: 1, max: 1000000 }).withMessage('Price must be a positive number.'),
  body('deliveryDays').isInt({ min: 1, max: 90 }).withMessage('Delivery days must be between 1 and 90.'),
];

const gigUpdateValidationRules = [
  body('title').optional().trim().isLength({ min: 3, max: 120 }).withMessage('Title must be 3-120 characters.'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be 10-2000 characters.'),
  body('category')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}.`),
  body('price').optional().isFloat({ min: 1, max: 1000000 }).withMessage('Price must be a positive number.'),
  body('deliveryDays').optional().isInt({ min: 1, max: 90 }).withMessage('Delivery days must be between 1 and 90.'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false.'),
];

const mongoIdParamRule = (paramName) =>
  param(paramName).isMongoId().withMessage(`${paramName} must be a valid identifier.`);

const bookingCreateValidationRules = [
  body('gigId').isMongoId().withMessage('A valid gigId is required.'),
  body('note').optional().trim().isLength({ max: 500 }).withMessage('Note must be at most 500 characters.'),
];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = {
  registerValidationRules,
  loginValidationRules,
  gigCreateValidationRules,
  gigUpdateValidationRules,
  bookingCreateValidationRules,
  mongoIdParamRule,
  validate,
};
