import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';

/**
 * Handles the OAuth return after Clerk redirects back from Google / Apple.
 * Clerk's component reads the URL params, completes the sign-in, sets the
 * active session, and then navigates to `redirectUrlComplete` (set on the
 * `signIn.authenticateWithRedirect` call from Login / SignUp).
 *
 * Only mounted when ClerkProvider is in the tree (`isClerkEnabled`); the
 * Clerk session bridge then mirrors the new session into useAuthStore.
 */
export function SsoCallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#A8E5FE] to-[#FAF8F4]">
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/loading"
        signUpFallbackRedirectUrl="/onboarding/usage"
      />
    </div>
  );
}
