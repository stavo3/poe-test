const fs = require('fs');
const os = require('os');
const path = require('path');

describe('logger', () => {
  let dir;
  let logger;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hh-logs-'));
    process.env.LOG_DIR = dir;
    process.env.LOG_TO_FILE = 'true';
    process.env.LOG_SILENT = 'true';
    jest.resetModules();
    logger = require('../../src/utils/logger');
  });

  afterEach(() => {
    process.env.LOG_TO_FILE = 'false';
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const readLines = (file) =>
    fs
      .readFileSync(path.join(dir, file), 'utf8')
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l));

  it('writes audit events as JSON lines to security.log', () => {
    logger.audit('login_failure', { reason: 'wrong_password' }, 'warn');
    const [entry] = readLines('security.log');
    expect(entry.event).toBe('login_failure');
    expect(entry.level).toBe('warn');
    expect(entry.reason).toBe('wrong_password');
    expect(entry.timestamp).toBeDefined();
  });

  it('redacts passwords, tokens and secrets', () => {
    logger.audit('test', { password: 'hunter2', nested: { token: 'abc', ok: 1 }, authorization: 'Bearer x' });
    const [entry] = readLines('security.log');
    expect(entry.password).toBe('[REDACTED]');
    expect(entry.nested.token).toBe('[REDACTED]');
    expect(entry.nested.ok).toBe(1);
    expect(entry.authorization).toBe('[REDACTED]');
  });

  it('writes info/warn/error to app.log and counts errors', () => {
    logger.info('hello');
    logger.warn('careful');
    logger.error('boom', { code: 1 });
    const lines = readLines('app.log');
    expect(lines.map((l) => l.level)).toEqual(['info', 'warn', 'error']);
    expect(logger.getMetrics().counters.errors).toBe(1);
  });

  it('increments monitoring counters for audit events', () => {
    logger.audit('login_success');
    logger.audit('login_failure');
    logger.audit('login_failure');
    logger.audit('booking_created');
    const { counters } = logger.getMetrics();
    expect(counters.loginSuccess).toBe(1);
    expect(counters.loginFailure).toBe(2);
    expect(counters.bookingsCreated).toBe(1);
  });

  it('masks e-mail addresses', () => {
    expect(logger.maskEmail('jane.doe@example.com')).toBe('j***@example.com');
    expect(logger.maskEmail('not-an-email')).toBe('unknown');
  });

  it('does not write files when file logging is disabled', () => {
    process.env.LOG_TO_FILE = 'false';
    logger.info('nothing should be written');
    expect(fs.existsSync(path.join(dir, 'app.log'))).toBe(false);
  });
});
