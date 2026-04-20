const STORAGE_KEY = "github_oauth_return_to";
const SETTINGS_FLAG_KEY = "github_oauth_reopen_settings";

/**
 * Remember where the user was standing when they clicked "Connect to GitHub" so we can
 * return them there after the GitHub round-trip (instead of dropping them on the default
 * workspace board).
 *
 * The backend redirect lands on {FRONTEND_URL}/?github_oauth=success|error&... and the
 * SPA reads this value on boot to jump back to the originating page. Using sessionStorage
 * keeps the hint per-tab and avoids a DB migration on GitHubOAuthState.
 */
export function rememberGithubOAuthReturnPath(
  path: string,
  opts: { reopenSettings?: boolean } = {},
): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, path);
    if (opts.reopenSettings) {
      sessionStorage.setItem(SETTINGS_FLAG_KEY, "1");
    } else {
      sessionStorage.removeItem(SETTINGS_FLAG_KEY);
    }
  } catch {
    /* sessionStorage may be unavailable (private mode); fall back to default landing. */
  }
}

/** Consume and clear the stored return path. Returns ``null`` when nothing was stored. */
export function consumeGithubOAuthReturnPath(): string | null {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    return v && v.startsWith("/") ? v : null;
  } catch {
    return null;
  }
}

/** Peek at the stored return path without clearing it. */
export function peekGithubOAuthReturnPath(): string | null {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    return v && v.startsWith("/") ? v : null;
  } catch {
    return null;
  }
}

/** Consume and clear the "reopen Settings → Integrations on return" hint. */
export function consumeGithubOAuthReopenSettings(): boolean {
  try {
    const v = sessionStorage.getItem(SETTINGS_FLAG_KEY);
    sessionStorage.removeItem(SETTINGS_FLAG_KEY);
    return v === "1";
  } catch {
    return false;
  }
}
