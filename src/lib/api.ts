import axios, { isAxiosError } from 'axios';

import { clerkJwtTemplate, isClerkEnabled } from './clerkConfig';

/**
 * Minimal type for the global `Clerk` object the SDK installs on `window`.
 * We only use the bits we need (session token fetch) to avoid importing the
 * SDK at module-load time and pulling it into the legacy auth bundle.
 */
type WindowWithClerk = Window & {
    Clerk?: {
        session?: {
            getToken: (options?: { template?: string }) => Promise<string | null>;
        } | null;
    };
};

async function getClerkSessionToken(): Promise<string | null> {
    if (!isClerkEnabled || typeof window === 'undefined') return null;
    const w = window as WindowWithClerk;
    const session = w.Clerk?.session;
    if (!session?.getToken) return null;
    try {
        return await session.getToken(clerkJwtTemplate ? { template: clerkJwtTemplate } : undefined);
    } catch (err) {
        console.error('api: failed to mint Clerk session token', err);
        return null;
    }
}

/**
 * API base URL for axios.
 * - If `VITE_API_BASE_URL` is set (e.g. `/api/v1` or `https://api.example.com/api/v1`), that wins.
 * - Otherwise, default to same-origin `/api/v1`. In dev this routes through the Vite proxy
 *   (configured with long timeouts in vite.config.mjs to handle slow LLM requests).
 */
export function resolveApiBaseURL(): string {
    const explicit = import.meta.env.VITE_API_BASE_URL;
    if (typeof explicit === 'string' && explicit.trim() !== '') {
        return explicit.trim();
    }
    return '/api/v1';
}

const apiBaseURL = resolveApiBaseURL();

