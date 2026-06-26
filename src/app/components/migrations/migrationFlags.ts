/**
 * Migration-import feature flag.
 *
 * Mirrors the backend's ``MIGRATIONS_ENABLED`` setting so the UI surface
 * (nav entry, routes) only renders when the backend will accept the
 * resulting requests. Same env-var convention as ``VITE_CLERK_*`` —
 * see ``src/lib/clerkConfig.ts``.
 */

function normaliseBool(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const trimmed = value.trim().toLowerCase();
  return trimmed === "true" || trimmed === "1" || trimmed === "yes";
}

export const isMigrationsEnabled = normaliseBool(
  import.meta.env.VITE_MIGRATIONS_ENABLED,
);
