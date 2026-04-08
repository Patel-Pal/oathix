const { createGoogleProvider } = require('../../src/providers/google');

const validConfig = {
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  redirectUri: 'http://localhost:3000/callback',
};

describe('getAuthUrl', () => {
  test('returns URL with default scope', () => {
    const provider = createGoogleProvider(validConfig);
    const url = provider.getAuthUrl();

    expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url).toContain('client_id=test-client-id');
    expect(url).toContain('redirect_uri=');
    expect(url).toContain('response_type=code');
    expect(url).toContain('scope=profile+email');
  });

  test('includes custom scope', () => {
    const provider = createGoogleProvider(validConfig);
    const url = provider.getAuthUrl({ scope: 'openid' });
    expect(url).toContain('scope=openid');
    expect(url).not.toContain('scope=profile');
  });

  test('includes custom state', () => {
    const provider = createGoogleProvider(validConfig);
    const url = provider.getAuthUrl({ state: 'my-state' });
    expect(url).toContain('state=my-state');
  });

  test('auto-generates state when not provided', () => {
    const provider = createGoogleProvider(validConfig);
    const url = provider.getAuthUrl();
    expect(url).toContain('state=');
  });

  test('returns a string', () => {
    const provider = createGoogleProvider(validConfig);
    expect(typeof provider.getAuthUrl()).toBe('string');
  });
});

describe('getToken', () => {
  test('throws for missing code', async () => {
    const provider = createGoogleProvider(validConfig);
    await expect(provider.getToken()).rejects.toThrow('Authorization code is required');
  });

  test('throws for empty string code', async () => {
    const provider = createGoogleProvider(validConfig);
    await expect(provider.getToken('')).rejects.toThrow('Authorization code is required');
  });

  test('throws for whitespace-only code', async () => {
    const provider = createGoogleProvider(validConfig);
    await expect(provider.getToken('   ')).rejects.toThrow('Authorization code is required');
  });

  test('throws for non-string code', async () => {
    const provider = createGoogleProvider(validConfig);
    await expect(provider.getToken(123)).rejects.toThrow('Authorization code is required');
  });

  test('prevents code replay', async () => {
    // Mock the entire http module before creating provider
    jest.mock('../../src/utils/http', () => ({
      post: jest.fn().mockResolvedValue({
        access_token: 'token-1',
        token_type: 'Bearer',
      }),
      get: jest.fn(),
      sanitize: jest.fn((d) => d),
      enforceHttps: jest.fn(),
    }));

    // Re-require to pick up the mock
    jest.resetModules();
    const { createGoogleProvider: createMockedProvider } = require('../../src/providers/google');
    const provider = createMockedProvider(validConfig);

    await provider.getToken('code-replay-test');
    await expect(provider.getToken('code-replay-test')).rejects.toThrow('Authorization code has already been used');

    jest.restoreAllMocks();
    jest.resetModules();
  });
});
