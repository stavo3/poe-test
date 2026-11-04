// Runs before each test file: configures a safe, isolated test environment.
process.env.NODE_ENV = 'test';
// Random per run - no secret is stored in the repository.
process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.JWT_EXPIRES_IN = '1h';
process.env.AUTH_RATE_LIMIT_MAX = '1000';
process.env.BOOKING_RATE_LIMIT_MAX = '1000';
process.env.LOGIN_MAX_ATTEMPTS = '3';
process.env.LOCKOUT_MINUTES = '15';
process.env.LOG_TO_FILE = 'false';
process.env.LOG_SILENT = 'true';
process.env.MONGO_URI_TEST =
  process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/hustlehub_test';
