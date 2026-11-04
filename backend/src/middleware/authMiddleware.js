
const jwt = require('jsonwebtoken');
// Imports JSON Web Token functionality to verify authentication tokens
// (Auth0, n.d.).

const logger = require('../utils/logger');
// Imports the project's custom logging utility.

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  // Retrieves the Authorization header from the HTTP request
  // (MDN Web Docs, n.d.-a).

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.audit('token_rejected', { reason: 'missing_or_malformed', path: req.originalUrl, ...logger.reqMeta(req) }, 'warn');
    return res.status(401).json({
      message: 'Authentication token missing or malformed.'
    });
    // Returns HTTP 401 when the expected Bearer token is missing
    // or incorrectly formatted.
  }

  const token = authHeader.split(' ')[1];
  // Extracts the token from the Bearer Authorization header.

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Verifies the JWT signature and checks its validity, including
    // its expiration when an exp claim is present (Auth0, n.d.).

    req.user = decoded; // { id, email, role, iat, exp }
    // Attaches the verified token payload to the request so that
    // subsequent middleware and route handlers can access it.

    next();
    // Passes control to the next middleware or route handler
    // (Express, n.d.).
  } catch (err) {
    logger.audit('token_rejected', {
      reason: err.message,
      path: req.originalUrl,
      ...logger.reqMeta(req),
    }, 'warn');
    // Logs the verification failure using the project's logger.
    // Avoid logging the complete token or other sensitive credentials.

    return res.status(401).json({
      message: 'Invalid or expired token.'
    });
    // Returns HTTP 401 if token verification fails.
  }
}

function requireRole(...allowedRoles) {
  // Accepts a list of roles permitted to access a protected route.
  // Role-based authorization is an access-control technique
  // (OWASP Foundation, n.d.).

  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      logger.audit('access_denied', {
        userId: req.user && req.user.id,
        role: req.user && req.user.role,
        required: allowedRoles,
        path: req.originalUrl,
        method: req.method,
        ...logger.reqMeta(req),
      }, 'warn');
      return res.status(403).json({
        message: 'You do not have permission to access this resource.'
      });
      // Returns HTTP 403 when the authenticated user does not have
      // an allowed role.
    }

    next();
    // Allows the request to continue when the role is permitted
    // (Express, n.d.).
  };
}

module.exports = { verifyToken, requireRole };
// Exports the middleware functions for use in route definitions
// (Node.js, n.d.).


//References
//Auth0 (n.d.) jsonwebtoken: JSON Web Token implementation for Node.js. Available at: https://github.com/auth0/node-jsonwebtoken (Accessed: 12 October 2026).
//Express (n.d.) Using middleware. Available at: https://expressjs.com/en/guide/using-middleware.html (Accessed: 7 October 2026).
//MDN Web Docs (n.d.-a) Authorization header. Available at: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization (Accessed: 7 October 2026).
//Node.js (n.d.) Modules: CommonJS modules. Available at: https://nodejs.org/api/modules.html (Accessed: 7 October 2026).
//OWASP Foundation (n.d.) Authorization Cheat Sheet. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html (Accessed: 7 October 2026).
