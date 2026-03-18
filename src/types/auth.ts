import { User } from './user';

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;
}
