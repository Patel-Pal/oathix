'use strict';

const { createBaseProvider } = require('./base');

/**
 * Creates a Google OAuth 2.0 provider instance.
 *
 * @param {Object} config - Provider configuration
 * @param {string} config.clientId - Google OAuth client ID
 * @param {string} config.clientSecret - Google OAuth client secret
 * @param {string} config.redirectUri - Callback URL
 * @returns {Object} Google provider with getAuthUrl, getToken, refreshToken, getUserProfile
 */
function createGoogleProvider(config) {
  return createBaseProvider({
    name: 'google',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    profileUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    defaultScope: 'profile email',
    config,
    profileParser: (data) => ({
      id: data.id,
      email: data.email,
      name: data.name,
      avatar: data.picture,
      provider: 'google',
      raw: data,
    }),
  });
}

module.exports = { createGoogleProvider };
