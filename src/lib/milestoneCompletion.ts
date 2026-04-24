import type { MilestoneProgressPayload, MilestoneStatus } from "@/types/milestone";

/**
 * True when every task linked to the milestone is in the completed state
 * (backend `completed_tasks` vs `total_tasks` from milestone progress).
 */
export function milestoneTasksAllCompleted(
    progress: MilestoneProgressPayload | null | undefined,
): boolean {
    if (!progress) return false;
    const total = Number(progress.total_tasks);
    if (!Number.isFinite(total) || total <= 0) return false;
    const completed = Number(progress.completed_tasks);
    if (!Number.isFinite(completed)) return false;
    return completed >= total;
}

/** Timeline icon: completed column full, or milestone already marked completed on the server. */
export function milestoneTimelineShowsCompletedIcon(
    progress: MilestoneProgressPayload | null | undefined,
    milestoneStatus: MilestoneStatus | undefined,
): boolean {
    return milestoneTasksAllCompleted(progress) || milestoneStatus === "completed";
}
