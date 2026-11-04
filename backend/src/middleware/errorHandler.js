
const logger = require('../utils/logger');
// Imports the project's custom logging utility for recording errors.
// (Node.js, n.d.).

function notFound(req, res, next) {
  // Handles requests for routes or resources that do not exist.
  // Express middleware can process requests and send HTTP responses
  // (Express, n.d.-a).
  res.status(404).json({ message: 'Resource not found.' });
}

function errorHandler(err, req, res, next) {
  // Centralises error handling so errors can be logged and returned
  // through a consistent response format (Express, n.d.-b).
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack, // server-side log only; never sent to the client
    path: req.originalUrl,
    method: req.method,
    ...logger.reqMeta(req),
  });

  // body-parser errors (malformed JSON / oversized payload) are client errors.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON body.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large.' });
  }

  // Mongoose CastError: can occur when a supplied value cannot be
  // converted to the expected schema type, such as an invalid ObjectId.
  // (Mongoose, n.d.-a).
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid identifier supplied.' });
  }

  // Mongoose ValidationError: indicates that a document failed schema
  // validation (Mongoose, n.d.-b).
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Validation failed.' });
  }

  // MongoDB duplicate-key error: code 11000 commonly indicates a
  // uniqueness constraint violation (MongoDB, n.d.).
  if (err.code === 11000) {
    return res.status(409).json({ message: 'A record with this value already exists.' });
  }

  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;

  // Avoid exposing stack traces or sensitive internal implementation
  // details in client-facing error responses (OWASP Foundation, n.d.).
  res.status(statusCode).json({
    message: statusCode === 500 ? 'An unexpected error occurred.' : err.message,
  });
}

module.exports = { notFound, errorHandler };
// Exports the middleware functions so they can be registered in Express
// routes or the application configuration (Node.js, n.d.).

//References
//Express (n.d.-a) FAQ: Error handling and middleware. Available at: https://expressjs.com/en/guide/error-handling.html (Accessed: 12 October 2026).
//Express (n.d.-b) Using middleware. Available at: https://expressjs.com/en/guide/using-middleware.html (Accessed: 12 October 2026).
//MongoDB (n.d.) Error Codes. Available at: https://www.mongodb.com/docs/manual/reference/error-codes/ (Accessed: 7 October 2026).
//Mongoose (n.d.-a) Error: CastError. Available at: https://mongoosejs.com/docs/api/error.html (Accessed: 12 October 2026).
//Mongoose (n.d.-b) Validation. Available at: https://mongoosejs.com/docs/validation.html (Accessed: 12 October 2026).
//Node.js (n.d.) Modules: CommonJS modules. Available at: https://nodejs.org/api/modules.html (Accessed: 7 October 2026).
//OWASP Foundation (n.d.) Error Handling Cheat Sheet. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html (Accessed: 7 October 2026).
