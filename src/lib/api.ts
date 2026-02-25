import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

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
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const tokens = localStorage.getItem('auth-storage');
            if (tokens) {
                try {
                    const { state } = JSON.parse(tokens);
                    const refreshToken = state.refreshToken;

                    if (refreshToken) {
                        // Import useAuthStore dynamically to avoid circular dependency
                        const { useAuthStore } = await import('../store/authStore');

                        // Call refresh token endpoint using fresh axios instance to avoid interceptors
                        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/auth/refresh-token`, {
                            refresh_token: refreshToken
                        });

                        const { access_token, refresh_token } = response.data;

                        // Update store
                        useAuthStore.getState().setTokens(access_token, refresh_token);

                        // Retry original request with new token
                        originalRequest.headers.Authorization = `Bearer ${access_token}`;
                        return api(originalRequest);
                    }
                } catch (refreshError) {
                    // Refresh failed, logout
                    const { useAuthStore } = await import('../store/authStore');
                    useAuthStore.getState().logout();
                    return Promise.reject(refreshError);
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
