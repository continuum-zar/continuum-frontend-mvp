const STORAGE_KEY = "github_oauth_return_to";
const SETTINGS_FLAG_KEY = "github_oauth_reopen_settings";
const NESTED_GITHUB_MODAL_KEY = "github_oauth_reopen_github_integration_modal";
const RESTORE_PROJECT_API_ID_KEY = "github_oauth_restore_project_api_id";
const WELCOME_LINK_REPO_KEY = "github_oauth_reopen_welcome_link_repo";

export type RememberGithubOAuthReturnPathOpts = {
  /** Open Settings → Integrations after return (workspace shell). */
  reopenSettings?: boolean;
  /** Also open the nested GitHub integration dialog (requires reopenSettings). */
  reopenGithubIntegrationModal?: boolean;
  /** Restore the Continuum project picker inside the GitHub dialog to this API id. */
  restoreProjectApiId?: number;
  /** Reopen the welcome “link repository” dialog (no Settings). */
  reopenWelcomeLinkRepoModal?: boolean;
};

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
  opts: RememberGithubOAuthReturnPathOpts = {},
): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, path);
    if (opts.reopenSettings) {
      sessionStorage.setItem(SETTINGS_FLAG_KEY, "1");
    } else {
      sessionStorage.removeItem(SETTINGS_FLAG_KEY);
    }
    if (opts.reopenGithubIntegrationModal) {
      sessionStorage.setItem(NESTED_GITHUB_MODAL_KEY, "1");
    } else {
      sessionStorage.removeItem(NESTED_GITHUB_MODAL_KEY);
    }
    if (opts.restoreProjectApiId != null && Number.isFinite(opts.restoreProjectApiId)) {
      sessionStorage.setItem(RESTORE_PROJECT_API_ID_KEY, String(opts.restoreProjectApiId));
    } else {
      sessionStorage.removeItem(RESTORE_PROJECT_API_ID_KEY);
    }
    if (opts.reopenWelcomeLinkRepoModal) {
      sessionStorage.setItem(WELCOME_LINK_REPO_KEY, "1");
    } else {
      sessionStorage.removeItem(WELCOME_LINK_REPO_KEY);
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

/** Consume hint to reopen the nested GitHub integration dialog after Settings opens. */
export function consumeGithubOAuthReopenGithubIntegrationModal(): boolean {
  try {
    const v = sessionStorage.getItem(NESTED_GITHUB_MODAL_KEY);
    sessionStorage.removeItem(NESTED_GITHUB_MODAL_KEY);
    return v === "1";
  } catch {
    return false;
  }
}

/** Consume stored Continuum project API id for the GitHub integration picker. */
export function consumeGithubOAuthRestoreProjectApiId(): number | null {
  try {
    const raw = sessionStorage.getItem(RESTORE_PROJECT_API_ID_KEY);
    sessionStorage.removeItem(RESTORE_PROJECT_API_ID_KEY);
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Consume hint to reopen the welcome flow “link repository” dialog after OAuth. */
export function consumeGithubOAuthReopenWelcomeLinkRepoModal(): boolean {
  try {
    const v = sessionStorage.getItem(WELCOME_LINK_REPO_KEY);
    sessionStorage.removeItem(WELCOME_LINK_REPO_KEY);
    return v === "1";
  } catch {
    return false;
  }
}
