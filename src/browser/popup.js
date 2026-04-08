/**
 * Browser-side OAuth popup utility.
 * Opens the OAuth consent screen in a popup window and uses postMessage
 * to receive the callback result — more reliable than URL polling.
 *
 * Usage (in browser/React):
 *   import { openOAuthPopup } from 'oathix/browser/popup';
 *   const result = await openOAuthPopup('/auth/google');
 *
 * Your backend callback route should include this script:
 *   <script>
 *     window.opener.postMessage(
 *       { type: 'oauth-callback', params: Object.fromEntries(new URLSearchParams(location.search)) },
 *       location.origin
 *     );
 *     window.close();
 *   </script>
 *
 * @param {string} authUrl - The URL to open (your backend auth route)
 * @param {Object} [options]
 * @param {number} [options.width=500] - Popup width
 * @param {number} [options.height=600] - Popup height
 * @param {string} [options.name=oauth-popup] - Popup window name
 * @param {number} [options.timeout=300000] - Max wait time in ms (default: 5 min)
 * @returns {Promise<Object>} Resolves with params from the callback page
 */
function openOAuthPopup(authUrl, options = {}) {
  const {
    width = 500,
    height = 600,
    name = 'oauth-popup',
    timeout = 300000,
  } = options;

  // Validate input
  if (!authUrl || typeof authUrl !== 'string') {
    return Promise.reject(new Error('authUrl is required and must be a string'));
  }

  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  const features = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    'toolbar=no',
    'menubar=no',
    'scrollbars=yes',
    'resizable=yes',
  ].join(',');

  return new Promise((resolve, reject) => {
    const popup = window.open(authUrl, name, features);

    if (!popup) {
      reject(new Error('Popup was blocked by the browser'));
      return;
    }

    let settled = false;

    // Timeout to prevent hanging forever
    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        popup.close();
        reject(new Error('OAuth popup timed out'));
      }
    }, timeout);

    // Listen for postMessage from the callback page
    function onMessage(event) {
      // Only accept messages from our own origin
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.type !== 'oauth-callback') return;

      if (!settled) {
        settled = true;
        cleanup();
        popup.close();
        resolve(event.data.params || {});
      }
    }

    // Check if popup was closed manually
    const pollTimer = setInterval(() => {
      if (popup.closed && !settled) {
        settled = true;
        cleanup();
        reject(new Error('Popup was closed by the user'));
      }
    }, 500);

    function cleanup() {
      clearTimeout(timeoutId);
      clearInterval(pollTimer);
      window.removeEventListener('message', onMessage);
    }

    window.addEventListener('message', onMessage);
  });
}

// Support both CommonJS and ES module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { openOAuthPopup };
}
