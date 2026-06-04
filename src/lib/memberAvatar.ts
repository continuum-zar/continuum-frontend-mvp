/**
 * Canonical avatar-hue palette and lookup.
 *
 * Contract: each user has ONE fixed hue derived from their numeric user id.
 * The same id maps to the same color in every context (ticket view, board card,
 * list view, assignee picker, profile chip, etc.). Never define a second
 * palette or key by a per-project member id — that gives the same person a
 * different color in different projects/views.
 */
const MEMBER_AVATAR_BACKGROUNDS = [
  "#f17173",
  "#2563eb",
  "#8b5cf6",
  "#10b981",
  "#e19c02",
  "#ec4899",
] as const;

const NEUTRAL_AVATAR_BACKGROUND = "#9fa5a8";

/** Stable hue for a user. Pass the global numeric user id (not a project-member id). */
export function memberAvatarBackground(userId: number | null | undefined): string {
  if (userId == null || !Number.isFinite(userId)) return NEUTRAL_AVATAR_BACKGROUND;
  const i = Math.abs(Math.trunc(userId)) % MEMBER_AVATAR_BACKGROUNDS.length;
  return MEMBER_AVATAR_BACKGROUNDS[i];
}

/** Fallback when only a string key (e.g. email) is available. */
export function memberAvatarBackgroundFromKey(key: string | null | undefined): string {
  if (!key || typeof key !== "string") return NEUTRAL_AVATAR_BACKGROUND;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return MEMBER_AVATAR_BACKGROUNDS[h % MEMBER_AVATAR_BACKGROUNDS.length];
}
