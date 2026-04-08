'use strict';

const { createOAuthClient } = require('./core/client');
const { createTokenStore } = require('./utils/token-store');

module.exports = { createOAuthClient, createTokenStore };
