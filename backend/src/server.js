require('dotenv').config();
// Loads environment variables from a .env file into process.env
// (Motdotla, n.d.).
const fs = require('fs');
const path = require('path');
const https = require('https');
const mongoose = require('mongoose');
// Node.js built-in modules for file access, paths and HTTPS (Node.js, n.d.-a; Node.js, n.d.-b).

const app = require('./app');
const connectDB = require('./config/db');
const { validateEnv } = require('./config/env');
const logger = require('./utils/logger');
const cloudLogger = require('./utils/cloudLogger');
// The Express application lives in app.js so it can be imported by the automated
// tests without opening a network port; this file only boots the HTTPS server.

const PORT = process.env.PORT || 5000;

const keyPath = path.join(__dirname, '..', 'certs', 'key.pem');
const certPath = path.join(__dirname, '..', 'certs', 'cert.pem');

async function start() {
  // Security feature: fail fast on an unsafe/missing configuration.
  const { errors, warnings } = validateEnv();
  warnings.forEach((w) => logger.warn(`Configuration warning: ${w}`));
  if (errors.length) {
    errors.forEach((e) => logger.error(`Configuration error: ${e}`));
    process.exit(1);
  }

  logger.info(
    cloudLogger.isEnabled()
      ? 'Cloud logging enabled (Grafana Cloud Loki)'
      : 'Cloud logging disabled (set LOKI_URL, LOKI_USER and LOKI_API_KEY to enable)'
  );

  await connectDB();

  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    logger.error(
      'SSL certificate/key not found in /certs. Generate one first, e.g.:\n' +
        '  openssl req -nodes -new -x509 -keyout certs/key.pem -out certs/cert.pem -days 365'
    );
    process.exit(1);
  }

  const sslOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };

  const server = https.createServer(sslOptions, app).listen(PORT, () => {
    logger.info(`HustleHub+ API running on https://localhost:${PORT}`);
  });

  // Graceful shutdown so `docker stop` / Ctrl+C closes connections cleanly.
  const shutdown = (signal) => {
    logger.info(`${signal} received - shutting down`);
    server.close(async () => {
      await cloudLogger.flush(); // send any buffered log lines before exiting
      await mongoose.connection.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Only start listening when run directly (`node src/server.js`), not when imported.
if (require.main === module) {
  start();
}

module.exports = app;

//References
//Node.js (n.d.-a) File system. Available at: https://nodejs.org/api/fs.html (Accessed: 15 October 2026).
//Node.js (n.d.-b) HTTPS. Available at: https://nodejs.org/api/https.html (Accessed: 15 October 2026).
//Node.js (n.d.-c) Process signals. Available at: https://nodejs.org/api/process.html#signal-events (Accessed: 15 October 2026).
//Motdotla (n.d.) dotenv. Available at: https://www.npmjs.com/package/dotenv (Accessed: 15 October 2026).
