'use strict';

const { createBaseProvider } = require('./base');

/**
 * Creates a Snapchat OAuth 2.0 provider instance.
 * Uses Snap's Login Kit OAuth2 endpoints.
 *
 * Scopes use full URIs: https://auth.snapchat.com/oauth2/api/user.display_name
 * Default scope requests display name and external ID.
 *
 * @param {Object} config - Provider configuration
 * @param {string} config.clientId - Snapchat OAuth client ID
 * @param {string} config.clientSecret - Snapchat OAuth client secret
 * @param {string} config.redirectUri - Callback URL
 * @returns {Object} Snapchat provider
 */
function createSnapchatProvider(config) {
  return createBaseProvider({
    name: 'snapchat',
    authUrl: 'https://accounts.snapchat.com/accounts/oauth2/auth',
    tokenUrl: 'https://accounts.snapchat.com/accounts/oauth2/token',
    profileUrl: 'https://kit.snapchat.com/v1/me',
    defaultScope: 'https://auth.snapchat.com/oauth2/api/user.display_name https://auth.snapchat.com/oauth2/api/user.external_id',
    config,
    profileParser: (data) => ({
      id: data.data && data.data.me ? data.data.me.externalId : data.id,
      email: null, // Snapchat does not provide email
      name: data.data && data.data.me ? data.data.me.displayName : data.displayName,
      avatar: data.data && data.data.me && data.data.me.bitmoji ? data.data.me.bitmoji.avatar : null,
      provider: 'snapchat',
      raw: data,
    }),
  });
}

module.exports = { createSnapchatProvider };
