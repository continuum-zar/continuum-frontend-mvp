import axios from 'axios';

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
    // Send/receive the HttpOnly auth cookies that /auth/cookie-login issues.
    // Frontend and backend are deployed on different roots on Railway, so the browser
    // requires this opt-in plus SameSite=None;Secure on the cookies themselves.
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

const CSRF_COOKIE_NAME = 'continuum_csrf';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/** Read a cookie value by name from `document.cookie`. Returns null if not present. */
function readCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const target = `${name}=`;
    const cookies = document.cookie.split('; ');
    for (const c of cookies) {
        if (c.startsWith(target)) {
            return decodeURIComponent(c.slice(target.length));
        }
    }
    return null;
}

/** True iff the browser currently holds a CSRF cookie (= we have a cookie session). */
function hasCookieSession(): boolean {
    return readCookie(CSRF_COOKIE_NAME) !== null;
}

/** Same shape as zustand persist `partialize` for `auth-storage`. */
function readAuthTokensFromStorage(): {
    accessToken: string | null;
    refreshToken: string | null;
} {
    const tokens = localStorage.getItem('auth-storage');
    if (!tokens) {
        return { accessToken: null, refreshToken: null };
    }
    try {
        const { state } = JSON.parse(tokens) as {
            state?: { accessToken?: string | null; refreshToken?: string | null };
        };
        return {
            accessToken: state?.accessToken ?? null,
            refreshToken: state?.refreshToken ?? null,
        };
    } catch {
        return { accessToken: null, refreshToken: null };
    }
}

/**
 * Cookie-based refresh: POST /auth/refresh with no body. Browser sends the HttpOnly
 * refresh cookie automatically (scoped to /api/v1/auth). Response sets new access +
 * refresh cookies and returns the new CSRF token.
 */
async function postCookieRefresh() {
    return axios.post<{ csrf_token: string }>(
        `${apiBaseURL}/auth/refresh`,
        null,
        { withCredentials: true, timeout: 30_000 }
    );
}

/**
 * Legacy refresh: query-param refresh token from localStorage. Kept for users who
 * logged in before the cookie migration; will be removed once the backend
 * `LEGACY_REFRESH_ENABLED` flag flips to false.
 */
async function postLegacyRefresh(refreshToken: string) {
    return axios.post<{ access_token: string; refresh_token: string; token_type?: string }>(
        `${apiBaseURL}/auth/refresh-token`,
        null,
        {
            params: { refresh_token: refreshToken },
            timeout: 30_000,
        }
    );
}

const AUTH_REFRESH_LOCK_NAME = 'continuum-auth-refresh';
const STORAGE_MUTEX_KEY = 'continuum-auth-refresh-mutex';
const STORAGE_MUTEX_TTL_MS = 120_000;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Cross-tab mutex when Web Locks API is unavailable (older browsers).
 * Uses compare-then-set with a microtask yield so only one tab holds the mutex.
 */
async function withStorageMutex<T>(fn: () => Promise<T>): Promise<T> {
    if (typeof localStorage === 'undefined') {
        return fn();
    }
    const deadline = Date.now() + STORAGE_MUTEX_TTL_MS;
    while (Date.now() < deadline) {
        const raw = localStorage.getItem(STORAGE_MUTEX_KEY);
        if (raw) {
            const ts = parseInt(raw.split('|')[0]!, 10);
            const age = Date.now() - ts;
            if (!Number.isNaN(age) && age >= 0 && age < STORAGE_MUTEX_TTL_MS) {
                await sleep(50);
                continue;
            }
            localStorage.removeItem(STORAGE_MUTEX_KEY);
        }
        const id = `${Date.now()}|${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(STORAGE_MUTEX_KEY, id);
        await sleep(0);
        if (localStorage.getItem(STORAGE_MUTEX_KEY) === id) {
            try {
                return await fn();
            } finally {
                if (localStorage.getItem(STORAGE_MUTEX_KEY) === id) {
                    localStorage.removeItem(STORAGE_MUTEX_KEY);
                }
            }
        }
    }
    return fn();
}

type RefreshResult =
    | { kind: 'cookie'; csrf_token: string }
    | { kind: 'legacy'; access_token: string; refresh_token: string };

/**
 * Serialize refresh across tabs (Web Locks API, or localStorage mutex fallback).
 * Cookie session is preferred; legacy localStorage tokens are the fallback for users
 * who haven't logged in since the cookie migration.
 */
async function refreshTokensCoordinated(): Promise<RefreshResult> {
    const run = async (): Promise<RefreshResult> => {
        if (hasCookieSession()) {
            const response = await postCookieRefresh();
            return { kind: 'cookie', csrf_token: response.data.csrf_token };
        }
        const { refreshToken } = readAuthTokensFromStorage();
        if (!refreshToken) {
            throw new Error('No refresh token');
        }
        const response = await postLegacyRefresh(refreshToken);
        return { kind: 'legacy', ...response.data };
    };

    if (typeof navigator !== 'undefined' && navigator.locks) {
        return navigator.locks.request(AUTH_REFRESH_LOCK_NAME, () => run());
    }
    return withStorageMutex(run);
}

let isRefreshing = false;
let failedQueue: Array<{
    resolve: () => void;
    reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

// Request interceptor: attach CSRF header always, attach Bearer header only as legacy fallback.
api.interceptors.request.use(
    (config) => {
        // Double-submit CSRF: backend's CsrfMiddleware compares this header to the cookie.
        // Cookie is JS-readable (NOT HttpOnly); only sent for state-changing methods, but
        // attaching it unconditionally keeps the interceptor simple — backend ignores it
        // on safe methods anyway.
        const csrf = readCookie(CSRF_COOKIE_NAME);
        if (csrf) {
            config.headers[CSRF_HEADER_NAME] = csrf;
        }

        // Legacy: callers who logged in before the cookie migration still have a Bearer
        // token in localStorage. The backend continues to accept Authorization: Bearer
        // until LEGACY_REFRESH_ENABLED is flipped. New cookie sessions take precedence
        // server-side, so sending both is harmless.
        if (!csrf) {
            const tokens = localStorage.getItem('auth-storage');
            if (tokens) {
                try {
                    const { state } = JSON.parse(tokens);
                    if (state.accessToken) {
                        config.headers.Authorization = `Bearer ${state.accessToken}`;
                    }
                } catch (e) {
                    console.error('Error parsing auth tokens from localStorage', e);
                }
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor: on 401, attempt one refresh and replay the request.
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            originalRequest.url !== '/auth/logout' &&
            originalRequest.url !== '/auth/refresh' &&
            originalRequest.url !== '/auth/refresh-token'
        ) {
            if (isRefreshing) {
                return new Promise<void>(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => api(originalRequest))
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const result = await refreshTokensCoordinated();
                const { useAuthStore } = await import('../store/authStore');

                if (result.kind === 'cookie') {
                    useAuthStore.getState().setCsrfToken(result.csrf_token);
                } else {
                    useAuthStore
                        .getState()
                        .setTokens(result.access_token, result.refresh_token);
                }

                processQueue(null);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                const { useAuthStore } = await import('../store/authStore');
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
