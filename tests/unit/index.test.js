const pkg = require('../../src/index');

describe('module exports', () => {
  test('exports createOAuthClient', () => {
    expect(typeof pkg.createOAuthClient).toBe('function');
  });

  test('exports createTokenStore', () => {
    expect(typeof pkg.createTokenStore).toBe('function');
  });

  test('does not export internal modules', () => {
    expect(pkg.createGoogleProvider).toBeUndefined();
    expect(pkg.createGithubProvider).toBeUndefined();
    expect(pkg.post).toBeUndefined();
    expect(pkg.validateProviderConfig).toBeUndefined();
    expect(pkg.sanitize).toBeUndefined();
  });
});
