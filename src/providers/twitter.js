'use strict';

const crypto = require('crypto');
const { post, get } = require('../utils/http');

/**
 * Creates a Twitter/X OAuth 2.0 provider instance.
 *
 * Twitter requires PKCE (Proof Key for Code Exchange) for all OAuth 2.0 flows.
 * This provider auto-generates code_verifier and code_challenge.
 *
 * Access tokens expire after 2 hours.
 * Refresh tokens are long-lived.
 *
 * @param {Object} config - Provider configuration
 * @param {string} config.clientId - Twitter OAuth 2.0 client ID
 * @param {string} config.clientSecret - Twitter OAuth 2.0 client secret
 * @param {string} config.redirectUri - Callback URL
 * @returns {Object} Twitter provider
 */
function createTwitterProvider(config) {
  const { clientId, clientSecret, redirectUri } = config;
  const usedCodes = new Set();

  // Store code verifiers keyed by state for PKCE
  const pkceStore = new Map();

  function generateState() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generates PKCE code_verifier and code_challenge.
   * @returns {{ codeVerifier: string, codeChallenge: string }}
   */
  function generatePKCE() {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    return { codeVerifier, codeChallenge };
  }

  return {
    get name() { return 'twitter'; },

    /**
     * Generates Twitter authorization URL with PKCE.
     * Returns an object with the URL and the state (needed to retrieve code_verifier later).
     *
     * @param {Object} [options]
     * @param {string} [options.scope] - OAuth scopes (default: "tweet.read users.read offline.access")
     * @param {string} [options.state] - CSRF state (auto-generated if omitted)
     * @returns {string} Authorization URL
     */
    getAuthUrl(options = {}) {
      const scope = options.scope || 'tweet.read users.read offline.access';
      const state = options.state || generateState();
      const { codeVerifier, codeChallenge } = generatePKCE();

      // Store verifier for later token exchange
      pkceStore.set(state, codeVerifier);

      // Clean up old entries
      if (pkceStore.size > 100) {
        const first = pkceStore.keys().next().value;
        pkceStore.delete(first);
      }

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      });

      return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
    },

    /**
     * Exchanges authorization code for tokens.
     * Requires the state parameter to retrieve the PKCE code_verifier.
     *
     * @param {string} code - Authorization code
     * @param {string} [state] - State from the callback URL (needed for PKCE)
     * @returns {Promise<Object>} Token response
     */
    async getToken(code, state) {
      if (!code || typeof code !== 'string' || code.trim() === '') {
        throw new Error('Authorization code is required');
      }

      const trimmedCode = code.trim();
      if (usedCodes.has(trimmedCode)) {
        throw new Error('Authorization code has already been used');
      }
      usedCodes.add(trimmedCode);
      if (usedCodes.size > 100) {
        const first = usedCodes.values().next().value;
        usedCodes.delete(first);
      }

      // Retrieve PKCE code_verifier
      let codeVerifier;
      if (state && pkceStore.has(state)) {
        codeVerifier = pkceStore.get(state);
        pkceStore.delete(state);
      }

      const body = {
        code: trimmedCode,
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
      };

      if (codeVerifier) {
        body.code_verifier = codeVerifier;
      }

      // Twitter requires Basic auth header with client_id:client_secret
      const response = await post('https://api.x.com/2/oauth2/token', body);

      if (!response || !response.access_token) {
        throw new Error('Token response missing access_token from twitter');
      }
      return response;
    },

    /**
     * Refreshes an access token.
     */
    async refreshToken(refreshToken) {
      if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '') {
        throw new Error('Refresh token is required');
      }

      const response = await post('https://api.x.com/2/oauth2/token', {
        grant_type: 'refresh_token',
        refresh_token: refreshToken.trim(),
        client_id: clientId,
      });

      if (!response || !response.access_token) {
        throw new Error('Token response missing access_token from twitter');
      }
      return response;
    },

    /**
     * Fetches user profile from Twitter API v2.
     */
    async getUserProfile(accessToken) {
      if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
        throw new Error('Access token is required');
      }

      const data = await get(
        'https://api.x.com/2/users/me?user.fields=id,name,username,profile_image_url',
        { 'Authorization': `Bearer ${accessToken.trim()}` }
      );

      const user = data.data || data;
      return {
        id: user.id,
        email: null, // Twitter v2 doesn't return email in basic user endpoint
        name: user.name,
        avatar: user.profile_image_url,
        username: user.username,
        provider: 'twitter',
        raw: data,
      };
    },
  };
}

module.exports = { createTwitterProvider };
