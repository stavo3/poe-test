const bcrypt = require('bcrypt');
// Imports bcrypt to hash passwords and compare submitted passwords
// against stored password hashes (bcrypt, n.d.).

const jwt = require('jsonwebtoken');
// Imports JSON Web Token functionality for generating authentication
// tokens (Auth0, n.d.).

const { User } = require('../models/User');
const logger = require('../utils/logger');
// Imports the project's User model and custom logging utility.

const SALT_ROUNDS = 12;

// Account lockout settings (read at call time so they can be tuned per environment).
const maxAttempts = () => Number(process.env.LOGIN_MAX_ATTEMPTS) || 5;
const lockoutMinutes = () => Number(process.env.LOCKOUT_MINUTES) || 15;

// A real bcrypt hash is computed once and compared against when the e-mail is
// unknown, so "unknown e-mail" and "wrong password" take the same time and an
// attacker cannot enumerate registered accounts by measuring response times.
let dummyHashPromise;
function getDummyHash() {
  if (!dummyHashPromise) dummyHashPromise = bcrypt.hash('hustlehub-dummy-password', SALT_ROUNDS);
  return dummyHashPromise;
}
// Defines the work factor used when hashing passwords with bcrypt
// (bcrypt, n.d.).

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
  // Signs a JWT containing selected user claims, using a secret
  // and an expiry setting (Auth0, n.d.).
}

async function register(req, res, next) {
  try {
    const { email, password, role } = req.body;
    // Extracts registration information from the incoming request.

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    // Checks whether an account already exists using a Mongoose query
    // (Mongoose, n.d.).

    if (existingUser) {
      return res.status(409).json({
        message: 'An account with this email already exists.'
      });
      // Returns HTTP 409 when the email is already registered.
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    // Hashes the password before storage rather than storing plaintext
    // (bcrypt, n.d.; OWASP Foundation, n.d.).

    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      role
    });
    // Creates a user document in MongoDB using the User model
    // (Mongoose, n.d.).

    logger.audit('user_registered', {
      userId: user._id.toString(),
      role: user.role,
      ...logger.reqMeta(req),
    });
    // Records successful registration using the project's logger.

    return res.status(201).json({
      message: 'Registration successful.',
      user: user.toJSON(),
    });
    // Returns an HTTP 201 response and the JSON representation
    // of the newly created user.
  } catch (err) {
    next(err);
    // Passes errors to Express error-handling middleware
    // (Express, n.d.).
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    // Extracts the supplied login credentials.

    // passwordHash has select:false on the schema, so it must be explicitly requested.
    const user = await User.findOne({
      email: email.toLowerCase()
    }).select('+passwordHash +failedLoginAttempts +lockUntil');
    // Queries MongoDB and explicitly includes the normally excluded
    // passwordHash field (Mongoose, n.d.).

    if (!user) {
      // Constant-time style response: still run a bcrypt comparison (OWASP Foundation, n.d.).
      await bcrypt.compare(password, await getDummyHash());
      logger.audit('login_failure', { reason: 'unknown_email', email: logger.maskEmail(email), ...logger.reqMeta(req) }, 'warn');
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
      // Returns a generic authentication error.
    }

    // Security feature: temporary account lockout after repeated failed logins.
    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      logger.audit('login_blocked', { reason: 'account_locked', userId: user._id.toString(), ...logger.reqMeta(req) }, 'warn');
      return res.status(423).json({
        message: `Account temporarily locked after repeated failed logins. Try again in ${minutesLeft} minute(s).`
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );
    // Compares the submitted password with the stored hash
    // (bcrypt, n.d.).

    if (!passwordMatches) {
      // An expired lock starts a fresh count of failed attempts.
      const expired = user.lockUntil && user.lockUntil <= new Date();
      const attempts = (expired ? 0 : user.failedLoginAttempts || 0) + 1;
      const update = { failedLoginAttempts: attempts };
      if (expired) update.$unset = { lockUntil: 1 };

      let locked = false;
      if (attempts >= maxAttempts()) {
        locked = true;
        update.failedLoginAttempts = 0;
        update.lockUntil = new Date(Date.now() + lockoutMinutes() * 60000);
        delete update.$unset;
      }

      await User.updateOne({ _id: user._id }, update);

      logger.audit(
        'login_failure',
        { reason: 'wrong_password', userId: user._id.toString(), attempts, ...logger.reqMeta(req) },
        'warn'
      );

      if (locked) {
        logger.audit(
          'account_locked',
          { userId: user._id.toString(), lockoutMinutes: lockoutMinutes(), ...logger.reqMeta(req) },
          'warn'
        );
      }

      return res.status(401).json({
        message: 'Invalid email or password.'
      });
      // Uses the same error message for unknown users and incorrect
      // passwords to avoid revealing which emails are registered.
    }

    // A successful login clears any previous failed-attempt state.
    if (user.failedLoginAttempts || user.lockUntil) {
      await User.updateOne(
        { _id: user._id },
        { failedLoginAttempts: 0, $unset: { lockUntil: 1 } }
      );
    }

    const token = signToken(user);
    // Generates a signed JWT after successful authentication
    // (Auth0, n.d.).

    logger.audit('login_success', {
      userId: user._id.toString(),
      role: user.role,
      ...logger.reqMeta(req),
    });
    // Records the successful login without logging the password.

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: user.toJSON(),
    });
    // Returns the JWT and user information in the response.
  } catch (err) {
    next(err);
    // Passes unexpected errors to Express error-handling middleware
    // (Express, n.d.).
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    // Retrieves a user document by its MongoDB identifier
    // (Mongoose, n.d.).

    if (!user) {
      return res.status(404).json({
        message: 'User not found.'
      });
      // Returns HTTP 404 when the requested user does not exist.
    }

    return res.status(200).json({
      user: user.toJSON()
    });
    // Returns the user's JSON representation.
  } catch (err) {
    next(err);
    // Forwards errors to Express error-handling middleware
    // (Express, n.d.).
  }
}

module.exports = { register, login, getProfile };
//Exports the controller functions so they can be used by route modules
//(Node.js, n.d.).

//References
//Auth0 (n.d.) jsonwebtoken: JSON Web Token implementation for Node.js. Available at: https://github.com/auth0/node-jsonwebtoken (Accessed: 12 October 2026).
//bcrypt (n.d.) bcrypt: A library to help you hash passwords. Available at: https://github.com/kelektiv/node.bcrypt.js (Accessed: 12 October 2026).
//Express (n.d.) Error handling. Available at: https://expressjs.com/en/guide/error-handling.html (Accessed: 7 October 2026).
//Mongoose (n.d.) Queries. Available at: https://mongoosejs.com/docs/queries.html (Accessed: 7 October 2026).
//Node.js (n.d.) Modules: CommonJS modules. Available at: https://nodejs.org/api/modules.html (Accessed: 7 October 2026).
//OWASP Foundation (n.d.) Authentication Cheat Sheet. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html (Accessed: 15 October 2026).
//OWASP Foundation (n.d.) Password Storage Cheat Sheet. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html (Accessed: 7 October 2026).
