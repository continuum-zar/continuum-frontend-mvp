/**
 * Parse API datetimes that are stored in UTC but serialized without a zone suffix
 * (common with FastAPI/SQLAlchemy naive UTC → ISO like `2026-04-07T14:30:00`).
 *
 * `new Date("2026-04-07T14:30:00")` is interpreted as *local* time in JS, which skews
 * `formatDistanceToNow` and similar by the user's offset (e.g. always "~2h ago" in UTC+2).
 */
export function parseApiUtcDateTime(input: string | null | undefined): Date | null {
  if (input == null) return null;
  let s = String(input).trim();
  if (!s) return null;

  // Space-separated SQL-style → ISO
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s) && !s.includes('T')) {
    s = s.replace(' ', 'T');
  }

  const hasExplicitZone =
    /[zZ]$/.test(s) || /[+-]\d{2}:\d{2}$/.test(s) || /[+-]\d{4}$/.test(s);

  const normalized =
    !hasExplicitZone && /^\d{4}-\d{2}-\d{2}T/.test(s) ? `${s}Z` : s;

  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}
