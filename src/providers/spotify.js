'use strict';

const { createBaseProvider } = require('./base');

/**
 * Creates a Spotify OAuth 2.0 provider instance.
 *
 * Spotify access tokens expire after 1 hour.
 * Refresh tokens do not expire unless revoked.
 *
 * @param {Object} config - Provider configuration
 * @param {string} config.clientId - Spotify application client ID
 * @param {string} config.clientSecret - Spotify application client secret
 * @param {string} config.redirectUri - Callback URL
 * @returns {Object} Spotify provider
 */
function createSpotifyProvider(config) {
  return createBaseProvider({
    name: 'spotify',
    authUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    profileUrl: 'https://api.spotify.com/v1/me',
    defaultScope: 'user-read-email user-read-private',
    config,
    profileParser: (data) => ({
      id: data.id,
      email: data.email,
      name: data.display_name,
      avatar: data.images && data.images.length > 0 ? data.images[0].url : null,
      username: data.id,
      provider: 'spotify',
      raw: data,
    }),
  });
}

module.exports = { createSpotifyProvider };
