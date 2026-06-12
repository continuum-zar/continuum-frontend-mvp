import { useEffect, useLayoutEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { clerkJwtTemplate } from '@/lib/clerkConfig';
import { SESSION_SOCIAL_ONBOARDING_PENDING_KEY } from '@/lib/socialOnboarding';
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
 *
 * Timing note: AuthGuard's `useEffect` fires before this component's `useEffect`
 * (bottom-up effect order — the guard is deeper in the tree than this top-level
 * bridge). Without intervention the guard would call `checkAuth` → silent
 * refresh → 401 (no backend cookie yet) and redirect to /login before our
 * `/auth/social-login` exchange resolves. We pre-empt that race by setting
 * `isLoading: true` synchronously in `useLayoutEffect` the moment Clerk reports
 * a signed-in user. `checkAuth` early-returns while `isLoading` is true, and
 * AuthGuard keeps showing the skeleton until the exchange finishes.
 */
export function ClerkSessionBridge() {
  const { isLoaded: authLoaded, isSignedIn, getToken } = useAuth();
  const { isLoaded: userLoaded } = useUser();

  // Run BEFORE AuthGuard's checkAuth useEffect so we claim the loading
  // indicator first. Without this, the post-OAuth landing on /onboarding/usage
  // or /loading bounces the user to /login before we can swap a Clerk JWT for
  // a backend session.
  useLayoutEffect(() => {
    if (!authLoaded || !userLoaded) return;
    if (!isSignedIn) return;
    const store = useAuthStore.getState();
    if (store.authSource === 'manual') return;
    if (store.authSource === 'clerk' && store.isAuthenticated && store.accessToken) return;
    if (!store.isLoading || store.isInitialized) {
      useAuthStore.setState({ isLoading: true, isInitialized: false });
    }
  }, [authLoaded, userLoaded, isSignedIn]);

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
        if (cancelled || !clerkToken) {
          // Clerk reports signed-in but couldn't mint a token — let AuthGuard
          // make a decision rather than hanging on the skeleton forever.
          if (!cancelled) {
            useAuthStore.setState({ isLoading: false, isInitialized: true });
          }
          return;
        }

        // Exchange the Clerk JWT for a backend session. The backend verifies
        // the Clerk signature, upserts the user, and returns an HS256 token
        // (plus an HttpOnly refresh cookie scoped to /api/v1/auth). The
        // ``is_new_user`` flag is sticky for one navigation so /loading can
        // redirect first-time social signups into /onboarding/usage.
        const response = await api.post<AuthResponse>(
          '/auth/social-login',
          undefined,
          { headers: { Authorization: `Bearer ${clerkToken}` } },
        );
        if (cancelled) return;
        if (response.data.is_new_user) {
          try {
            sessionStorage.setItem(SESSION_SOCIAL_ONBOARDING_PENDING_KEY, '1');
          } catch {
            /* sessionStorage may be unavailable (private mode) — onboarding
               just won't auto-trigger; the user can still complete it later. */
          }
        }
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
        if (!cancelled) {
          // Release the skeleton so AuthGuard can redirect to /login instead
          // of spinning forever on a failed exchange.
          useAuthStore.setState({ isLoading: false, isInitialized: true });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoaded, userLoaded, isSignedIn, getToken]);

  return null;
}
