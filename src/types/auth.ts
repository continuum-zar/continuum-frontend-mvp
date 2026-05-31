import { User } from './user';

/**
 * Legacy response shape from /auth/login, /auth/register, /auth/login/access-token.
 * Returned during the cookie-auth migration window (Continuum #1301); will be removed
 * once the backend `LEGACY_REFRESH_ENABLED` flag is flipped to false.
 */
export interface AuthResponse {
    access_token: string;
    refresh_token: string;
}

/** Response shape from /auth/cookie-login and /auth/refresh. Tokens themselves live in cookies. */
export interface CookieAuthResponse {
    csrf_token: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    /** Legacy: populated only when the user logged in via the pre-migration /auth/login path. */
    accessToken: string | null;
    /** Legacy: populated only when the user logged in via the pre-migration /auth/login path. */
    refreshToken: string | null;
    /** Echoed via X-CSRF-Token on state-changing requests. Set on cookie-based login/refresh. */
    csrfToken: string | null;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;
}
