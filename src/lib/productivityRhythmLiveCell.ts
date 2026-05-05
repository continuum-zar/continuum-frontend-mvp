/**
 * Live "who is working now" overlay aligns with the heatmap grid (Mon–Fri, 0:00–23:00)
 * using the viewer's local timezone.
 */

/** Weekday labels used by {@link ProductivityRhythmHeatmapCard} row keys. */
const HEATMAP_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

/** Returns a label matching heatmap rows (`Mon`–`Fri`) or null on weekend. */
export function getTodayHeatmapDayLabel(now = new Date()): (typeof HEATMAP_DAY_LABELS)[number] | null {
  const jsDay = now.getDay(); // 0 Sun .. 6 Sat
  if (jsDay === 0 || jsDay === 6) return null;
  return HEATMAP_DAY_LABELS[jsDay - 1] ?? null;
}

/** Current hour if it falls on a weekday heatmap row; otherwise null. */
export function getCurrentHeatmapHour(now = new Date()): number | null {
  return now.getHours();
}
