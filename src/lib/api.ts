import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { extractErrorCode, extractCorrelationId } from './errorMessages';

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
    headers: {
        'Content-Type': 'application/json',
    },
});

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
 * Backend expects `refresh_token` as a query parameter (OpenAPI: no request body).
 * @see continuum-backend Postman + tests using `params={"refresh_token": ...}`.
 */
async function postRefresh(refreshToken: string) {
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

/** Causes we surface to the auth store / UI so logout banners can be accurate. */
export type LogoutCause =
    | 'session_expired'        // access + refresh both expired or refresh revoked
    | 'invalid_token'          // malformed token, signature mismatch, epoch invalidated
    | 'refresh_failed'         // refresh threw a non-401/non-429 error
    | 'manual';                // user clicked sign out

/** Persisted breadcrumb for #1350 instrumentation. */
const LOGOUT_DIAG_KEY = 'continuum-last-logout-diagnostic';

export interface LogoutDiagnostic {
    cause: LogoutCause;
    status?: number;
    code?: string;
    message?: string;
    hadRefreshToken: boolean;
    correlationId?: string;
    timestamp: string;
}

export function recordLogoutDiagnostic(d: LogoutDiagnostic): void {
    try {
        sessionStorage.setItem(LOGOUT_DIAG_KEY, JSON.stringify(d));
    } catch {
        /* noop */
    }
    // Always log to console so support can reproduce from a user-shared error.
    // eslint-disable-next-line no-console
    console.warn('[auth] forced logout', d);
}

export function readLogoutDiagnostic(): LogoutDiagnostic | null {
    try {
        const raw = sessionStorage.getItem(LOGOUT_DIAG_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as LogoutDiagnostic;
    } catch {
        return null;
    }
}

export function clearLogoutDiagnostic(): void {
    try {
        sessionStorage.removeItem(LOGOUT_DIAG_KEY);
    } catch {
        /* noop */
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Read Retry-After (seconds or HTTP-date). Returns ms, clamped to [0, max].
 * Defaults to ``fallbackMs`` when the header is missing or invalid.
 */
function parseRetryAfter(error: AxiosError, fallbackMs: number, maxMs: number): number {
    const raw = error.response?.headers?.['retry-after'];
    if (typeof raw === 'string' && raw.trim() !== '') {
        const asInt = parseInt(raw, 10);
        if (!Number.isNaN(asInt)) {
            return Math.min(Math.max(asInt * 1000, 0), maxMs);
        }
        const asDate = Date.parse(raw);
        if (!Number.isNaN(asDate)) {
            return Math.min(Math.max(asDate - Date.now(), 0), maxMs);
        }
    }
    return Math.min(fallbackMs, maxMs);
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

/**
 * Serialize refresh across tabs (Web Locks API, or localStorage mutex fallback).
 * If another tab already refreshed, re-read storage and skip a second rotation.
 */
async function refreshTokensCoordinated(snapshotBefore: {
    accessToken: string | null;
    refreshToken: string | null;
}): Promise<{ access_token: string; refresh_token: string }> {
    const run = async (): Promise<{ access_token: string; refresh_token: string }> => {
        const latest = readAuthTokensFromStorage();
        if (
            latest.accessToken &&
            latest.accessToken !== snapshotBefore.accessToken
        ) {
            return {
                access_token: latest.accessToken,
                refresh_token: latest.refreshToken ?? '',
            };
        }
        const rt = latest.refreshToken;
        if (!rt) {
            throw new Error('No refresh token');
        }
        const response = await postRefresh(rt);
        return response.data;
    };

    if (typeof navigator !== 'undefined' && navigator.locks) {
        return navigator.locks.request(AUTH_REFRESH_LOCK_NAME, () => run());
    }
    return withStorageMutex(run);
}

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token!);
        }
    });
    failedQueue = [];
};

