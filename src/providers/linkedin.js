'use strict';

const { createBaseProvider } = require('./base');

/**
 * Creates a LinkedIn OAuth 2.0 provider instance.
 * Uses LinkedIn's OpenID Connect flow with the v2 API.
 *
 * LinkedIn access tokens are valid for 60 days.
 * Refresh tokens are valid for 1 year.
 *
 * @param {Object} config - Provider configuration
 * @param {string} config.clientId - LinkedIn application client ID
 * @param {string} config.clientSecret - LinkedIn application client secret
 * @param {string} config.redirectUri - Callback URL
 * @returns {Object} LinkedIn provider
 */
function createLinkedinProvider(config) {
  return createBaseProvider({
    name: 'linkedin',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    profileUrl: 'https://api.linkedin.com/v2/userinfo',
    defaultScope: 'openid profile email',
    config,
    profileParser: (data) => ({
      id: data.sub,
      email: data.email,
      name: data.name,
      avatar: data.picture,
      provider: 'linkedin',
      raw: data,
    }),
  });
}

module.exports = { createLinkedinProvider };
