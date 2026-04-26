import * as React from "react";

/** Viewport width below this is treated as mobile (matches `useIsMobile`). */
export const MOBILE_BREAKPOINT = 768;

/**
 * Minimum viewport width (px) for `MobileDesktopOnlyGate` to allow the app.
 * Below this width, the desktop-only message is shown.
 *
 * Uses **CSS layout pixels** (same as `matchMedia` / DevTools). Browser zoom
 * changes those values for a fixed physical window—zooming out increases the
 * reported size—so thresholds must tolerate typical narrowed desktop windows at
 * 100% zoom (e.g. ~half of a 1920px-wide display), not only full-screen monitors.
 */
export const DESKTOP_ONLY_MIN_WIDTH = 960;

/**
 * Minimum viewport height (px) for `MobileDesktopOnlyGate` to allow the app.
 * Below this height, the desktop-only message is shown.
 *
 * Same CSS-pixel note as `DESKTOP_ONLY_MIN_WIDTH`. 720px still clears phones in
 * portrait while avoiding false blocks from browser chrome on short displays.
 */
export const DESKTOP_ONLY_MIN_HEIGHT = 720;

/**
 * Matches when the desktop-only gate should show: viewport narrower than
 * `DESKTOP_ONLY_MIN_WIDTH` **or** shorter than `DESKTOP_ONLY_MIN_HEIGHT`.
 */
export const DESKTOP_ONLY_GATE_MEDIA_QUERY = `(max-width: ${DESKTOP_ONLY_MIN_WIDTH - 1}px), (max-height: ${DESKTOP_ONLY_MIN_HEIGHT - 1}px)`;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
