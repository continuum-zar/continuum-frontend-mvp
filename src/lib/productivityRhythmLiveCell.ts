/**
 * Live "who is working now" overlay aligns with the heatmap grid (Mon–Sun, 0:00–23:00)
 * using the viewer's local timezone.
 */

/** Weekday labels used by {@link ProductivityRhythmHeatmapCard} row keys. */
export const HEATMAP_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Returns a label matching heatmap rows (`Mon`–`Sun`). */
export function getTodayHeatmapDayLabel(now = new Date()): (typeof HEATMAP_DAY_LABELS)[number] | null {
  return HEATMAP_DAY_LABELS[(now.getDay() + 6) % 7] ?? null;
}

/** Current hour if it falls on a weekday heatmap row; otherwise null. */
export function getCurrentHeatmapHour(now = new Date()): number | null {
  return now.getHours();
}
