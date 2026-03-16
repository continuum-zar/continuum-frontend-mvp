import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { isAxiosError } from 'axios';
import api from '../lib/api';
import { AuthState, AuthResponse } from '../types/auth';
import { RegisterPayload, User } from '../types/user';

interface AuthActions {
    login: (credentials: Required<Pick<RegisterPayload, 'email' | 'password'>>) => Promise<void>;
    register: (payload: RegisterPayload) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: (force?: boolean) => Promise<void>;
    setTokens: (accessToken: string, refreshToken: string) => void;
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
            isLoading: false,
            isInitialized: false,
            error: null,

            login: async (credentials) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post<AuthResponse>('/auth/login', credentials);
                    const { access_token, refresh_token } = response.data;

                    set({
                        accessToken: access_token,
                        refreshToken: refresh_token,
                        isAuthenticated: true
                    });

                    // Fetch user info after login
                    try {
                        await get().checkAuth(true);
                    } catch (err) {
                        set({
                            accessToken: null,
                            refreshToken: null,
                            isAuthenticated: false,
                            user: null,
                            isInitialized: true,
                            isLoading: false
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
                    const { access_token, refresh_token } = response.data;

                    set({
                        accessToken: access_token,
                        refreshToken: refresh_token,
                        isAuthenticated: true
                    });

                    // Fetch user info after registration
                    try {
                        await get().checkAuth(true);
                    } catch (err) {
                        set({
                            accessToken: null,
                            refreshToken: null,
                            isAuthenticated: false,
                            user: null,
                            isInitialized: true,
                            isLoading: false
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
                    set({
                        user: null,
                        isAuthenticated: false,
                        accessToken: null,
                        refreshToken: null,
                        isLoading: false,
                        isInitialized: true,
                        error: null
                    });
                    localStorage.removeItem('auth-storage');
                }
            },

            checkAuth: async (force = false) => {
                const { accessToken, isLoading } = get();
                
                // If no token, we are effectively "checked" and not authenticated
                if (!accessToken) {
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
                        isInitialized: true
                    });
                } catch (error) {
                    if (isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
                        set({
                            user: null,
                            isAuthenticated: false,
                            accessToken: null,
                            refreshToken: null,
                            isLoading: false,
                            isInitialized: true
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

            clearError: () => set({ error: null }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
            }),
        }
    )
);
