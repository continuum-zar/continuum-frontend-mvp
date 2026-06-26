/**
 * One-shot signal that the most recent social login created a brand-new
 * account on the backend (`POST /auth/social-login` returned `is_new_user`).
 *
 * Set by `ClerkSessionBridge` immediately after the exchange and consumed by
 * the `/loading` page, which redirects first-time social signups into
 * `/onboarding/usage` instead of the normal post-login destination. Consumers
 * must call `consumeSocialOnboardingPending()` so the flag does not survive
 * into a later session.
 *
 * Lives in sessionStorage (not the Zustand auth store) because the Clerk
 * `AuthenticateWithRedirectCallback` triggers a full-page navigation between
 * the bridge writing the flag and the `/loading` page reading it; in-memory
 * Zustand state would be wiped by that reload.
 */
export const SESSION_SOCIAL_ONBOARDING_PENDING_KEY = 'continuum.socialOnboardingPending';

export function consumeSocialOnboardingPending(): boolean {
  try {
    const pending = sessionStorage.getItem(SESSION_SOCIAL_ONBOARDING_PENDING_KEY);
    if (pending) {
      sessionStorage.removeItem(SESSION_SOCIAL_ONBOARDING_PENDING_KEY);
      return true;
    }
  } catch {
    /* sessionStorage may be unavailable (e.g. Safari private mode) */
  }
  return false;
}
