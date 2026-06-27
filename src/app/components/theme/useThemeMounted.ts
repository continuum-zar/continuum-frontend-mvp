import { useEffect, useState } from "react";

/**
 * next-themes resolves the active theme from storage/system on the client only,
 * so on the very first render `theme`/`resolvedTheme` are not yet known. Gate
 * theme-dependent UI (icons, selected state) on this flag to avoid rendering the
 * wrong value for a frame.
 */
export function useThemeMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

export type ThemeOption = (typeof THEME_OPTIONS)[number]["value"];
