const { validateEnv } = require('../../src/config/env');

describe('validateEnv', () => {
  const good = { MONGO_URI: 'mongodb://x', JWT_SECRET: 'a'.repeat(40) };

  it('accepts a complete configuration', () => {
    expect(validateEnv(good).errors).toEqual([]);
  });

  it('requires MONGO_URI and JWT_SECRET', () => {
    expect(validateEnv({}).errors).toHaveLength(2);
  });

  it('warns about a short secret in development', () => {
    const r = validateEnv({ ...good, JWT_SECRET: 'short' });
    expect(r.errors).toEqual([]);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('rejects a short secret in production', () => {
    const r = validateEnv({ ...good, JWT_SECRET: 'short', NODE_ENV: 'production' });
    expect(r.errors.length).toBeGreaterThan(0);
  });
});
