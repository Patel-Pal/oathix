'use strict';

const { createBaseProvider } = require('./base');

/**
 * Creates a Facebook OAuth 2.0 provider instance.
 *
 * @param {Object} config - Provider configuration
 * @param {string} config.clientId - Facebook App ID
 * @param {string} config.clientSecret - Facebook App Secret
 * @param {string} config.redirectUri - Callback URL
 * @returns {Object} Facebook provider with getAuthUrl, getToken, refreshToken, getUserProfile
 */
function createFacebookProvider(config) {
  return createBaseProvider({
    name: 'facebook',
    authUrl: 'https://www.facebook.com/v25.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v25.0/oauth/access_token',
    profileUrl: 'https://graph.facebook.com/v25.0/me?fields=id,name,email,picture.type(large)',
    defaultScope: 'email public_profile',
    config,
    profileParser: (data) => ({
      id: data.id,
      email: data.email,
      name: data.name,
      avatar: data.picture && data.picture.data ? data.picture.data.url : null,
      provider: 'facebook',
      raw: data,
    }),
  });
}

module.exports = { createFacebookProvider };
