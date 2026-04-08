const { createTokenStore } = require('../../src/utils/token-store');

describe('createTokenStore', () => {
  test('stores and retrieves tokens', () => {
    const store = createTokenStore();
    store.set('google:user1', { access_token: 'abc', expires_in: 3600 });
    const entry = store.get('google:user1');
    expect(entry.access_token).toBe('abc');
    expect(entry.expires_at).toBeGreaterThan(Date.now());
  });

  test('returns null for missing key', () => {
    const store = createTokenStore();
    expect(store.get('missing')).toBeNull();
  });

  test('isExpired returns true for missing key', () => {
    const store = createTokenStore();
    expect(store.isExpired('missing')).toBe(true);
  });

  test('isExpired returns false for fresh token', () => {
    const store = createTokenStore();
    store.set('key', { access_token: 'abc', expires_in: 3600 });
    expect(store.isExpired('key')).toBe(false);
  });

  test('isExpired returns true for expired token', () => {
    const store = createTokenStore();
    store.set('key', { access_token: 'abc', expires_in: 0 });
    expect(store.isExpired('key')).toBe(true);
  });

  test('remove deletes token', () => {
    const store = createTokenStore();
    store.set('key', { access_token: 'abc' });
    expect(store.remove('key')).toBe(true);
    expect(store.get('key')).toBeNull();
  });

  test('clear removes all tokens', () => {
    const store = createTokenStore();
    store.set('a', { access_token: '1' });
    store.set('b', { access_token: '2' });
    store.clear();
    expect(store.size).toBe(0);
  });

  test('getValidToken returns token if not expired', async () => {
    const store = createTokenStore();
    store.set('key', { access_token: 'valid', expires_in: 3600 });
    const token = await store.getValidToken('key', jest.fn());
    expect(token).toBe('valid');
  });

  test('getValidToken refreshes expired token', async () => {
    const store = createTokenStore();
    store.set('key', { access_token: 'old', expires_in: 0, refresh_token: 'refresh-123' });

    const refreshFn = jest.fn().mockResolvedValue({
      access_token: 'new-token',
      expires_in: 3600,
    });

    const token = await store.getValidToken('key', refreshFn);
    expect(token).toBe('new-token');
    expect(refreshFn).toHaveBeenCalledWith('refresh-123');
  });

  test('getValidToken throws if no refresh token', async () => {
    const store = createTokenStore();
    store.set('key', { access_token: 'old', expires_in: 0 });

    await expect(store.getValidToken('key', jest.fn()))
      .rejects.toThrow('Token expired and no refresh_token available');
  });

  test('throws for invalid key', () => {
    const store = createTokenStore();
    expect(() => store.set('', { access_token: 'abc' })).toThrow('Token store key is required');
  });

  test('throws for missing access_token', () => {
    const store = createTokenStore();
    expect(() => store.set('key', {})).toThrow('Token data with access_token is required');
  });

  test('calls onTokenRefreshed callback', async () => {
    const onRefreshed = jest.fn();
    const store = createTokenStore({ onTokenRefreshed: onRefreshed });
    store.set('key', { access_token: 'old', expires_in: 0, refresh_token: 'r' });

    const refreshFn = jest.fn().mockResolvedValue({ access_token: 'new', expires_in: 3600 });
    await store.getValidToken('key', refreshFn);

    expect(onRefreshed).toHaveBeenCalledWith('key', expect.objectContaining({ access_token: 'new' }));
  });

  test('calls onTokenExpired callback', async () => {
    const onExpired = jest.fn();
    const store = createTokenStore({ onTokenExpired: onExpired });
    store.set('key', { access_token: 'old', expires_in: 0 });

    await expect(store.getValidToken('key', jest.fn())).rejects.toThrow();
    expect(onExpired).toHaveBeenCalledWith('key', expect.objectContaining({ access_token: 'old' }));
  });
});
