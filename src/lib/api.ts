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

/**
 * Serialize refresh across tabs via the Web Locks API when available.
 * Without it, tabs may both refresh — backends supporting refresh-token rotation
 * handle this fine; each tab ends up with its own in-memory access token.
 */
async function refreshAccessTokenCoordinated(): Promise<string> {
    const run = async (): Promise<string> => {
        const response = await postRefresh();
        return response.data.access_token;
    };

    if (typeof navigator !== 'undefined' && navigator.locks) {
        return navigator.locks.request(AUTH_REFRESH_LOCK_NAME, () => run());
    }
    return run();
}

/**
 * Attempts a silent refresh on app boot. Returns the new access token on success,
 * or `null` if there's no valid refresh cookie (i.e. the user must log in).
 */
export async function silentRefresh(): Promise<string | null> {
    try {
        return await refreshAccessTokenCoordinated();
    } catch {
        return null;
    }
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

// Request interceptor: attach the in-memory access token from the auth store.
api.interceptors.request.use(
    async (config) => {
        const { useAuthStore } = await import('../store/authStore');
        const accessToken = useAuthStore.getState().accessToken;
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
            !originalRequest._retry &&
            originalRequest.url !== '/auth/logout' &&
            originalRequest.url !== '/auth/refresh-token'
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

            try {
                const accessToken = await refreshAccessTokenCoordinated();
                const { useAuthStore } = await import('../store/authStore');
                useAuthStore.getState().setAccessToken(accessToken);

                processQueue(null, accessToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
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
