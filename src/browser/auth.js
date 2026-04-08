/**
 * Browser-side OAuth authentication handler.
 * Supports both "redirect" (full page) and "popup" modes.
 *
 * Usage:
 *   import { createBrowserAuth } from 'oathix/browser';
 *
 *   // Popup mode
 *   const auth = createBrowserAuth({ mode: 'popup' });
 *   const result = await auth.login('/auth/google');
 *
 *   // Redirect mode (default)
 *   const auth = createBrowserAuth({ mode: 'redirect' });
 *   auth.login('/auth/google'); // navigates away
 *
 * @module browser/auth
 */

const { openOAuthPopup } = require('./popup');

/**
 * @typedef {Object} BrowserAuthConfig
 * @property {'redirect'|'popup'} [mode='redirect'] - Auth display mode
 * @property {number} [popupWidth=500] - Popup width (popup mode only)
 * @property {number} [popupHeight=600] - Popup height (popup mode only)
 * @property {number} [popupTimeout=300000] - Popup timeout in ms (popup mode only)
 */

/**
 * @typedef {Object} BrowserAuth
 * @property {function(string, Object?): Promise<Object>|void} login - Start the OAuth flow
 * @property {string} mode - Current auth mode
 */

/**
 * Creates a browser-side auth handler with the specified mode.
 *
 * @param {BrowserAuthConfig} [config={}] - Browser auth configuration
 * @returns {BrowserAuth} Auth handler
 */
function createBrowserAuth(config = {}) {
  const mode = config.mode || 'redirect';

  if (mode !== 'redirect' && mode !== 'popup') {
    throw new Error('mode must be "redirect" or "popup"');
  }

  return {
    mode,

    /**
     * Start the OAuth login flow.
     *
     * In "redirect" mode: navigates the full page to the auth URL.
     * In "popup" mode: opens a popup and returns a Promise with the result.
     *
     * @param {string} authUrl - The backend auth route (e.g., '/auth/google')
     * @param {Object} [options] - Additional options
     * @param {number} [options.width] - Popup width (popup mode only)
     * @param {number} [options.height] - Popup height (popup mode only)
     * @param {number} [options.timeout] - Popup timeout (popup mode only)
     * @returns {Promise<Object>|void} In popup mode returns Promise, in redirect mode returns void
     */
    login(authUrl, options = {}) {
      if (!authUrl || typeof authUrl !== 'string') {
        throw new Error('authUrl is required and must be a string');
      }

      if (mode === 'redirect') {
        window.location.href = authUrl;
        return;
      }

      // Popup mode
      return openOAuthPopup(authUrl, {
        width: options.width || config.popupWidth || 500,
        height: options.height || config.popupHeight || 600,
        timeout: options.timeout || config.popupTimeout || 300000,
      });
    },
  };
}

// Support both CommonJS and ES module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createBrowserAuth };
}
