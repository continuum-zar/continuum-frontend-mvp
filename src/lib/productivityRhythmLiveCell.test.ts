import { afterEach, describe, expect, it, vi } from "vitest";
import { getCurrentHeatmapHour, getTodayHeatmapDayLabel } from "./productivityRhythmLiveCell";

describe("productivityRhythmLiveCell", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns Mon and hour 10 for a Monday 10:30 local time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 4, 10, 30, 0));
    expect(getTodayHeatmapDayLabel()).toBe("Mon");
    expect(getCurrentHeatmapHour()).toBe(10);
  });

  it("returns null on Sunday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 3, 10, 0, 0));
    expect(getTodayHeatmapDayLabel()).toBeNull();
  });

  it("returns local hour on weekdays for full-day heatmap", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 4, 7, 0, 0));
    expect(getTodayHeatmapDayLabel()).toBe("Mon");
    expect(getCurrentHeatmapHour()).toBe(7);
  });

  it("rolls over from Monday 23:59 to Tuesday 00:00 correctly", () => {
    expect(getTodayHeatmapDayLabel(new Date(2026, 4, 4, 23, 59, 0))).toBe("Mon");
    expect(getCurrentHeatmapHour(new Date(2026, 4, 4, 23, 59, 0))).toBe(23);
    expect(getTodayHeatmapDayLabel(new Date(2026, 4, 5, 0, 0, 0))).toBe("Tue");
    expect(getCurrentHeatmapHour(new Date(2026, 4, 5, 0, 0, 0))).toBe(0);
  });
});
