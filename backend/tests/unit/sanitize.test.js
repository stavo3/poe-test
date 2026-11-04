const { xssSanitizer } = require('../../src/middleware/sanitize');

describe('xssSanitizer', () => {
  const run = (body) => {
    const req = { body, params: {}, query: {} };
    xssSanitizer(req, {}, () => {});
    return req.body;
  };

  it('removes script tags and their content', () => {
    expect(run({ title: 'Hi<script>alert(1)</script> there' }).title).toBe('Hi there');
  });

  it('strips HTML tags and event-handler attributes', () => {
    const out = run({ note: '<img src=x onerror=alert(1)>Hello' });
    expect(out.note).not.toContain('onerror');
    expect(out.note).not.toContain('<img');
  });

  it('sanitises nested values and leaves safe text alone', () => {
    const out = run({ a: { b: ['<b>x</b>', 'plain text'] } });
    expect(out.a.b[0]).not.toContain('<b>');
    expect(out.a.b[1]).toBe('plain text');
  });
});
