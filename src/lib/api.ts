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

export default api;
