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
        { params: { refresh_token: refreshToken } }
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

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and not already retried
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            originalRequest.url !== '/auth/logout'
        ) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const tokens = localStorage.getItem('auth-storage');
            if (tokens) {
                try {
                    const snapshotBefore = readAuthTokensFromStorage();
                    const refreshToken = snapshotBefore.refreshToken;

                    if (refreshToken) {
                        const { useAuthStore } = await import('../store/authStore');

                        const data = await refreshTokensCoordinated(snapshotBefore);
                        const { access_token, refresh_token } = data;

                        useAuthStore.getState().setTokens(access_token, refresh_token);

                        processQueue(null, access_token);

                        originalRequest.headers.Authorization = `Bearer ${access_token}`;
                        return api(originalRequest);
                    }
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    const { useAuthStore } = await import('../store/authStore');
                    useAuthStore.getState().logout();
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            } else {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
