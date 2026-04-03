/** Stable background colors for member initials (by user id). */
const MEMBER_AVATAR_BACKGROUNDS = [
  "#f17173",
  "#2563eb",
  "#8b5cf6",
  "#10b981",
  "#e19c02",
  "#ec4899",
] as const;

export function memberAvatarBackground(userId: number): string {
  const i = Math.abs(Math.trunc(userId)) % MEMBER_AVATAR_BACKGROUNDS.length;
  return MEMBER_AVATAR_BACKGROUNDS[i];
}

/** Stable color when `user.id` is not numeric (e.g. UUID). */
export function memberAvatarBackgroundFromKey(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return MEMBER_AVATAR_BACKGROUNDS[h % MEMBER_AVATAR_BACKGROUNDS.length];
}
