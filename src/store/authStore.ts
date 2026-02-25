import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../lib/api';
import { AuthState, AuthResponse } from '../types/auth';
import { RegisterPayload, User } from '../types/user';

interface AuthActions {
    login: (credentials: Pick<RegisterPayload, 'email' | 'password'>) => Promise<void>;
    register: (payload: RegisterPayload) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
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
                    await get().checkAuth();
                } catch (error: any) {
                    set({
                        error: error.response?.data?.message || 'Login failed',
                        isLoading: false
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
                    await get().checkAuth();
                } catch (error: any) {
                    set({
                        error: error.response?.data?.message || 'Registration failed',
                        isLoading: false
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
                        error: null
                    });
                    localStorage.removeItem('auth-storage');
                }
            },

            checkAuth: async () => {
                const { accessToken } = get();
                if (!accessToken) return;

                set({ isLoading: true });
                try {
                    const response = await api.get<User>('/users/me');
                    set({
                        user: response.data,
                        isAuthenticated: true,
                        isLoading: false
                    });
                } catch (error) {
                    set({
                        user: null,
                        isAuthenticated: false,
                        accessToken: null,
                        refreshToken: null,
                        isLoading: false
                    });
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
                isAuthenticated: state.isAuthenticated,
                user: state.user,
            }),
        }
    )
);
