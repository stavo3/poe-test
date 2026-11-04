'use strict';
// Assigns every request a unique id (returned in the X-Request-Id header and
// included in log lines) so a single request can be traced across the access
// log, security log and error log.
const crypto = require('crypto');

function requestContext(req, res, next) {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}

module.exports = requestContext;
