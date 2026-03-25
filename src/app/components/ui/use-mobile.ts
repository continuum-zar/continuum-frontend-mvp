import * as React from "react";

/** Viewport width below this is treated as mobile (matches `useIsMobile`). */
export const MOBILE_BREAKPOINT = 768;

/**
 * Viewports at or below this width show the desktop-only full-screen message
 * (`MobileDesktopOnlyGate`). Wider than `MOBILE_BREAKPOINT` so phones, phablets,
 * and tablets are covered without changing sidebar “mobile” behavior (still 768).
 */
export const DESKTOP_ONLY_MAX_BREAKPOINT = 1024;

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
