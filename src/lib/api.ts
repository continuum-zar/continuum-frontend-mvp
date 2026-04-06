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
    // Default ceiling for slow endpoints (planner LLM). Per-request calls can still override.
    timeout: 600_000,
    headers: {
        'Content-Type': 'application/json',
    },
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach(prom => {
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
        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/logout') {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const tokens = localStorage.getItem('auth-storage');
            if (tokens) {
                try {
                    const { state } = JSON.parse(tokens);
                    const refreshToken = state.refreshToken;

                    if (refreshToken) {
                        // Import useAuthStore dynamically to avoid circular dependency
                        const { useAuthStore } = await import('../store/authStore');

                        // Call refresh token endpoint using fresh axios instance to avoid interceptors
                        const response = await axios.post(`${apiBaseURL}/auth/refresh-token`, {
                            refresh_token: refreshToken
                        });

                        const { access_token, refresh_token } = response.data;

                        // Update store
                        useAuthStore.getState().setTokens(access_token, refresh_token);

                        processQueue(null, access_token);

                        // Retry original request with new token
                        originalRequest.headers.Authorization = `Bearer ${access_token}`;
                        return api(originalRequest);
                    }
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    // Refresh failed, logout
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
