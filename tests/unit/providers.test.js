const { createGithubProvider } = require('../../src/providers/github');
const { createFacebookProvider } = require('../../src/providers/facebook');
const { createDiscordProvider } = require('../../src/providers/discord');
const { createMicrosoftProvider } = require('../../src/providers/microsoft');
const { createSnapchatProvider } = require('../../src/providers/snapchat');
const { createTiktokProvider } = require('../../src/providers/tiktok');
const { createLinkedinProvider } = require('../../src/providers/linkedin');
const { createSpotifyProvider } = require('../../src/providers/spotify');
const { createTwitterProvider } = require('../../src/providers/twitter');

const validConfig = {
  clientId: 'test-id',
  clientSecret: 'test-secret',
  redirectUri: 'http://localhost:3000/callback',
};

// Standard providers using base provider (client_id in URL)
describe.each([
  ['github', createGithubProvider, 'https://github.com/login/oauth/authorize'],
  ['facebook', createFacebookProvider, 'https://www.facebook.com/v25.0/dialog/oauth'],
  ['discord', createDiscordProvider, 'https://discord.com/oauth2/authorize'],
  ['microsoft', createMicrosoftProvider, 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'],
  ['snapchat', createSnapchatProvider, 'https://accounts.snapchat.com/accounts/oauth2/auth'],
  ['linkedin', createLinkedinProvider, 'https://www.linkedin.com/oauth/v2/authorization'],
  ['spotify', createSpotifyProvider, 'https://accounts.spotify.com/authorize'],
])('%s provider', (name, factory, expectedAuthUrl) => {
  test('creates provider with all methods', () => {
    const provider = factory(validConfig);
    expect(typeof provider.getAuthUrl).toBe('function');
    expect(typeof provider.getToken).toBe('function');
    expect(typeof provider.refreshToken).toBe('function');
    expect(typeof provider.getUserProfile).toBe('function');
  });

  test('getAuthUrl returns correct base URL', () => {
    const provider = factory(validConfig);
    const url = provider.getAuthUrl();
    expect(url).toContain(expectedAuthUrl);
    expect(url).toContain('client_id=test-id');
    expect(url).toContain('state=');
  });

  test('getAuthUrl accepts custom scope and state', () => {
    const provider = factory(validConfig);
    const url = provider.getAuthUrl({ scope: 'custom', state: 'my-state' });
    expect(url).toContain('scope=custom');
    expect(url).toContain('state=my-state');
  });

  test('getToken throws for empty code', async () => {
    const provider = factory(validConfig);
    await expect(provider.getToken('')).rejects.toThrow('Authorization code is required');
  });

  test('refreshToken throws for empty token', async () => {
    const provider = factory(validConfig);
    await expect(provider.refreshToken('')).rejects.toThrow('Refresh token is required');
  });

  test('getUserProfile throws for empty token', async () => {
    const provider = factory(validConfig);
    await expect(provider.getUserProfile('')).rejects.toThrow('Access token is required');
  });

  test('provider name is correct', () => {
    const provider = factory(validConfig);
    expect(provider.name).toBe(name);
  });
});

// TikTok — non-standard (uses client_key)
describe('tiktok provider', () => {
  test('creates provider with all methods', () => {
    const provider = createTiktokProvider(validConfig);
    expect(typeof provider.getAuthUrl).toBe('function');
    expect(typeof provider.getToken).toBe('function');
    expect(typeof provider.refreshToken).toBe('function');
    expect(typeof provider.getUserProfile).toBe('function');
  });

  test('getAuthUrl uses client_key instead of client_id', () => {
    const provider = createTiktokProvider(validConfig);
    const url = provider.getAuthUrl();
    expect(url).toContain('https://www.tiktok.com/v2/auth/authorize/');
    expect(url).toContain('client_key=test-id');
    expect(url).not.toContain('client_id=');
  });

  test('getAuthUrl accepts custom scope and state', () => {
    const provider = createTiktokProvider(validConfig);
    const url = provider.getAuthUrl({ scope: 'user.info.basic', state: 'my-state' });
    expect(url).toContain('scope=user.info.basic');
    expect(url).toContain('state=my-state');
  });

  test('getToken throws for empty code', async () => {
    const provider = createTiktokProvider(validConfig);
    await expect(provider.getToken('')).rejects.toThrow('Authorization code is required');
  });

  test('refreshToken throws for empty token', async () => {
    const provider = createTiktokProvider(validConfig);
    await expect(provider.refreshToken('')).rejects.toThrow('Refresh token is required');
  });

  test('getUserProfile throws for empty token', async () => {
    const provider = createTiktokProvider(validConfig);
    await expect(provider.getUserProfile('')).rejects.toThrow('Access token is required');
  });

  test('provider name is correct', () => {
    const provider = createTiktokProvider(validConfig);
    expect(provider.name).toBe('tiktok');
  });
});

// Twitter — PKCE required
describe('twitter provider', () => {
  test('creates provider with all methods', () => {
    const provider = createTwitterProvider(validConfig);
    expect(typeof provider.getAuthUrl).toBe('function');
    expect(typeof provider.getToken).toBe('function');
    expect(typeof provider.refreshToken).toBe('function');
    expect(typeof provider.getUserProfile).toBe('function');
  });

  test('getAuthUrl includes PKCE code_challenge', () => {
    const provider = createTwitterProvider(validConfig);
    const url = provider.getAuthUrl();
    expect(url).toContain('https://twitter.com/i/oauth2/authorize');
    expect(url).toContain('code_challenge=');
    expect(url).toContain('code_challenge_method=S256');
    expect(url).toContain('client_id=test-id');
  });

  test('getAuthUrl accepts custom scope and state', () => {
    const provider = createTwitterProvider(validConfig);
    const url = provider.getAuthUrl({ scope: 'tweet.read', state: 'my-state' });
    expect(url).toContain('scope=tweet.read');
    expect(url).toContain('state=my-state');
  });

  test('getToken throws for empty code', async () => {
    const provider = createTwitterProvider(validConfig);
    await expect(provider.getToken('')).rejects.toThrow('Authorization code is required');
  });

  test('refreshToken throws for empty token', async () => {
    const provider = createTwitterProvider(validConfig);
    await expect(provider.refreshToken('')).rejects.toThrow('Refresh token is required');
  });

  test('getUserProfile throws for empty token', async () => {
    const provider = createTwitterProvider(validConfig);
    await expect(provider.getUserProfile('')).rejects.toThrow('Access token is required');
  });

  test('provider name is correct', () => {
    const provider = createTwitterProvider(validConfig);
    expect(provider.name).toBe('twitter');
  });
});
