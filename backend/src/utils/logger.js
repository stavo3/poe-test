'use strict';
// HustleHub+ logging & monitoring utility.
//
// Responsibilities
//  1. Human readable console output (picked up by `docker logs`).
//  2. Structured JSON-lines log files (logs/app.log, logs/security.log,
//     logs/access.log) so events can be searched, parsed and shipped.
//  3. In-memory counters of key security / business events that are exposed to
//     administrators through GET /api/monitoring/summary.
//  4. Automatic redaction of sensitive fields (passwords, tokens, secrets).
//  5. Optional cloud shipping of every record to Grafana Cloud Loki (cloudLogger.js).
//
// Behaviour can be tuned with environment variables:
//   LOG_DIR        directory for log files (default: <backend>/logs)
//   LOG_TO_FILE    "false" disables file logging (used by the unit tests)
//   LOG_SILENT     "true" disables console output (used by the unit tests)
//   LOG_MAX_BYTES  size at which a log file is rotated to <name>.1 (default 5 MB)

const fs = require('fs');
const path = require('path');
const cloudLogger = require('./cloudLogger');

const SENSITIVE_KEY = /pass(word)?|token|secret|authorization|cookie|hash/i;

const startedAt = new Date();

const METRIC_NAMES = [
  'loginSuccess',
  'loginFailure',
  'loginBlocked',
  'accountLockouts',
  'registrations',
  'bookingsCreated',
  'transactionsRecorded',
  'accessDenied',
  'tokenRejected',
  'errors',
];

// Maps audit event names to the metric counter they increment.
const EVENT_TO_METRIC = {
  login_success: 'loginSuccess',
  login_failure: 'loginFailure',
  login_blocked: 'loginBlocked',
  account_locked: 'accountLockouts',
  user_registered: 'registrations',
  booking_created: 'bookingsCreated',
  transaction_recorded: 'transactionsRecorded',
  access_denied: 'accessDenied',
  token_rejected: 'tokenRejected',
};

const metrics = {};
function resetMetrics() {
  METRIC_NAMES.forEach((name) => {
    metrics[name] = 0;
  });
}
resetMetrics();

function logDir() {
  return process.env.LOG_DIR || path.join(__dirname, '..', '..', 'logs');
}

function fileLoggingEnabled() {
  return process.env.LOG_TO_FILE !== 'false';
}

function consoleEnabled() {
  return process.env.LOG_SILENT !== 'true';
}

function timestamp() {
  return new Date().toISOString();
}

// Recursively replaces the value of sensitive keys so credentials can never
// end up in a log file, even if a developer logs a whole request body by mistake.
function redact(value, depth = 0) {
  if (depth > 4 || value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value)) {
      out[key] = SENSITIVE_KEY.test(key) ? '[REDACTED]' : redact(value[key], depth + 1);
    }
    return out;
  }
  return value;
}

// Masks an e-mail address so logs stay useful without storing full PII:
// "jane.doe@example.com" -> "j***@example.com"
function maskEmail(email) {
  if (typeof email !== 'string' || !email.includes('@')) return 'unknown';
  const [local, domain] = email.split('@');
  return `${local.charAt(0)}***@${domain}`;
}

// Extracts the correlation data (request id + client IP) from an Express request.
function reqMeta(req) {
  if (!req) return {};
  return { requestId: req.id, ip: req.ip };
}

function rotateIfNeeded(file) {
  const maxBytes = Number(process.env.LOG_MAX_BYTES) || 5 * 1024 * 1024;
  try {
    if (fs.statSync(file).size >= maxBytes) {
      fs.renameSync(file, `${file}.1`);
    }
  } catch (err) {
    // File does not exist yet - nothing to rotate.
  }
}

function writeFile(name, record) {
  // Cloud shipping (Grafana Loki) - no-op unless LOKI_* variables are set.
  cloudLogger.push(name.replace(/\.log$/, ''), record);
  if (!fileLoggingEnabled()) return;
  try {
    const dir = logDir();
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, name);
    rotateIfNeeded(file);
    fs.appendFileSync(file, `${JSON.stringify(record)}\n`);
  } catch (err) {
    // Logging must never crash the application.
  }
}

function toConsole(stream, label, message, meta) {
  if (!consoleEnabled()) return;
  const hasMeta = meta && Object.keys(meta).length > 0;
  stream(`[${label}] ${timestamp()} - ${message}`, hasMeta ? meta : '');
}

function info(message, meta = {}) {
  const safe = redact(meta);
  toConsole(console.log, 'INFO ', message, safe);
  writeFile('app.log', { timestamp: timestamp(), level: 'info', message, ...safe });
}

function warn(message, meta = {}) {
  const safe = redact(meta);
  toConsole(console.warn, 'WARN ', message, safe);
  writeFile('app.log', { timestamp: timestamp(), level: 'warn', message, ...safe });
}

function error(message, meta = {}) {
  const safe = redact(meta);
  metrics.errors += 1;
  toConsole(console.error, 'ERROR', message, safe);
  writeFile('app.log', { timestamp: timestamp(), level: 'error', message, ...safe });
}

// Security / business audit event, e.g. audit('login_failure', {reason: '...'}, 'warn').
// Written to logs/security.log and counted for the monitoring summary.
function audit(event, meta = {}, level = 'info') {
  const safe = redact(meta);
  const metric = EVENT_TO_METRIC[event];
  if (metric) metrics[metric] += 1;
  const label = level === 'warn' ? 'AUDIT-WARN' : 'AUDIT';
  toConsole(level === 'warn' ? console.warn : console.log, label, event, safe);
  writeFile('security.log', { timestamp: timestamp(), level, event, ...safe });
}

// HTTP access log line (fed by morgan).
function access(line) {
  if (consoleEnabled()) process.stdout.write(`[ACCESS] ${line}\n`);
  writeFile('access.log', { timestamp: timestamp(), line });
}

function getMetrics() {
  return {
    startedAt: startedAt.toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    counters: { ...metrics },
  };
}

module.exports = {
  info,
  warn,
  error,
  audit,
  access,
  getMetrics,
  resetMetrics,
  maskEmail,
  reqMeta,
  redact,
};
