'use strict';

/**
 * Creates an in-memory token store for managing OAuth tokens.
 * Tracks expiration and provides automatic refresh via a callback.
 *
 * @param {Object} [options]
 * @param {function} [options.onTokenRefreshed] - Called when a token is refreshed
 * @param {function} [options.onTokenExpired] - Called when a token expires
 * @returns {Object} Token store instance
 */
function createTokenStore(options = {}) {
  const tokens = new Map();

  return {
    /**
     * Stores tokens for a provider/user key.
     * @param {string} key - Unique key (e.g., "google:user123")
     * @param {Object} tokenData - Token response from getToken
     */
    set(key, tokenData) {
      if (!key || typeof key !== 'string') {
        throw new Error('Token store key is required');
      }
      if (!tokenData || !tokenData.access_token) {
        throw new Error('Token data with access_token is required');
      }

      const entry = {
        ...tokenData,
        stored_at: Date.now(),
        expires_at: tokenData.expires_in !== undefined && tokenData.expires_in !== null
          ? Date.now() + (tokenData.expires_in * 1000)
          : null,
      };

      tokens.set(key, entry);
      return entry;
    },

    /**
     * Retrieves tokens for a key.
     * @param {string} key - Token key
     * @returns {Object|null} Token data or null
     */
    get(key) {
      return tokens.get(key) || null;
    },

    /**
     * Checks if a token is expired.
     * @param {string} key - Token key
     * @returns {boolean} True if expired or not found
     */
    isExpired(key) {
      const entry = tokens.get(key);
      if (!entry) return true;
      if (!entry.expires_at) return false;
      return Date.now() >= entry.expires_at;
    },

    /**
     * Gets a valid access token, refreshing if expired.
     * @param {string} key - Token key
     * @param {function} refreshFn - Async function that takes refresh_token and returns new tokens
     * @returns {Promise<string>} Valid access token
     */
    async getValidToken(key, refreshFn) {
      const entry = tokens.get(key);
      if (!entry) throw new Error(`No tokens found for key: ${key}`);

      if (!this.isExpired(key)) {
        return entry.access_token;
      }

      if (!entry.refresh_token) {
        if (options.onTokenExpired) options.onTokenExpired(key, entry);
        throw new Error(`Token expired and no refresh_token available for key: ${key}`);
      }

      const newTokens = await refreshFn(entry.refresh_token);
      const updated = this.set(key, {
        ...newTokens,
        refresh_token: newTokens.refresh_token || entry.refresh_token,
      });

      if (options.onTokenRefreshed) options.onTokenRefreshed(key, updated);
      return updated.access_token;
    },

    /**
     * Removes tokens for a key.
     * @param {string} key - Token key
     * @returns {boolean} True if removed
     */
    remove(key) {
      return tokens.delete(key);
    },

    /**
     * Clears all stored tokens.
     */
    clear() {
      tokens.clear();
    },

    /**
     * Returns the number of stored token entries.
     * @returns {number}
     */
    get size() {
      return tokens.size;
    },
  };
}

module.exports = { createTokenStore };
