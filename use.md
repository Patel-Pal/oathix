# How to Use oathix

## Installation

```bash
npm install oathix
```

## Setup

Create an OAuth client by passing your provider credentials:

```js
const { createOAuthClient } = require('oathix');

const oauth = createOAuthClient({
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: 'http://localhost:3000/callback',
  },
});
```

## Step 1: Redirect User to Google

```js
const authUrl = oauth.google.getAuthUrl();
// Redirect the user to this URL
```

With custom scopes and CSRF state:

```js
const authUrl = oauth.google.getAuthUrl({
  scope: 'openid profile email',
  state: 'random-csrf-token',
});
```

## Step 2: Exchange Code for Tokens

After the user authorizes, Google redirects back with a `code` query parameter. Exchange it:

```js
const tokens = await oauth.google.getToken(req.query.code);
console.log(tokens.access_token);
```

## Full Express Example

```js
const express = require('express');
const { createOAuthClient } = require('oathix');

const app = express();

const oauth = createOAuthClient({
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: 'http://localhost:3000/callback',
  },
});

// Step 1: Send user to Google
app.get('/auth/google', (req, res) => {
  const url = oauth.google.getAuthUrl({
    scope: 'openid profile email',
    state: 'my-csrf-token',
  });
  res.redirect(url);
});

// Step 2: Handle callback
app.get('/callback', async (req, res) => {
  try {
    const tokens = await oauth.google.getToken(req.query.code);
    res.json({
      accessToken: tokens.access_token,
      tokenType: tokens.token_type,
      expiresIn: tokens.expires_in,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
```

## Environment Variables

Create a `.env` file (or set these in your environment):

```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Get these from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

## Token Response

A successful `getToken()` call returns:

| Field           | Type     | Description                                    |
|-----------------|----------|------------------------------------------------|
| `access_token`  | `string` | Use this to call Google APIs                   |
| `token_type`    | `string` | Typically `"Bearer"`                           |
| `expires_in`    | `number` | Seconds until the token expires                |
| `refresh_token` | `string` | Present if offline access was requested        |
| `scope`         | `string` | The scopes that were granted                   |
| `id_token`      | `string` | JWT ID token (when `openid` scope is included) |

## Error Handling

```js
// Missing or empty authorization code
await oauth.google.getToken('');
// → Error: "Authorization code is required"

// Invalid code or network failure
await oauth.google.getToken('bad-code');
// → Error: contains details from Google's error response
```

Wrap your `getToken` calls in try/catch to handle these gracefully.

## Default Scopes

If you call `getAuthUrl()` without options, it defaults to `"profile email"`. Override with:

```js
oauth.google.getAuthUrl({ scope: 'openid profile email https://www.googleapis.com/auth/drive.readonly' });
```

## Browser Auth (Dynamic Mode)

Choose between full-page redirect or popup at runtime using `createBrowserAuth`:

```js
import { createBrowserAuth } from 'oathix/browser';
```

### Popup Mode

Opens Google login in a small popup window. The user stays on your page.

```js
const auth = createBrowserAuth({ mode: 'popup' });

async function handleLogin() {
  try {
    const result = await auth.login('/auth/google');
    console.log(result); // { code: '...', state: '...' }
  } catch (err) {
    console.error(err.message);
  }
}
```

### Redirect Mode

Navigates the full page to Google (traditional flow).

```js
const auth = createBrowserAuth({ mode: 'redirect' });

function handleLogin() {
  auth.login('/auth/google'); // full page redirect, no return value
}
```

### Popup Options

You can configure popup size and timeout globally or per-call:

```js
// Global config
const auth = createBrowserAuth({
  mode: 'popup',
  popupWidth: 600,
  popupHeight: 700,
  popupTimeout: 120000, // 2 minutes
});

// Per-call override
await auth.login('/auth/google', { width: 400, height: 500 });
```

| Option         | Type     | Default      | Description                    |
|----------------|----------|--------------|--------------------------------|
| `mode`         | `string` | `"redirect"` | `"redirect"` or `"popup"`     |
| `popupWidth`   | `number` | `500`        | Popup width in pixels          |
| `popupHeight`  | `number` | `600`        | Popup height in pixels         |
| `popupTimeout` | `number` | `300000`     | Max wait time in ms (5 min)    |

### Backend Setup for Popup Mode

For popup mode to work, your backend callback route needs to send the result back to the parent window:

```js
app.get('/callback', (req, res) => {
  res.send(`
    <script>
      window.opener.postMessage(
        { type: 'oauth-callback', params: Object.fromEntries(new URLSearchParams(location.search)) },
        location.origin
      );
      window.close();
    </script>
  `);
});
```

For redirect mode, your existing callback route works as-is — no changes needed.
