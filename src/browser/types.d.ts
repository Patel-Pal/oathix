// Type definitions for oathix/src/browser

// --- Popup ---

export interface PopupOptions {
  /** Popup width in pixels (default: 500) */
  width?: number;
  /** Popup height in pixels (default: 600) */
  height?: number;
  /** Popup window name (default: "oauth-popup") */
  name?: string;
  /** Max wait time in ms (default: 300000 / 5 min) */
  timeout?: number;
}

/**
 * Opens an OAuth consent screen in a popup window.
 * Uses postMessage to receive the callback result.
 *
 * Your backend callback route must include:
 * ```html
 * <script>
 *   window.opener.postMessage(
 *     { type: 'oauth-callback', params: Object.fromEntries(new URLSearchParams(location.search)) },
 *     location.origin
 *   );
 *   window.close();
 * </script>
 * ```
 */
export function openOAuthPopup(authUrl: string, options?: PopupOptions): Promise<Record<string, string>>;

// --- Browser Auth ---

export interface BrowserAuthConfig {
  /** Auth display mode: "redirect" navigates full page, "popup" opens a window */
  mode?: 'redirect' | 'popup';
  /** Popup width in pixels (popup mode only, default: 500) */
  popupWidth?: number;
  /** Popup height in pixels (popup mode only, default: 600) */
  popupHeight?: number;
  /** Popup timeout in ms (popup mode only, default: 300000) */
  popupTimeout?: number;
}

export interface LoginOptions {
  /** Popup width override */
  width?: number;
  /** Popup height override */
  height?: number;
  /** Popup timeout override */
  timeout?: number;
}

export interface BrowserAuth {
  /** Current auth mode */
  readonly mode: 'redirect' | 'popup';
  /**
   * Start the OAuth login flow.
   * In "redirect" mode: navigates the full page (returns void).
   * In "popup" mode: opens a popup (returns Promise with callback params).
   */
  login(authUrl: string, options?: LoginOptions): Promise<Record<string, string>> | void;
}

/**
 * Creates a browser-side auth handler with the specified mode.
 *
 * @example
 * ```ts
 * // Popup mode
 * const auth = createBrowserAuth({ mode: 'popup' });
 * const result = await auth.login('/auth/google');
 *
 * // Redirect mode
 * const auth = createBrowserAuth({ mode: 'redirect' });
 * auth.login('/auth/google');
 * ```
 */
export function createBrowserAuth(config?: BrowserAuthConfig): BrowserAuth;