// Request interceptor to add the bearer token
api.interceptors.request.use(
    (config) => {
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
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Once-per-request retry guard for 429 backoff. We intentionally cap at a
 * single retry so we never amplify a thundering herd.
 */
const RATE_LIMIT_MAX_RETRY_MS = 8000;
const RATE_LIMIT_FALLBACK_MS = 1500;

async function performLogoutWithCause(diag: LogoutDiagnostic) {
    recordLogoutDiagnostic(diag);
    const { useAuthStore } = await import('../store/authStore');
    useAuthStore.getState().logout();
}

// Response interceptor: distinguishes 401 (auth) from 403 (forbidden) from 429
// (rate limited) per task #1352. 429 must NEVER cause a forced logout because
// the rate limit lives at the proxy/IP layer and the user is still valid.
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as
            | (AxiosRequestConfig & { _retry?: boolean; _rateLimitRetried?: boolean })
            | undefined;
        const status = error.response?.status;

        // ---- 429: back off once, then surface a typed error. NEVER logout. ----
        if (status === 429 && originalRequest && !originalRequest._rateLimitRetried) {
            originalRequest._rateLimitRetried = true;
            const waitMs = parseRetryAfter(error, RATE_LIMIT_FALLBACK_MS, RATE_LIMIT_MAX_RETRY_MS);
            await sleep(waitMs);
            return api(originalRequest);
        }
        if (status === 429) {
            // Already retried once — bubble up so callers (incl. the refresh
            // path) can surface a "service busy" toast instead of logging out.
            return Promise.reject(error);
        }

        // ---- 403: forbidden. Not an auth failure. Do not refresh, do not logout.
        if (status === 403) {
            return Promise.reject(error);
        }

        // ---- 401: try refresh. Only logout when refresh truly fails. ----
        if (
            status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            originalRequest.url !== '/auth/logout' &&
            originalRequest.url !== '/auth/login' &&
            originalRequest.url !== '/auth/login/access-token' &&
            originalRequest.url !== '/auth/refresh-token'
        ) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers = originalRequest.headers ?? {};
                        (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const snapshotBefore = readAuthTokensFromStorage();
            const refreshToken = snapshotBefore.refreshToken;

            // No refresh token at all → we genuinely cannot recover. Logout.
            if (!refreshToken) {
                isRefreshing = false;
                processQueue(error, null);
                await performLogoutWithCause({
                    cause: 'session_expired',
                    status,
                    code: extractErrorCode(error),
                    message: 'No refresh token available.',
                    hadRefreshToken: false,
                    correlationId: extractCorrelationId(error),
                    timestamp: new Date().toISOString(),
                });
                return Promise.reject(error);
            }

            try {
                const { useAuthStore } = await import('../store/authStore');
                const data = await refreshTokensCoordinated(snapshotBefore);
                const { access_token, refresh_token } = data;

                useAuthStore.getState().setTokens(access_token, refresh_token);
                processQueue(null, access_token);

                originalRequest.headers = originalRequest.headers ?? {};
                (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${access_token}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);

                // Critical: the refresh call itself may have hit a rate limit.
                // That is NOT a session-expired signal — it is a transient
                // proxy/backend condition. Reject so the caller backs off
                // instead of logging the user out.
                if (
                    axios.isAxiosError(refreshError) &&
                    refreshError.response?.status === 429
                ) {
                    return Promise.reject(refreshError);
                }

                // Anything else from the refresh path: the refresh token is
                // truly invalid/expired/revoked. Logout with a precise cause.
                let cause: LogoutCause = 'refresh_failed';
                let code: string | undefined;
                let message: string | undefined;
                let respStatus: number | undefined;
                let correlationId: string | undefined;
                if (axios.isAxiosError(refreshError)) {
                    respStatus = refreshError.response?.status;
                    code = extractErrorCode(refreshError);
                    correlationId = extractCorrelationId(refreshError);
                    const body = refreshError.response?.data;
                    if (body && typeof body === 'object' && 'message' in body) {
                        const m = (body as { message?: unknown }).message;
                        if (typeof m === 'string') message = m;
                    }
                    if (respStatus === 401) {
                        if (
                            code === 'REFRESH_TOKEN_EXPIRED' ||
                            code === 'SESSION_EXPIRED'
                        ) {
                            cause = 'session_expired';
                        } else if (
                            code === 'INVALID_TOKEN' ||
                            code === 'SESSION_INVALIDATED_BY_DEPLOY' ||
                            code === 'REFRESH_TOKEN_REVOKED'
                        ) {
                            cause = 'invalid_token';
                        } else {
                            cause = 'session_expired';
                        }
                    }
                }
                await performLogoutWithCause({
                    cause,
                    status: respStatus,
                    code,
                    message,
                    hadRefreshToken: true,
                    correlationId,
                    timestamp: new Date().toISOString(),
                });
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
