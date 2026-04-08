'use strict';

const crypto = require('crypto');
const { post, get } = require('../utils/http');

/**
 * Creates a TikTok OAuth 2.0 provider instance.
 *
 * TikTok's OAuth is non-standard:
 * - Uses `client_key` instead of `client_id` in auth URL
 * - Token endpoint expects JSON body, not form-urlencoded
 * - Profile endpoint requires query params, not just Bearer token
 *
 * Uses TikTok v2 API endpoints.
 *
 * @param {Object} config - Provider configuration
 * @param {string} config.clientId - TikTok client key
 * @param {string} config.clientSecret - TikTok client secret
 * @param {string} config.redirectUri - Callback URL
 * @returns {Object} TikTok provider
 */
function createTiktokProvider(config) {
  const { clientId, clientSecret, redirectUri } = config;
  const usedCodes = new Set();

  function generateState() {
    return crypto.randomBytes(16).toString('hex');
  }

  return {
    get name() { return 'tiktok'; },

    /**
     * Generates TikTok authorization URL.
     * TikTok uses `client_key` instead of `client_id`.
     */
    getAuthUrl(options = {}) {
      const scope = options.scope || 'user.info.basic';
      const state = options.state || generateState();

      const params = new URLSearchParams({
        client_key: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope,
        state,
      });

      return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
    },

    /**
     * Exchanges authorization code for tokens.
     * TikTok v2 token endpoint uses client_key instead of client_id.
     */
    async getToken(code) {
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

      const response = await post('https://open.tiktokapis.com/v2/oauth/token/', {
        client_key: clientId,
        client_secret: clientSecret,
        code: trimmedCode,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });

      if (!response || !response.access_token) {
        throw new Error('Token response missing access_token from tiktok');
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

      const response = await post('https://open.tiktokapis.com/v2/oauth/token/', {
        client_key: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken.trim(),
      });

      if (!response || !response.access_token) {
        throw new Error('Token response missing access_token from tiktok');
      }
      return response;
    },

    /**
     * Fetches user profile.
     * TikTok v2 requires fields parameter in query string.
     */
    async getUserProfile(accessToken) {
      if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
        throw new Error('Access token is required');
      }

      const data = await get(
        'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name',
        { 'Authorization': `Bearer ${accessToken.trim()}` }
      );

      const user = data.data && data.data.user ? data.data.user : data;
      return {
        id: user.open_id || user.union_id,
        email: null, // TikTok does not provide email
        name: user.display_name,
        avatar: user.avatar_url,
        username: user.display_name,
        provider: 'tiktok',
        raw: data,
      };
    },
  };
}

module.exports = { createTiktokProvider };
