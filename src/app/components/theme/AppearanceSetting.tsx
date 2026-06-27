import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/app/components/ui/utils";

import { THEME_OPTIONS, useThemeMounted, type ThemeOption } from "./useThemeMounted";

const OPTION_ICON: Record<ThemeOption, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const OPTION_HINT: Record<ThemeOption, string> = {
  light: "Always light",
  dark: "Always dark",
  system: "Match device",
};

/**
 * Appearance picker for the Settings dialog — a labelled card group mirroring
 * the quick toggle in the rail. Uses semantic tokens so it reads correctly in
 * both themes.
 */
export function AppearanceSetting() {
  const { theme, setTheme } = useTheme();
  const mounted = useThemeMounted();
  const selected = mounted ? theme : undefined;

  return (
    <fieldset>
      <legend className="text-sm font-medium text-foreground">Theme</legend>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose how Continuum looks. “System” follows your device’s appearance settings.
      </p>
      <div
        role="radiogroup"
        aria-label="Theme"
        className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {THEME_OPTIONS.map(({ value, label }) => {
          const Icon = OPTION_ICON[value];
          const isSelected = selected === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setTheme(value)}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors",
                "hover:border-ring/60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                isSelected ? "border-primary ring-1 ring-primary" : "border-border",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-md",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{label}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {OPTION_HINT[value]}
                </span>
              </span>
              {isSelected && (
                <Check className="ml-auto size-4 shrink-0 text-primary" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
