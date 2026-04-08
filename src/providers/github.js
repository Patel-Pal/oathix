'use strict';

const { createBaseProvider } = require('./base');

/**
 * Creates a GitHub OAuth 2.0 provider instance.
 *
 * @param {Object} config - Provider configuration
 * @param {string} config.clientId - GitHub OAuth client ID
 * @param {string} config.clientSecret - GitHub OAuth client secret
 * @param {string} config.redirectUri - Callback URL
 * @returns {Object} GitHub provider with getAuthUrl, getToken, refreshToken, getUserProfile
 */
function createGithubProvider(config) {
  return createBaseProvider({
    name: 'github',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    profileUrl: 'https://api.github.com/user',
    defaultScope: 'read:user user:email',
    config,
    profileHeaders: {
      'User-Agent': 'oathix',
    },
    profileParser: (data) => ({
      id: String(data.id),
      email: data.email,
      name: data.name || data.login,
      avatar: data.avatar_url,
      username: data.login,
      provider: 'github',
      raw: data,
    }),
  });
}

module.exports = { createGithubProvider };
