require('dotenv').config();
//Loads environment variables from a .env file into process.env
//(Motdotla, n.d.).
const mongoose = require('mongoose');
// Used by the health check to report the database connection state (Mongoose, n.d.).
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
//Imports Express middleware and supporting packages for HTTP security
//headers, cross-origin access and request logging
//(Express, n.d.; Helmet, n.d.; Express CORS, n.d.; Morgan, n.d.).
const authRoutes = require('./routes/authRoutes');
const gigRoutes = require('./routes/gigRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const monitoringRoutes = require('./routes/monitoringRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { xssSanitizer, noSqlSanitizer } = require('./middleware/sanitize');
const { generalLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');
const requestContext = require('./middleware/requestContext');
//Imports application-specific database, route, middleware and logging
//modules developed for the HustleHub+ project.
const app = express();

// When running behind a reverse proxy (the nginx container in docker-compose) the
// real client IP is read from X-Forwarded-For so rate limiting and audit logs
// refer to the actual client. TRUST_PROXY = number of proxy hops (0 = none).
const trustProxy = Number(process.env.TRUST_PROXY || 0);
if (trustProxy > 0) app.set('trust proxy', trustProxy);

// Assigns a unique id to every request for log correlation.
app.use(requestContext);

// Helmet configures HTTP security headers and supports custom Content
// Security Policy directives (Helmet, n.d.).
// The CSP below is configured for this API-only server.

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
  })
);

//Configures HTTP Strict Transport Security to tell browsers to prefer
//HTTPS for the specified period (Helmet, n.d.).
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));

//CORS middleware controls which browser origins may access responses.
//Credentialed requests require suitable origin configuration
//(Express CORS, n.d.).

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  })
);

// Parses incoming JSON request bodies and limits the body size
// to 10 kilobytes (Express, n.d.).
app.use(express.json({ limit: '10kb' }));

// Records incoming HTTP requests using Morgan. Each line carries the request id
// and is written to the access log through the project's logger (Morgan, n.d.).
morgan.token('id', (req) => req.id);
app.use(
  morgan(':remote-addr :method :url :status :res[content-length] - :response-time ms reqid=:id', {
    stream: { write: (line) => logger.access(line.trim()) },
  })
);

// These are custom application middleware functions.
// Input sanitisation should be combined with validation and safe
// database query construction to reduce injection risks
// (OWASP Foundation, n.d.-a; OWASP Foundation, n.d.-b).

app.use(noSqlSanitizer); // Custom NoSQL input sanitisation middleware.
app.use(xssSanitizer);   // Custom XSS input sanitisation middleware.

// The generalLimiter is custom project middleware that applies
// request-rate limits to reduce excessive requests.

app.use(generalLimiter);

app.get('/api/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'degraded',
    database: dbConnected ? 'connected' : 'disconnected',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});
// Defines an Express GET endpoint that returns a JSON health response
// (Express, n.d.).

app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/monitoring', monitoringRoutes);
// Mounts route middleware at specific URL prefixes
// (Express, n.d.).

// Registers custom not-found and error-handling middleware.
// Express documents the use of middleware to handle unmatched routes
// and errors (Express, n.d.; Express, n.d.-b).
app.use(notFound);
app.use(errorHandler);

//Exports the Express application for importing or testing in other
//modules (Node.js, n.d.-d).
module.exports = app;

//References
//Express (n.d.-a) Using middleware. Available at: https://expressjs.com/en/guide/using-middleware.html (Accessed: 7 October 2026).
//Express (n.d.-b) Error handling. Available at: https://expressjs.com/en/guide/error-handling.html (Accessed: 7 October 2026).
//Express CORS (n.d.) cors: Node.js CORS middleware. Available at: https://github.com/expressjs/cors (Accessed: 7 October 2026).
//Helmet (n.d.) Helmet.js. Available at: https://helmet.js.org/ (Accessed: 7 October 2026).
//Morgan (n.d.) Morgan: HTTP request logger middleware for Node.js. Available at: https://www.npmjs.com/package/morgan (Accessed: 7 October 2026).
//Motdotla (n.d.) dotenv. Available at: https://www.npmjs.com/package/dotenv (Accessed: 7 October 2026).
//Node.js (n.d.-a) File system. Available at: https://nodejs.org/api/fs.html (Accessed: 7 October 2026).
//Node.js (n.d.-b) Process. Available at: https://nodejs.org/api/process.html (Accessed: 7 October 2026).
//Node.js (n.d.-c) HTTPS. Available at: https://nodejs.org/api/https.html (Accessed: 7 October 2026).
//Node.js (n.d.-d) Modules: CommonJS modules. Available at: https://nodejs.org/api/modules.html (Accessed: 7 October 2026).
//OWASP Foundation (n.d.-a) Cross Site Scripting Prevention Cheat Sheet. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html (Accessed: 12 October 2026).
//OWASP Foundation (n.d.-b) NoSQL Security Cheat Sheet. Available at: https://cheatsheetseries.owasp.org/cheatsheets/NoSQL_Security_Cheat_Sheet.html (Accessed: 7 October 2026).
//Mongoose (n.d.) Connections. Available at: https://mongoosejs.com/docs/connections.html (Accessed: 15 October 2026).
