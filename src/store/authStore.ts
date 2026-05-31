import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { isAxiosError } from 'axios';
import api from '../lib/api';
import { TIME_RECORDING_STORAGE_KEY } from '../lib/timeRecordingTimerStorage';
import { AuthState, AuthResponse, CookieAuthResponse } from '../types/auth';
import { RegisterPayload, User } from '../types/user';

interface AuthActions {
    login: (credentials: Required<Pick<RegisterPayload, 'email' | 'password'>>) => Promise<void>;
    register: (payload: RegisterPayload) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: (force?: boolean) => Promise<void>;
    setTokens: (accessToken: string, refreshToken: string) => void;
    setCsrfToken: (csrfToken: string) => void;
    clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
            csrfToken: null,
            isLoading: false,
            isInitialized: false,
            error: null,

            login: async (credentials) => {
                set({ isLoading: true, error: null });
                try {
                    // Cookie-based login: backend sets HttpOnly access + refresh cookies
                    // and returns only the CSRF token (echoed via X-CSRF-Token on writes).
                    const response = await api.post<CookieAuthResponse>(
                        '/auth/cookie-login',
                        credentials,
                    );
                    set({
                        accessToken: null,
                        refreshToken: null,
                        csrfToken: response.data.csrf_token,
                        isAuthenticated: true,
                    });

                    // Fetch user info after login
                    try {
                        await get().checkAuth(true);
                    } catch (err) {
                        set({
                            accessToken: null,
                            refreshToken: null,
                            csrfToken: null,
                            isAuthenticated: false,
                            user: null,
                            isInitialized: true,
                            isLoading: false,
                        });
                        throw err;
                    }
                } catch (error) {
                    set({
                        error: isAxiosError(error)
                            ? (error.response?.data?.message || 'Login failed')
                            : 'Login failed',
                        isLoading: false,
                    });
                    throw error;
                }
            },

            register: async (payload) => {
                set({ isLoading: true, error: null });
                try {
                    // /auth/register still returns body tokens (legacy shape) — register flow
                    // hasn't been migrated to cookies yet because it carries side-effects
                    // (email verification flows). The next login will upgrade the user to
                    // cookie auth automatically.
                    const response = await api.post<AuthResponse>('/auth/register', payload);
                    const { access_token, refresh_token } = response.data;

                    set({
                        accessToken: access_token,
                        refreshToken: refresh_token,
                        csrfToken: null,
                        isAuthenticated: true,
                    });

                    // Fetch user info after registration
                    try {
                        await get().checkAuth(true);
                    } catch (err) {
                        set({
                            accessToken: null,
                            refreshToken: null,
                            csrfToken: null,
                            isAuthenticated: false,
                            user: null,
                            isInitialized: true,
                            isLoading: false,
                        });
                        throw err;
                    }
                } catch (error) {
                    set({
                        error: isAxiosError(error)
                            ? (error.response?.data?.message || 'Registration failed')
                            : 'Registration failed',
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
                    set({
                        user: null,
                        isAuthenticated: false,
                        accessToken: null,
                        refreshToken: null,
                        csrfToken: null,
                        isLoading: false,
                        isInitialized: true,
                        error: null,
                    });
                    localStorage.removeItem('auth-storage');
                    try {
                        localStorage.removeItem(TIME_RECORDING_STORAGE_KEY);
                    } catch {
                        /* noop */
                    }
                }
            },

            checkAuth: async (force = false) => {
                const { accessToken, csrfToken, isLoading } = get();

                // If we have neither a legacy bearer token nor a CSRF token (cookie session
                // indicator), there is no point asking the server — short-circuit to
                // "initialized but not authenticated."
                if (!accessToken && !csrfToken) {
                    set({ isInitialized: true, isAuthenticated: false, user: null });
                    return;
                }

                // If check is already in progress, avoid double call unless forced
                if (isLoading && !force) return;

                set({ isLoading: true });
                try {
                    const response = await api.get<User>('/users/me');
                    set({
                        user: response.data,
                        isAuthenticated: true,
                        isLoading: false,
                        isInitialized: true,
                    });
                } catch (error) {
                    if (
                        isAxiosError(error) &&
                        (error.response?.status === 401 || error.response?.status === 403)
                    ) {
                        set({
                            user: null,
                            isAuthenticated: false,
                            accessToken: null,
                            refreshToken: null,
                            csrfToken: null,
                            isLoading: false,
                            isInitialized: true,
                        });
                    } else {
                        set({ isLoading: false, isInitialized: true });
                    }
                    throw error;
                }
            },

            setTokens: (accessToken, refreshToken) => {
                set({
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                });
            },

            setCsrfToken: (csrfToken) => {
                set({ csrfToken, isAuthenticated: true });
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                csrfToken: state.csrfToken,
            }),
        },
    ),
);
