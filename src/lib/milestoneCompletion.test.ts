import { describe, expect, it } from "vitest";

import { milestoneTasksAllCompleted, milestoneTimelineShowsCompletedIcon } from "./milestoneCompletion";

describe("milestoneTasksAllCompleted", () => {
    it("returns false when progress is missing", () => {
        expect(milestoneTasksAllCompleted(undefined)).toBe(false);
        expect(milestoneTasksAllCompleted(null)).toBe(false);
    });

    it("returns false when there are no linked tasks", () => {
        expect(
            milestoneTasksAllCompleted({
                total_tasks: 0,
                completed_tasks: 0,
                in_progress_tasks: 0,
                todo_tasks: 0,
                completion_percentage: 0,
            }),
        ).toBe(false);
    });

    it("returns false when some tasks remain incomplete", () => {
        expect(
            milestoneTasksAllCompleted({
                total_tasks: 3,
                completed_tasks: 2,
                in_progress_tasks: 1,
                todo_tasks: 0,
                completion_percentage: 66,
            }),
        ).toBe(false);
    });

    it("returns true when every linked task is completed", () => {
        expect(
            milestoneTasksAllCompleted({
                total_tasks: 4,
                completed_tasks: 4,
                in_progress_tasks: 0,
                todo_tasks: 0,
                completion_percentage: 100,
            }),
        ).toBe(true);
    });
});

describe("milestoneTimelineShowsCompletedIcon", () => {
    it("uses progress when present", () => {
        expect(
            milestoneTimelineShowsCompletedIcon(
                {
                    total_tasks: 2,
                    completed_tasks: 2,
                    in_progress_tasks: 0,
                    todo_tasks: 0,
                    completion_percentage: 100,
                },
                "active",
            ),
        ).toBe(true);
    });

    it("falls back to milestone status completed when progress is absent", () => {
        expect(milestoneTimelineShowsCompletedIcon(undefined, "completed")).toBe(true);
        expect(milestoneTimelineShowsCompletedIcon(undefined, "active")).toBe(false);
    });
});
