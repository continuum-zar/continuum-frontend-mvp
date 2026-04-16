import { describe, expect, it } from 'vitest';
import {
    sliceTaskActivityTimeline,
    taskActivityTimelineHasMore,
    TASK_ACTIVITY_TIMELINE_PAGE_SIZE,
} from './taskActivityTimelineDisplay';

describe('sliceTaskActivityTimeline', () => {
    it('returns empty for null/undefined', () => {
        expect(sliceTaskActivityTimeline(null, false)).toEqual([]);
        expect(sliceTaskActivityTimeline(undefined, false)).toEqual([]);
    });

    it('returns all when length is 0', () => {
        expect(sliceTaskActivityTimeline([], false)).toEqual([]);
    });

    it('returns all when fewer than page size', () => {
        const rows = [1, 2, 3, 4, 5, 6];
        expect(sliceTaskActivityTimeline(rows, false)).toEqual(rows);
        expect(taskActivityTimelineHasMore(rows)).toBe(false);
    });

    it('returns all when exactly page size and collapsed', () => {
        const rows = Array.from({ length: TASK_ACTIVITY_TIMELINE_PAGE_SIZE }, (_, i) => i);
        expect(sliceTaskActivityTimeline(rows, false)).toEqual(rows);
        expect(taskActivityTimelineHasMore(rows)).toBe(false);
    });

    it('slices to first page when collapsed and more than page size', () => {
        const rows = Array.from({ length: TASK_ACTIVITY_TIMELINE_PAGE_SIZE + 3 }, (_, i) => i);
        expect(sliceTaskActivityTimeline(rows, false)).toEqual(
            rows.slice(0, TASK_ACTIVITY_TIMELINE_PAGE_SIZE),
        );
        expect(taskActivityTimelineHasMore(rows)).toBe(true);
    });

    it('returns all when expanded regardless of length', () => {
        const rows = Array.from({ length: 20 }, (_, i) => i);
        expect(sliceTaskActivityTimeline(rows, true)).toEqual(rows);
    });
});
