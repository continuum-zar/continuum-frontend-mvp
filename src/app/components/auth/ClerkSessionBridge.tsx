import { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { clerkJwtTemplate } from '@/lib/clerkConfig';
import type { AuthResponse } from '@/types/auth';

/**
 * Bridges Clerk-issued social sessions into the app's `useAuthStore`.
 *
 * Continuum #1344 split auth into two flows: manual email/password lives on the
 * backend (no Clerk), and only social providers (Google/Apple) go through Clerk.
 * After Clerk completes a social sign-in we exchange its JWT at
 * `POST /auth/social-login` for a backend HS256 session token, so the rest of
 * the app (axios interceptor, AuthGuard, /auth/refresh) only ever sees the
 * backend session — regardless of which login path the user took.
 *
 * The bridge ONLY manages sessions whose `authSource` is `'clerk'` (or unset).
 * A manual login marks the store with `authSource: 'manual'`; this component
 * never touches such a session, so signing out of Clerk in another tab cannot
 * log the manual user out.
 */
export function ClerkSessionBridge() {
  const { isLoaded: authLoaded, isSignedIn, getToken } = useAuth();
  const { isLoaded: userLoaded } = useUser();

  useEffect(() => {
    if (!authLoaded || !userLoaded) return;
    const store = useAuthStore.getState();

    if (!isSignedIn) {
      // Only react to Clerk sign-outs for sessions Clerk owns. Manual backend
      // sessions are off-limits.
      if (store.authSource === 'clerk') {
        void store.logout();
      } else if (!store.isInitialized) {
        useAuthStore.setState({ isInitialized: true });
      }
      return;
    }

    // Already have a backend session? Don't re-exchange on every render.
    if (store.authSource === 'clerk' && store.isAuthenticated && store.accessToken) {
      return;
    }
    if (store.authSource === 'manual') {
      // A manual login is in progress / completed; do not override it with the
      // Clerk session even if one happens to exist.
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const clerkToken = await getToken(
          clerkJwtTemplate ? { template: clerkJwtTemplate } : undefined,
        );
        if (cancelled || !clerkToken) return;

        // Exchange the Clerk JWT for a backend session. The backend verifies
        // the Clerk signature, upserts the user, and returns an HS256 token
        // (plus an HttpOnly refresh cookie scoped to /api/v1/auth).
        const response = await api.post<AuthResponse>(
          '/auth/social-login',
          undefined,
          { headers: { Authorization: `Bearer ${clerkToken}` } },
        );
        if (cancelled) return;
        useAuthStore.setState({
          accessToken: response.data.access_token,
          isAuthenticated: true,
          authSource: 'clerk',
          isLoading: false,
          error: null,
        });
        // Refresh the user profile via /users/me so the rest of the UI has a
        // canonical user object (the same hydration step manual login uses).
        try {
          await useAuthStore.getState().checkAuth(true);
        } catch {
          /* checkAuth already updates the store on failure */
        }
      } catch (err) {
        console.error('ClerkSessionBridge: social-login exchange failed', err);
        useAuthStore.setState({ isInitialized: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoaded, userLoaded, isSignedIn, getToken]);

  return null;
}
