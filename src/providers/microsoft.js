'use strict';

const { createBaseProvider } = require('./base');

/**
 * Creates a Microsoft OAuth 2.0 provider instance.
 *
 * @param {Object} config - Provider configuration
 * @param {string} config.clientId - Microsoft application client ID
 * @param {string} config.clientSecret - Microsoft application client secret
 * @param {string} config.redirectUri - Callback URL
 * @param {string} [config.tenant='common'] - Azure AD tenant (common, organizations, consumers, or tenant ID)
 * @returns {Object} Microsoft provider with getAuthUrl, getToken, refreshToken, getUserProfile
 */
function createMicrosoftProvider(config) {
  const tenant = config.tenant || 'common';

  return createBaseProvider({
    name: 'microsoft',
    authUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
    tokenUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    profileUrl: 'https://graph.microsoft.com/v1.0/me',
    defaultScope: 'openid profile email User.Read',
    config,
    profileParser: (data) => ({
      id: data.id,
      email: data.mail || data.userPrincipalName,
      name: data.displayName,
      avatar: null, // Microsoft Graph requires a separate call for photo
      provider: 'microsoft',
      raw: data,
    }),
  });
}

module.exports = { createMicrosoftProvider };
