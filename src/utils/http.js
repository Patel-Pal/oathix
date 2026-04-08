'use strict';

const https = require('https');
const { URL } = require('url');

/**
 * List of sensitive fields that should be redacted from error output.
 * @type {string[]}
 */
const SENSITIVE_FIELDS = ['client_secret', 'clientSecret', 'access_token', 'refresh_token'];

/**
 * Redacts sensitive fields from an object for safe error reporting.
 *
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized copy with sensitive values replaced
 */
function sanitize(data) {
  if (typeof data === 'string') return data;
  if (typeof data !== 'object' || data === null) return data;

  const clean = { ...data };
  for (const field of SENSITIVE_FIELDS) {
    if (clean[field]) {
      clean[field] = '[REDACTED]';
    }
  }
  return clean;
}

/**
 * Validates that a URL uses the HTTPS protocol.
 *
 * @param {string} url - URL to validate
 * @throws {Error} If the URL does not use HTTPS
 */
function enforceHttps(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') {
    throw new Error(`Only HTTPS URLs are allowed. Received: ${parsed.protocol}`);
  }
}

/**
 * Sends an HTTP POST request using Node's built-in https module.
 * Zero external dependencies.
 *
 * @param {string} url - Request URL (must be HTTPS)
 * @param {Object} data - POST body (sent as application/x-www-form-urlencoded)
 * @returns {Promise<any>} Parsed JSON response data
 * @throws {Error} Sanitized error with response details or original message
 */
async function post(url, data) {
  enforceHttps(url);

  const body = new URLSearchParams(data).toString();
  const parsed = new URL(url);

  const options = {
    hostname: parsed.hostname,
    port: parsed.port || 443,
    path: parsed.pathname + parsed.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            // Sanitize error response to avoid leaking secrets
            const safeData = sanitize(parsed);
            reject(new Error(
              typeof safeData === 'string' ? safeData : JSON.stringify(safeData)
            ));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timed out after 30 seconds'));
    });

    req.write(body);
    req.end();
  });
}

/**
 * Sends an HTTP GET request using Node's built-in https module.
 *
 * @param {string} url - Request URL (must be HTTPS)
 * @param {Object} [headers={}] - Additional request headers
 * @returns {Promise<any>} Parsed JSON response data
 * @throws {Error} Sanitized error with response details or original message
 */
async function get(url, headers = {}) {
  enforceHttps(url);

  const parsed = new URL(url);

  const options = {
    hostname: parsed.hostname,
    port: parsed.port || 443,
    path: parsed.pathname + parsed.search,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...headers,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            const safeData = sanitize(parsed);
            reject(new Error(typeof safeData === 'string' ? safeData : JSON.stringify(safeData)));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timed out after 30 seconds'));
    });

    req.end();
  });
}

module.exports = { post, get, sanitize, enforceHttps };
