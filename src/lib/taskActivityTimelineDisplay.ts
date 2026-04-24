/** Default page size for task activity timeline “Show more” (welcome feed uses its own constant). */
export const TASK_ACTIVITY_TIMELINE_PAGE_SIZE = 7;

export function sliceTaskActivityTimeline<T>(
    entries: readonly T[] | null | undefined,
    expanded: boolean,
    pageSize: number = TASK_ACTIVITY_TIMELINE_PAGE_SIZE,
): T[] {
    const list = entries ?? [];
    if (expanded || list.length <= pageSize) return [...list];
    return list.slice(0, pageSize);
}

export function taskActivityTimelineHasMore(
    entries: readonly unknown[] | null | undefined,
    pageSize: number = TASK_ACTIVITY_TIMELINE_PAGE_SIZE,
): boolean {
    return (entries?.length ?? 0) > pageSize;
}
