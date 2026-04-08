const { sanitize, enforceHttps } = require('../../src/utils/http');

describe('enforceHttps', () => {
  test('allows HTTPS URLs', () => {
    expect(() => enforceHttps('https://example.com')).not.toThrow();
  });

  test('rejects HTTP URLs', () => {
    expect(() => enforceHttps('http://example.com')).toThrow('Only HTTPS URLs are allowed');
  });

  test('rejects FTP URLs', () => {
    expect(() => enforceHttps('ftp://example.com')).toThrow('Only HTTPS URLs are allowed');
  });
});

describe('sanitize', () => {
  test('redacts client_secret', () => {
    const result = sanitize({ client_secret: 'my-secret', error: 'bad' });
    expect(result.client_secret).toBe('[REDACTED]');
    expect(result.error).toBe('bad');
  });

  test('redacts access_token', () => {
    const result = sanitize({ access_token: 'token-123' });
    expect(result.access_token).toBe('[REDACTED]');
  });

  test('redacts refresh_token', () => {
    const result = sanitize({ refresh_token: 'refresh-123' });
    expect(result.refresh_token).toBe('[REDACTED]');
  });

  test('returns strings as-is', () => {
    expect(sanitize('error message')).toBe('error message');
  });

  test('returns null as-is', () => {
    expect(sanitize(null)).toBeNull();
  });

  test('does not modify original object', () => {
    const original = { client_secret: 'secret', name: 'test' };
    sanitize(original);
    expect(original.client_secret).toBe('secret');
  });
});
