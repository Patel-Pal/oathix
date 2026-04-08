// Type definitions for oathix
// Project: https://github.com/palpatel08/oathix

// --- Core Types ---

export interface ProviderConfig {
  /** OAuth application client ID */
  clientId: string;
  /** OAuth application client secret */
  clientSecret: string;
  /** Callback URL after authorization */
  redirectUri: string;
}

export interface MicrosoftProviderConfig extends ProviderConfig {
  /** Azure AD tenant: 'common' | 'organizations' | 'consumers' | tenant ID */
  tenant?: string;
}

export interface AuthUrlOptions {
  /** OAuth scopes (provider-specific defaults if omitted) */
  scope?: string;
  /** CSRF protection state parameter (auto-generated if omitted) */
  state?: string;
}

export interface TokenResponse {
  /** OAuth access token */
  access_token: string;
  /** Token type (typically "Bearer") */
  token_type?: string;
  /** Token expiry in seconds */
  expires_in?: number;
  /** Refresh token (if offline access was requested) */
  refresh_token?: string;
  /** Granted scopes */
  scope?: string;
  /** JWT ID token (if openid scope was requested) */
  id_token?: string;
  /** Any additional fields from the provider */
  [key: string]: any;
}

export interface UserProfile {
  /** Provider-specific user ID */
  id: string;
  /** User's email (null if provider doesn't supply it) */
  email: string | null;
  /** User's display name */
  name: string;
  /** URL to user's avatar/profile picture (null if unavailable) */
  avatar: string | null;
  /** Username/handle (available for GitHub, Discord, TikTok, Twitter, Spotify) */
  username?: string;
  /** Provider name */
  provider: ProviderName;
  /** Raw unmodified response from the provider */
  raw: any;
}

// --- Provider Interface ---

export interface OAuthProvider {
  /** Provider name */
  readonly name: string;
  /** Generates an OAuth authorization URL */
  getAuthUrl(options?: AuthUrlOptions): string;
  /** Exchanges an authorization code for tokens */
  getToken(code: string): Promise<TokenResponse>;
  /** Refreshes an access token using a refresh token */
  refreshToken(refreshToken: string): Promise<TokenResponse>;
  /** Fetches the authenticated user's profile */
  getUserProfile(accessToken: string): Promise<UserProfile>;
}

export interface TwitterProvider extends OAuthProvider {
  /**
   * Exchanges authorization code for tokens.
   * Twitter requires PKCE — pass the state from the callback to retrieve the code_verifier.
   */
  getToken(code: string, state?: string): Promise<TokenResponse>;
}

// --- Provider Names ---

export type ProviderName =
  | 'google'
  | 'github'
  | 'facebook'
  | 'discord'
  | 'microsoft'
  | 'snapchat'
  | 'tiktok'
  | 'linkedin'
  | 'spotify'
  | 'twitter';

// --- Client Config ---

export interface OAuthClientConfig {
  google?: ProviderConfig;
  github?: ProviderConfig;
  facebook?: ProviderConfig;
  discord?: ProviderConfig;
  microsoft?: MicrosoftProviderConfig;
  snapchat?: ProviderConfig;
  tiktok?: ProviderConfig;
  linkedin?: ProviderConfig;
  spotify?: ProviderConfig;
  twitter?: ProviderConfig;
}

// --- Client Return Type ---

export type OAuthClient<T extends OAuthClientConfig> = {
  [K in keyof T & ProviderName]: K extends 'twitter' ? TwitterProvider : OAuthProvider;
};

// --- Token Store ---

export interface TokenStoreEntry extends TokenResponse {
  /** Timestamp when the token was stored */
  stored_at: number;
  /** Timestamp when the token expires (null if no expires_in) */
  expires_at: number | null;
}

export interface TokenStoreOptions {
  /** Called when a token is automatically refreshed */
  onTokenRefreshed?: (key: string, entry: TokenStoreEntry) => void;
  /** Called when a token expires and no refresh token is available */
  onTokenExpired?: (key: string, entry: TokenStoreEntry) => void;
}

export interface TokenStore {
  /** Stores tokens for a provider/user key */
  set(key: string, tokenData: TokenResponse): TokenStoreEntry;
  /** Retrieves tokens for a key */
  get(key: string): TokenStoreEntry | null;
  /** Checks if a token is expired */
  isExpired(key: string): boolean;
  /** Gets a valid access token, refreshing if expired */
  getValidToken(key: string, refreshFn: (refreshToken: string) => Promise<TokenResponse>): Promise<string>;
  /** Removes tokens for a key */
  remove(key: string): boolean;
  /** Clears all stored tokens */
  clear(): void;
  /** Number of stored token entries */
  readonly size: number;
}

// --- Main Exports ---

/**
 * Creates an OAuth client with initialized provider instances.
 *
 * @example
 * ```ts
 * const oauth = createOAuthClient({
 *   google: { clientId: '...', clientSecret: '...', redirectUri: '...' },
 *   github: { clientId: '...', clientSecret: '...', redirectUri: '...' },
 * });
 *
 * const url = oauth.google.getAuthUrl();
 * const tokens = await oauth.google.getToken(code);
 * const profile = await oauth.google.getUserProfile(tokens.access_token);
 * ```
 */
export function createOAuthClient<T extends OAuthClientConfig>(config: T): OAuthClient<T>;

/**
 * Creates an in-memory token store for managing OAuth tokens.
 *
 * @example
 * ```ts
 * const store = createTokenStore({
 *   onTokenRefreshed: (key, entry) => console.log('Refreshed:', key),
 * });
 *
 * store.set('google:user1', tokens);
 * const validToken = await store.getValidToken('google:user1', oauth.google.refreshToken);
 * ```
 */
export function createTokenStore(options?: TokenStoreOptions): TokenStore;
