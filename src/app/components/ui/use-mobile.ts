import * as React from "react";

/** Viewport width below this is treated as mobile (matches `useIsMobile`). */
export const MOBILE_BREAKPOINT = 768;

/**
 * Viewports at or below this **width** show the desktop-only full-screen message
 * (`MobileDesktopOnlyGate`). Set to 1366px so typical tablets in **landscape**
 * (e.g. iPad Pro 12.9-inch) are included, not only phone / portrait widths.
 * Does not change sidebar “mobile” behavior (`MOBILE_BREAKPOINT` stays 768).
 */
export const DESKTOP_ONLY_MAX_BREAKPOINT = 1366;

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
