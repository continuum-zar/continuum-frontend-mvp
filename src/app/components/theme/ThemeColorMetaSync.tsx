import { useEffect } from "react";
import { useTheme } from "next-themes";

// Keep these in sync with the dark `--background` token (theme.css) and the
// light fallback in index.html's <meta name="theme-color">.
const THEME_COLOR = {
  light: "#f9fafb",
  dark: "#0f172a",
} as const;

/**
 * Updates the browser chrome color (mobile address bar / PWA) whenever the
 * resolved theme changes. next-themes only toggles the `.dark` class, so the
 * meta tag would otherwise stay on its initial value after a manual switch.
 * Renders nothing.
 */
export function ThemeColorMetaSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (resolvedTheme !== "light" && resolvedTheme !== "dark") return;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_COLOR[resolvedTheme]);
  }, [resolvedTheme]);

  return null;
}
