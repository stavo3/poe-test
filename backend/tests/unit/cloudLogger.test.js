'use strict';
const cloud = require('../../src/utils/cloudLogger');
const logger = require('../../src/utils/logger');

describe('cloud logging (Grafana Loki shipper)', () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    cloud.resetForTests();
    process.env.LOKI_URL = 'https://loki.example.test/loki/api/v1/push';
    process.env.LOKI_USER = '12345';
    process.env.LOKI_API_KEY = 'glc_test_key';
    process.env.LOKI_ENV = 'test';
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    delete process.env.LOKI_URL;
    delete process.env.LOKI_USER;
    delete process.env.LOKI_API_KEY;
    delete process.env.LOKI_ENV;
    global.fetch = realFetch;
    cloud.resetForTests();
  });

  test('does nothing when the LOKI_* variables are not set', async () => {
    delete process.env.LOKI_URL;
    cloud.push('security', { event: 'login_success' });
    await cloud.flush();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(cloud.isEnabled()).toBe(false);
  });

  test('pushes a batch to Loki with basic auth and low-cardinality labels', async () => {
    cloud.push('security', { event: 'login_failure' });
    cloud.push('app', { level: 'error', message: 'boom' });
    await cloud.flush();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://loki.example.test/loki/api/v1/push');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe(
      `Basic ${Buffer.from('12345:glc_test_key').toString('base64')}`
    );

    const body = JSON.parse(options.body);
    const types = body.streams.map((s) => s.stream.log_type).sort();
    expect(types).toEqual(['app', 'security']);
    body.streams.forEach((s) => {
      expect(s.stream.app).toBe('hustlehub-api');
      expect(s.stream.env).toBe('test');
      expect(s.values[0][0]).toMatch(/^\d{19}$/); // nanosecond timestamp
    });
    expect(cloud.getStats().sent).toBe(2);
  });

  test('never ships credentials: logger redacts before shipping', async () => {
    logger.audit('login_failure', { password: 'SuperSecret1!', token: 'abc.def.ghi', reason: 'wrong_password' }, 'warn');
    await cloud.flush();

    const sent = global.fetch.mock.calls[0][1].body;
    expect(sent).not.toContain('SuperSecret1!');
    expect(sent).not.toContain('abc.def.ghi');
    expect(sent).toContain('[REDACTED]');
    expect(sent).toContain('login_failure');
  });

  test('a failing or unreachable Loki never throws into the application', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
    cloud.push('app', { message: 'x' });
    await expect(cloud.flush()).resolves.toBeUndefined();
    expect(cloud.getStats().failed).toBe(1);

    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 });
    cloud.push('app', { message: 'y' });
    await cloud.flush();
    expect(cloud.getStats().failed).toBe(2);
  });
});
