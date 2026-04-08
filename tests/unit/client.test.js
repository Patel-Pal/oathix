const { createOAuthClient } = require('../../src/core/client');

describe('createOAuthClient', () => {
  const validConfig = {
    google: {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:3000/callback',
    },
  };

  test('returns client with google provider for valid config', () => {
    const client = createOAuthClient(validConfig);
    expect(client.google).toBeDefined();
    expect(typeof client.google.getAuthUrl).toBe('function');
    expect(typeof client.google.getToken).toBe('function');
  });

  test('ignores unsupported provider keys', () => {
    const client = createOAuthClient({ ...validConfig, unsupported_provider: { clientId: 'x' } });
    expect(client.google).toBeDefined();
    expect(client.unsupported_provider).toBeUndefined();
  });

  test('returns empty client for empty config', () => {
    const client = createOAuthClient({});
    expect(Object.keys(client)).toHaveLength(0);
  });

  test('throws for null config', () => {
    expect(() => createOAuthClient(null)).toThrow('Configuration object is required');
  });

  test('throws for undefined config', () => {
    expect(() => createOAuthClient(undefined)).toThrow('Configuration object is required');
  });

  test('throws for array config', () => {
    expect(() => createOAuthClient([])).toThrow('Configuration object is required');
  });

  test('throws for string config', () => {
    expect(() => createOAuthClient('bad')).toThrow('Configuration object is required');
  });
});

describe('validateProviderConfig', () => {
  test('throws for missing clientId', () => {
    expect(() => createOAuthClient({
      google: { clientSecret: 'secret', redirectUri: 'http://localhost:3000/cb' },
    })).toThrow('clientId is required for google provider');
  });

  test('throws for missing clientSecret', () => {
    expect(() => createOAuthClient({
      google: { clientId: 'id', redirectUri: 'http://localhost:3000/cb' },
    })).toThrow('clientSecret is required for google provider');
  });

  test('throws for missing redirectUri', () => {
    expect(() => createOAuthClient({
      google: { clientId: 'id', clientSecret: 'secret' },
    })).toThrow('redirectUri is required for google provider');
  });

  test('throws for non-string clientId', () => {
    expect(() => createOAuthClient({
      google: { clientId: 123, clientSecret: 'secret', redirectUri: 'http://localhost:3000/cb' },
    })).toThrow('clientId must be a string for google provider');
  });

  test('throws for empty clientId', () => {
    expect(() => createOAuthClient({
      google: { clientId: '  ', clientSecret: 'secret', redirectUri: 'http://localhost:3000/cb' },
    })).toThrow('clientId cannot be empty for google provider');
  });

  test('throws for invalid redirectUri URL', () => {
    expect(() => createOAuthClient({
      google: { clientId: 'id', clientSecret: 'secret', redirectUri: 'not-a-url' },
    })).toThrow('redirectUri must be a valid URL for google provider');
  });

  test('throws for non-object provider config', () => {
    expect(() => createOAuthClient({
      google: 'bad',
    })).toThrow('Configuration for google provider must be a plain object');
  });
});
