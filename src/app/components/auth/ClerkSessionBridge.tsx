import { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

import { useAuthStore } from '@/store/authStore';
import { clerkJwtTemplate } from '@/lib/clerkConfig';

/**
 * Bridges Clerk's session into the app's existing `useAuthStore` so the rest of
 * the codebase (AuthGuard, useUpdateTask, axios interceptor, etc.) keeps reading
 * a single auth contract regardless of which provider is in use.
 *
 * - When Clerk reports a signed-in user: pull a JWT (optionally from a named
 *   template) and call `setTokens` + populate `user` so AuthGuard treats the
 *   session as authenticated.
 * - When Clerk reports signed-out: call the store's `logout()` so cached tokens
 *   and persisted state are cleared.
 *
 * Mounted only when ClerkProvider is in the tree (see `<App />`); a no-op
 * otherwise.
 */
export function ClerkSessionBridge() {
  const { isLoaded: authLoaded, isSignedIn, getToken } = useAuth();
  const { isLoaded: userLoaded, user: clerkUser } = useUser();

  useEffect(() => {
    if (!authLoaded || !userLoaded) return;
    const store = useAuthStore.getState();

    if (!isSignedIn || !clerkUser) {
      if (store.isAuthenticated || store.accessToken) {
        void store.logout();
      } else {
        useAuthStore.setState({ isInitialized: true });
      }
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const token = await getToken(
          clerkJwtTemplate ? { template: clerkJwtTemplate } : undefined,
        );
        if (cancelled || !token) return;
        const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress
          ?? clerkUser.emailAddresses[0]?.emailAddress
          ?? '';
        useAuthStore.setState({
          accessToken: token,
          // Clerk owns refresh — we keep `refreshToken` null and let the axios
          // interceptor mint a fresh token via Clerk on 401.
          refreshToken: null,
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
          error: null,
          user: {
            id: clerkUser.id,
            email: primaryEmail,
            first_name: clerkUser.firstName ?? '',
            last_name: clerkUser.lastName ?? '',
          },
        });
      } catch (err) {
        console.error('ClerkSessionBridge: failed to mint backend token', err);
        useAuthStore.setState({ isInitialized: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoaded, userLoaded, isSignedIn, clerkUser, getToken]);

  return null;
}
