'use strict';
// Start-up configuration check ("fail fast").
// A mis-configured secret is one of the most common causes of broken
// authentication, so the API refuses to boot with an unsafe configuration
// in production and warns loudly in development.

const MIN_SECRET_LENGTH = 32;

function validateEnv(env = process.env) {
  const errors = [];
  const warnings = [];

  if (!env.MONGO_URI) {
    errors.push('MONGO_URI is not set.');
  }

  if (!env.JWT_SECRET) {
    errors.push('JWT_SECRET is not set.');
  } else if (env.JWT_SECRET.length < MIN_SECRET_LENGTH) {
    const msg = `JWT_SECRET is shorter than ${MIN_SECRET_LENGTH} characters (generate one with: openssl rand -hex 32).`;
    if (env.NODE_ENV === 'production') errors.push(msg);
    else warnings.push(msg);
  }

  if (env.NODE_ENV === 'production' && !env.CORS_ORIGIN) {
    warnings.push('CORS_ORIGIN is not set; every origin will be allowed.');
  }

  return { errors, warnings };
}

module.exports = { validateEnv, MIN_SECRET_LENGTH };
