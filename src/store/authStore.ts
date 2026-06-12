import { create } from 'zustand';
import { isAxiosError } from 'axios';
import api, { silentRefresh } from '../lib/api';
import { setSentryUser } from '../lib/sentry';
import { TIME_RECORDING_STORAGE_KEY } from '../lib/timeRecordingTimerStorage';
import { AuthState, AuthResponse } from '../types/auth';
import { RegisterPayload, User } from '../types/user';

interface AuthActions {
    login: (credentials: Required<Pick<RegisterPayload, 'email' | 'password'>>) => Promise<void>;
    register: (payload: RegisterPayload) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: (force?: boolean) => Promise<void>;
    setAccessToken: (accessToken: string) => void;
    clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()((set, get) => ({
    user: null,
    isAuthenticated: false,
    accessToken: null,
    authSource: null,
    isLoading: false,
    isInitialized: false,
    error: null,

    login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post<AuthResponse>('/auth/login', credentials);
            const { access_token } = response.data;

            set({
                accessToken: access_token,
                isAuthenticated: true,
                authSource: 'manual',
            });

            try {
                await get().checkAuth(true);
            } catch (err) {
                set({
                    accessToken: null,
                    isAuthenticated: false,
                    user: null,
                    isInitialized: true,
                    isLoading: false,
                });
                throw err;
            }
        } catch (error) {
            set({
                error: isAxiosError(error) ? (error.response?.data?.message || 'Login failed') : 'Login failed',
                isLoading: false,
            });
            throw error;
        }
    },

    register: async (payload) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post<AuthResponse>('/auth/register', payload);
            const { access_token } = response.data;

            set({
                accessToken: access_token,
                isAuthenticated: true,
                authSource: 'manual',
            });

            try {
                await get().checkAuth(true);
            } catch (err) {
                set({
                    accessToken: null,
                    isAuthenticated: false,
                    authSource: null,
                    user: null,
                    isInitialized: true,
                    isLoading: false,
                });
                throw err;
            }
        } catch (error) {
            set({
                error: isAxiosError(error) ? (error.response?.data?.message || 'Registration failed') : 'Registration failed',
                isLoading: false,
            });
            throw error;
        }
    },

    logout: async () => {
        set({ isLoading: true });
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout request failed', error);
        } finally {
            setSentryUser(null);
            set({
                user: null,
                isAuthenticated: false,
                accessToken: null,
                authSource: null,
                isLoading: false,
                isInitialized: true,
                error: null,
            });
            try {
                localStorage.removeItem(TIME_RECORDING_STORAGE_KEY);
            } catch {
                /* noop */
            }
        }
    },

    checkAuth: async (force = false) => {
        const { accessToken, isLoading } = get();

        if (isLoading && !force) return;

        // No in-memory access token: try a silent refresh (HttpOnly cookie path).
        if (!accessToken) {
            set({ isLoading: true });
            try {
                const result = await silentRefresh();
                if (result.kind === 'unauthenticated') {
                    setSentryUser(null);
                    set({
                        user: null,
                        isAuthenticated: false,
                        authSource: null,
                        isLoading: false,
                        isInitialized: true,
                    });
                    return;
                }
                if (result.kind === 'transient') {
                    // Don't log the user out on a rate-limit / network blip — leave
                    // auth state alone and let the next action retry. Mark
                    // initialized so the loader doesn't hang forever.
                    set({ isLoading: false, isInitialized: true });
                    return;
                }
                set({ accessToken: result.token, isAuthenticated: true, authSource: 'manual' });
            } catch {
                setSentryUser(null);
                set({
                    user: null,
                    isAuthenticated: false,
                    authSource: null,
                    isLoading: false,
                    isInitialized: true,
                });
                return;
            }
        } else {
            set({ isLoading: true });
        }

        try {
            const response = await api.get<User>('/users/me');
            set({
                user: response.data,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
            });
            setSentryUser({ id: response.data.id, email: response.data.email });
        } catch (error) {
            if (isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
                setSentryUser(null);
                set({
                    user: null,
                    isAuthenticated: false,
                    accessToken: null,
                    authSource: null,
                    isLoading: false,
                    isInitialized: true,
                });
            } else {
                set({ isLoading: false, isInitialized: true });
            }
            throw error;
        }
    },

    setAccessToken: (accessToken) => {
        set({
            accessToken,
            isAuthenticated: true,
        });
    },

    clearError: () => set({ error: null }),
}));
