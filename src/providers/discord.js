'use strict';

const { createBaseProvider } = require('./base');

/**
 * Creates a Discord OAuth 2.0 provider instance.
 *
 * @param {Object} config - Provider configuration
 * @param {string} config.clientId - Discord application client ID
 * @param {string} config.clientSecret - Discord application client secret
 * @param {string} config.redirectUri - Callback URL
 * @returns {Object} Discord provider with getAuthUrl, getToken, refreshToken, getUserProfile
 */
function createDiscordProvider(config) {
  return createBaseProvider({
    name: 'discord',
    authUrl: 'https://discord.com/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    profileUrl: 'https://discord.com/api/users/@me',
    defaultScope: 'identify email',
    config,
    profileParser: (data) => ({
      id: data.id,
      email: data.email,
      name: data.global_name || data.username,
      avatar: data.avatar
        ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
        : null,
      username: data.username,
      provider: 'discord',
      raw: data,
    }),
  });
}

module.exports = { createDiscordProvider };
