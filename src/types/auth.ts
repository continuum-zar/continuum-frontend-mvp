import { User } from './user';

export interface AuthResponse {
    access_token: string;
    refresh_token?: string;
    // Set by POST /auth/social-login when the User row was created on this
    // exchange. The SPA reads it to route first-time social signups into
    // /onboarding/usage rather than the post-login loader.
    is_new_user?: boolean;
}

// Continuum #1344: differentiate which subsystem owns the current session so
// `ClerkSessionBridge` doesn't clobber a manual backend login by logging it out
// when Clerk reports signed-out.
export type AuthSource = 'manual' | 'clerk' | null;

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    accessToken: string | null;
    authSource: AuthSource;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;
}
