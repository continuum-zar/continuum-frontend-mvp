/** Session flag set by Loading after onboarding; cleared when the welcome modal is dismissed. */
export const SESSION_POST_ONBOARDING_WELCOME_KEY = "continuum_post_onboarding_welcome";
/** Project invite token from email link; survives login/sign-up until consumed on /invite. */
export const SESSION_INVITE_TOKEN_KEY = "continuum_invite_token";
/** Persisted after user dismisses the post-onboarding welcome modal so it does not reappear. */
export const LS_WELCOME_MODAL_DISMISSED_KEY = "continuum_welcome_modal_dismissed";
/**
 * Session flag set when a freshly-onboarded user enters the app. While present, the
 * release-notes session host silently marks the latest note seen instead of showing it,
 * so the modal does not collide with the welcome modal and post-onboarding tutorial.
 */
export const SESSION_SUPPRESS_RELEASE_NOTES_NEW_SIGNUP_KEY =
  "continuum_release_notes_suppress_new_signup";

/** Per-user dismissed flag so a new account still sees the modal on the same browser. */
export function welcomeModalDismissedKeyForUser(userId: string): string {
  return `${LS_WELCOME_MODAL_DISMISSED_KEY}:${userId}`;
}

/** Local assets under /public (raster screenshots + collage export). */
export const welcomeModalAssets = {
  wip: "/assets/welcome-modal/wip.png",
  wip1: "/assets/welcome-modal/wip1.png",
  wip2: "/assets/welcome-modal/wip2.png",
  frameCollage: "/assets/welcome-modal/frame-collage.png",
} as const;
