'use strict';

const { createGoogleProvider } = require('../providers/google');
const { createGithubProvider } = require('../providers/github');
const { createFacebookProvider } = require('../providers/facebook');
const { createDiscordProvider } = require('../providers/discord');
const { createMicrosoftProvider } = require('../providers/microsoft');
const { createSnapchatProvider } = require('../providers/snapchat');
const { createTiktokProvider } = require('../providers/tiktok');
const { createLinkedinProvider } = require('../providers/linkedin');
const { createSpotifyProvider } = require('../providers/spotify');
const { createTwitterProvider } = require('../providers/twitter');

/**
 * @typedef {Object} ProviderConfig
 * @property {string} clientId - OAuth application client ID
 * @property {string} clientSecret - OAuth application client secret
 * @property {string} redirectUri - Callback URL after authorization
 */

/**
 * Provider registry mapping provider names to their factory functions.
 * @type {Object<string, function(ProviderConfig): Object>}
 */
const providers = {
  google: createGoogleProvider,
  github: createGithubProvider,
  facebook: createFacebookProvider,
  discord: createDiscordProvider,
  microsoft: createMicrosoftProvider,
  snapchat: createSnapchatProvider,
  tiktok: createTiktokProvider,
  linkedin: createLinkedinProvider,
  spotify: createSpotifyProvider,
  twitter: createTwitterProvider,
};

/** @type {string[]} */
const REQUIRED_FIELDS = ['clientId', 'clientSecret', 'redirectUri'];

/**
 * Validates provider configuration.
 * @param {string} providerName
 * @param {Object} config
 */
function validateProviderConfig(providerName, config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error(`Configuration for ${providerName} provider must be a plain object`);
  }

  for (const field of REQUIRED_FIELDS) {
    const value = config[field];
    if (value === undefined || value === null) {
      throw new Error(`${field} is required for ${providerName} provider`);
    }
    if (typeof value !== 'string') {
      throw new Error(`${field} must be a string for ${providerName} provider`);
    }
    if (value.trim() === '') {
      throw new Error(`${field} cannot be empty for ${providerName} provider`);
    }
  }

  try {
    new URL(config.redirectUri);
  } catch (e) {
    throw new Error(`redirectUri must be a valid URL for ${providerName} provider`);
  }
}

/**
 * Creates an OAuth client with initialized provider instances.
 *
 * @param {Object} config - Configuration keyed by provider name
 * @returns {Object} Client with initialized providers
 */
function createOAuthClient(config) {
  if (
    config === null ||
    config === undefined ||
    typeof config !== 'object' ||
    Array.isArray(config)
  ) {
    throw new Error('Configuration object is required');
  }

  const client = {};

  for (const key of Object.keys(config)) {
    if (providers[key]) {
      validateProviderConfig(key, config[key]);
      client[key] = providers[key](config[key]);
    }
  }

  return client;
}

module.exports = { createOAuthClient };
