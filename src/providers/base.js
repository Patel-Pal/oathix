'use strict';

const crypto = require('crypto');
const { post, get } = require('../utils/http');

/**
 * Generates a cryptographically random state string for CSRF protection.
 * @returns {string} Random hex string
 */
function generateState() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Validates that a token response contains access_token.
 * @param {string} providerName - Provider name for error messages
 * @param {Object} response - Token response
 * @returns {Object} Validated response
 */
function validateTokenResponse(providerName, response) {
  if (!response || typeof response !== 'object') {
    throw new Error(`Invalid token response from ${providerName}`);
  }
  if (!response.access_token || typeof response.access_token !== 'string') {
    throw new Error(`Token response missing access_token from ${providerName}`);
  }
  return response;
}

/**
 * Creates a base OAuth 2.0 provider with shared functionality.
 *
 * @param {Object} opts - Provider options
 * @param {string} opts.name - Provider name (e.g., "google")
 * @param {string} opts.authUrl - Authorization endpoint
 * @param {string} opts.tokenUrl - Token exchange endpoint
 * @param {string} opts.profileUrl - User profile endpoint
 * @param {string} opts.defaultScope - Default OAuth scopes
 * @param {Object} opts.config - Provider config (clientId, clientSecret, redirectUri)
 * @param {function} [opts.profileParser] - Transforms raw profile to normalized format
 * @param {Object} [opts.extraAuthParams] - Extra params for auth URL
 * @param {Object} [opts.profileHeaders] - Extra headers for profile request
 * @returns {Object} Provider instance
 */
function createBaseProvider(opts) {
  const { name, authUrl, tokenUrl, profileUrl, defaultScope, config } = opts;
  const { clientId, clientSecret, redirectUri } = config;
  const profileParser = opts.profileParser || ((d) => d);
  const extraAuthParams = opts.extraAuthParams || {};
  const profileHeaders = opts.profileHeaders || {};

  const usedCodes = new Set();

  const baseParams = {
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    ...extraAuthParams,
  };

  return {
    /** @returns {string} Provider name */
    get name() { return name; },

    /**
     * Generates an OAuth authorization URL.
     * @param {Object} [options] - scope, state overrides
     * @returns {string} Authorization URL
     */
    getAuthUrl(options = {}) {
      const scope = options.scope || defaultScope;
      const state = options.state || generateState();

      const params = new URLSearchParams({ ...baseParams, scope, state });
      return `${authUrl}?${params.toString()}`;
    },

    /**
     * Exchanges an authorization code for tokens.
     * @param {string} code - Authorization code
     * @returns {Promise<Object>} Token response
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

      const response = await post(tokenUrl, {
        code: trimmedCode,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      return validateTokenResponse(name, response);
    },

    /**
     * Refreshes an access token using a refresh token.
     * @param {string} refreshToken - The refresh token
     * @returns {Promise<Object>} New token response
     */
    async refreshToken(refreshToken) {
      if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '') {
        throw new Error('Refresh token is required');
      }

      const response = await post(tokenUrl, {
        refresh_token: refreshToken.trim(),
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      });

      return validateTokenResponse(name, response);
    },

    /**
     * Fetches the authenticated user's profile.
     * @param {string} accessToken - Valid access token
     * @returns {Promise<Object>} Normalized user profile
     */
    async getUserProfile(accessToken) {
      if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
        throw new Error('Access token is required');
      }

      const data = await get(profileUrl, {
        'Authorization': `Bearer ${accessToken.trim()}`,
        ...profileHeaders,
      });

      return profileParser(data);
    },
  };
}

module.exports = { createBaseProvider, generateState, validateTokenResponse };
