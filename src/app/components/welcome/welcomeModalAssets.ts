/** Session flag set by Loading after onboarding; cleared when the welcome modal is dismissed. */
export const SESSION_POST_ONBOARDING_WELCOME_KEY = "continuum_post_onboarding_welcome";
/** Persisted after user dismisses the post-onboarding welcome modal so it does not reappear. */
export const LS_WELCOME_MODAL_DISMISSED_KEY = "continuum_welcome_modal_dismissed";

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
