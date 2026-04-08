# oathix

Zero-dependency OAuth 2.0 client for Node.js. Add social login to your app in 3 lines.

Supports 10 providers out of the box: **Google · GitHub · Facebook · Discord · Microsoft · Snapchat · TikTok · LinkedIn · Spotify · Twitter/X**

Features: token refresh, user profile fetching, popup & redirect login modes, in-memory token storage, PKCE (Twitter), and full TypeScript definitions.

```bash
npm install oathix
```

```js
const { createOAuthClient } = require('oathix');

const oauth = createOAuthClient({
  google: { clientId: '...', clientSecret: '...', redirectUri: 'http://localhost:3000/callback' },
});

const url = oauth.google.getAuthUrl();                    // → authorization URL
const tokens = await oauth.google.getToken(code);         // → { access_token, ... }
const user = await oauth.google.getUserProfile(tokens.access_token); // → { id, email, name, avatar }
```

## Quick Start

```js
const { createOAuthClient } = require('oathix');

// 1. Initialize the client
const oauth = createOAuthClient({
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: 'http://localhost:3000/callback',
  },
});

// 2. Generate the authorization URL and redirect the user
const authUrl = oauth.google.getAuthUrl();
// → https://accounts.google.com/o/oauth2/v2/auth?client_id=...&scope=profile+email&...

// 3. After the user authorizes, exchange the code for tokens
const tokens = await oauth.google.getToken(req.query.code);
console.log(tokens.access_token);
```

## Express Example

A minimal Express server showing the full OAuth flow:

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

// Redirect user to Google's consent screen
app.get('/auth/google', (req, res) => {
  const url = oauth.google.getAuthUrl({
    scope: 'openid profile email',
    state: 'some-csrf-token',
  });
  res.redirect(url);
});

// Handle the callback
app.get('/callback', async (req, res) => {
  try {
    const tokens = await oauth.google.getToken(req.query.code);
    res.json(tokens);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('Listening on http://localhost:3000'));
```

## API

### `createOAuthClient(config)`

Creates an OAuth client with one or more providers.

```js
const oauth = createOAuthClient({
  google: { clientId, clientSecret, redirectUri },
});
```

Each provider key in the config maps to a provider instance on the returned object. Unsupported keys are silently ignored.

Throws `"Configuration object is required"` if config is not a plain object.

---

### Provider Config

Every provider requires these three fields:

| Field          | Type     | Description                          |
|----------------|----------|--------------------------------------|
| `clientId`     | `string` | Your OAuth app's client ID           |
| `clientSecret` | `string` | Your OAuth app's client secret       |
| `redirectUri`  | `string` | Callback URL after user authorizes   |

Missing any of these throws: `"{field} is required for {provider} provider"`

---

### `provider.getAuthUrl(options?)`

Generates the OAuth authorization URL.

| Option   | Type     | Default            | Description                     |
|----------|----------|--------------------|---------------------------------|
| `scope`  | `string` | `"profile email"`  | Space-separated OAuth scopes    |
| `state`  | `string` | —                  | CSRF protection token           |

Returns a `string`.

```js
// Defaults
oauth.google.getAuthUrl();

// Custom scopes + state
oauth.google.getAuthUrl({
  scope: 'openid profile email https://www.googleapis.com/auth/calendar.readonly',
  state: crypto.randomUUID(),
});
```

---

### `provider.getToken(code)`

Exchanges an authorization code for access tokens.

| Param  | Type     | Description                              |
|--------|----------|------------------------------------------|
| `code` | `string` | The authorization code from the callback |

Returns a `Promise` resolving to:

| Field           | Type     | Description                                    |
|-----------------|----------|------------------------------------------------|
| `access_token`  | `string` | The OAuth access token                         |
| `token_type`    | `string` | Typically `"Bearer"`                           |
| `expires_in`    | `number` | Seconds until the token expires                |
| `refresh_token` | `string` | Present if offline access was requested        |
| `scope`         | `string` | The scopes that were granted                   |
| `id_token`      | `string` | JWT ID token (when `openid` scope is included) |

Throws `"Authorization code is required"` if code is missing or empty.

```js
try {
  const tokens = await oauth.google.getToken(code);
  console.log(tokens.access_token);
} catch (err) {
  console.error('Token exchange failed:', err.message);
}
```

## Browser Auth (Dynamic Mode)

Choose between full-page redirect or popup at runtime:

```js
import { createBrowserAuth } from 'oathix/browser';

// Popup mode — opens a small window, user stays on your page
const auth = createBrowserAuth({ mode: 'popup' });
const result = await auth.login('/auth/google');
console.log(result); // { code: '...', state: '...' }

// Redirect mode — navigates the whole page (traditional flow)
const auth = createBrowserAuth({ mode: 'redirect' });
auth.login('/auth/google'); // full page redirect, no return value
```

You can also configure popup size and timeout:

```js
const auth = createBrowserAuth({
  mode: 'popup',
  popupWidth: 600,
  popupHeight: 700,
  popupTimeout: 120000, // 2 minutes
});
```

Or override per-call:

```js
await auth.login('/auth/google', { width: 400, height: 500 });
```

For popup mode, your backend callback route needs to post the result back:

```js
// Backend callback route
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

| Option         | Type     | Default      | Description                    |
|----------------|----------|--------------|--------------------------------|
| `mode`         | `string` | `"redirect"` | `"redirect"` or `"popup"`     |
| `popupWidth`   | `number` | `500`        | Popup width in pixels          |
| `popupHeight`  | `number` | `600`        | Popup height in pixels         |
| `popupTimeout` | `number` | `300000`     | Max wait time in ms (5 min)    |

---

## Error Handling

The package throws standard `Error` instances with clear messages:

```js
// Missing config
createOAuthClient(null);
// → Error: "Configuration object is required"

// Missing provider field
createOAuthClient({ google: { clientId: '...' } });
// → Error: "clientSecret is required for google provider"

// Missing authorization code
await oauth.google.getToken('');
// → Error: "Authorization code is required"

// Failed token exchange (network/API error)
await oauth.google.getToken('invalid-code');
// → Error: contains the error details from Google's response
```

## Adding Providers

The architecture supports adding new providers without touching existing code. To add GitHub, for example:

1. Create `src/providers/github.js` with a factory that returns `{ getAuthUrl, getToken }`
2. Register it in `src/core/client.js`:

```js
const providers = {
  google: createGoogleProvider,
  github: createGithubProvider, // new
};
```

Then use it:

```js
const oauth = createOAuthClient({
  google: { ... },
  github: { clientId, clientSecret, redirectUri },
});

oauth.github.getAuthUrl();
```

## Requirements

- Node.js 16+
- An OAuth application registered with your provider (e.g., [Google Cloud Console](https://console.cloud.google.com/apis/credentials))

## License

MIT