const api = axios.create({
    baseURL: apiBaseURL,
    // 30s is plenty for normal REST calls even on slow 4G; 90s hung forever on dropped TCP sockets before failing.
    // Slow LLM / wiki-scan / planner endpoints pass `{ timeout: ... }` on the call site.
    timeout: 30_000,
    // Send cookies so the backend's HttpOnly refresh-token cookie reaches /auth/* endpoints.
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Refresh tokens via HttpOnly cookie. The backend reads the refresh token from
 * the cookie set on login; no token is sent from the client.
 */
async function postRefresh() {
    return axios.post<{ access_token: string; token_type?: string }>(
        `${apiBaseURL}/auth/refresh-token`,
        null,
        {
            withCredentials: true,
            timeout: 30_000,
        }
    );
}

const AUTH_REFRESH_LOCK_NAME = 'continuum-auth-refresh';

async function runRefresh(): Promise<string> {
    const response = await postRefresh();
    return response.data.access_token;
}

/**
 * Serialize refresh across tabs via the Web Locks API when available.
 * Without it, tabs may both refresh — backends supporting refresh-token rotation
 * handle this fine; each tab ends up with its own in-memory access token.
 */
async function refreshAccessTokenCoordinated(): Promise<string> {
    if (typeof navigator !== 'undefined' && navigator.locks) {
        return navigator.locks.request(AUTH_REFRESH_LOCK_NAME, () => runRefresh());
    }
    return runRefresh();
}

/**
 * Single in-flight refresh promise shared by `silentRefresh` (bootstrap) and the
 * response interceptor (401 retry). Without this, parallel callers fire multiple
 * POST /auth/refresh-token requests and trip the backend's 5/minute rate limit.
 */
let refreshInFlight: Promise<string> | null = null;

// After a 429 from /auth/refresh-token, fail fast for a bit so query retries
// (TanStack Query retries 429s once) don't fire another POST that's guaranteed
// to also rate-limit. The backend limits to 5/minute, so 60s clears the bucket.
let refreshCooldownUntil = 0;
let lastRefreshError: unknown = null;

function performRefresh(): Promise<string> {
    if (refreshInFlight) return refreshInFlight;
    if (Date.now() < refreshCooldownUntil && lastRefreshError) {
        return Promise.reject(lastRefreshError);
    }
    const promise = (async () => {
        const token = await refreshAccessTokenCoordinated();
        const { useAuthStore } = await import('../store/authStore');
        useAuthStore.getState().setAccessToken(token);
        return token;
    })();
    refreshInFlight = promise;
    promise.then(
        () => {
            refreshCooldownUntil = 0;
            lastRefreshError = null;
        },
        (err) => {
            const status = isAxiosError(err) ? err.response?.status : undefined;
            if (status === 429) {
                refreshCooldownUntil = Date.now() + 60_000;
                lastRefreshError = err;
            } else {
                refreshCooldownUntil = 0;
                lastRefreshError = null;
            }
        }
    );
    // Clear in-flight on next microtask so concurrent callers attach to this
    // promise instead of starting a second refresh.
    promise.finally(() => {
        queueMicrotask(() => {
            if (refreshInFlight === promise) refreshInFlight = null;
        });
    });
    return promise;
}

export type SilentRefreshResult =
    | { kind: 'ok'; token: string }
    | { kind: 'unauthenticated' } // refresh cookie missing/expired — must log in
    | { kind: 'transient' }; // 429, network error, 5xx — should retry, not logout

/**
 * Attempts a silent refresh on app boot. Distinguishes a real auth failure
 * (`unauthenticated`) from a transient failure (`transient`) so callers don't
 * kick the user out on a rate-limit blip.
 */
export async function silentRefresh(): Promise<SilentRefreshResult> {
    try {
        const token = await performRefresh();
        return { kind: 'ok', token };
    } catch (err) {
        const status = isAxiosError(err) ? err.response?.status : undefined;
        if (status === 401 || status === 403) return { kind: 'unauthenticated' };
        return { kind: 'transient' };
    }
}

// Request interceptor: attach the in-memory access token. If no token is set yet
// but a refresh is in flight (e.g. the bootstrap silentRefresh from
// AuthSessionBootstrap), wait for it so we don't fire requests that will 401 and
// kick off a second, parallel refresh.
//
// When Clerk is configured, prefer a freshly-minted Clerk JWT instead of the
// in-memory legacy token; Clerk handles its own refresh so the cookie-refresh
// dance below is skipped entirely.
api.interceptors.request.use(
    async (config) => {
        const clerkToken = await getClerkSessionToken();
        if (clerkToken) {
            config.headers.Authorization = `Bearer ${clerkToken}`;
            return config;
        }
        const { useAuthStore } = await import('../store/authStore');
        let accessToken = useAuthStore.getState().accessToken;
        const isAuthEndpoint =
            config.url === '/auth/login' ||
            config.url === '/auth/register' ||
            config.url === '/auth/logout' ||
            config.url === '/auth/refresh-token' ||
            config.url === '/auth/email-exists' ||
            config.url === '/auth/waitlist';
        if (!accessToken && !isAuthEndpoint && refreshInFlight) {
            await refreshInFlight;
            accessToken = useAuthStore.getState().accessToken;
        }
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor: on 401, try a cookie-based refresh once, then retry the request.
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            originalRequest.url !== '/auth/logout' &&
            originalRequest.url !== '/auth/refresh-token'
        ) {
            originalRequest._retry = true;

            // Clerk-managed sessions: ask Clerk for a fresh token and retry.
            // Clerk owns its own refresh, so we bypass the cookie-refresh dance.
            if (isClerkEnabled) {
                const fresh = await getClerkSessionToken();
                if (fresh) {
                    originalRequest.headers.Authorization = `Bearer ${fresh}`;
                    return api(originalRequest);
                }
                return Promise.reject(error);
            }

            try {
                const token = await performRefresh();
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Only logout when the refresh cookie is actually invalid/expired
                // (401). Transient failures (429 rate limit, network errors,
                // 5xx) shouldn't kick the user out — let the caller retry.
                const status = isAxiosError(refreshError) ? refreshError.response?.status : undefined;
                if (status === 401 || status === 403) {
                    const { useAuthStore } = await import('../store/authStore');
                    useAuthStore.getState().logout();
                }
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
