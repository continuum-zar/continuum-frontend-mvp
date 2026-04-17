import { describe, expect, it } from "vitest";

import {
  DEFAULT_KANBAN_COLUMNS,
  firstColumnIdForStatus,
  newKanbanColumnId,
  resolveTaskColumnId,
  tasksForKanbanColumn,
} from "./kanbanBoardTypes";
import type { Task } from "@/types/task";

function task(over: Partial<Task> & Pick<Task, "id" | "status">): Task {
  return {
    id: over.id,
    title: over.title ?? "T",
    description: over.description ?? "",
    status: over.status,
    scope: over.scope ?? "M",
    assignees: over.assignees ?? [],
    attachments: over.attachments ?? 0,
    comments: over.comments ?? 0,
    checklists: over.checklists ?? { total: 0, completed: 0 },
    milestoneId: over.milestoneId ?? "m1",
  };
}

describe("kanbanBoardTypes", () => {
  it("routes tasks to the first column for each status when there is no preference", () => {
    const extraTodo = { id: "col-backlog", title: "Backlog", taskStatus: "todo" as const, kind: "todo" as const };
    const columns = [extraTodo, ...DEFAULT_KANBAN_COLUMNS];
    const t = task({ id: "1", status: "todo" });
    expect(resolveTaskColumnId(t, columns, {})).toBe("col-backlog");
    expect(tasksForKanbanColumn([t], extraTodo, columns, {}).map((x) => x.id)).toEqual(["1"]);
    expect(tasksForKanbanColumn([t], DEFAULT_KANBAN_COLUMNS[0]!, columns, {}).length).toBe(0);
  });

  it("respects per-task column preference when it matches task status", () => {
    const extraTodo = { id: "col-backlog", title: "Backlog", taskStatus: "todo" as const, kind: "todo" as const };
    const columns = [extraTodo, ...DEFAULT_KANBAN_COLUMNS];
    const t = task({ id: "1", status: "todo" });
    const prefs = { "1": "todo" };
    expect(resolveTaskColumnId(t, columns, prefs)).toBe("todo");
    expect(tasksForKanbanColumn([t], DEFAULT_KANBAN_COLUMNS[0]!, columns, prefs).map((x) => x.id)).toEqual(["1"]);
  });

  it("firstColumnIdForStatus returns the first matching column in order", () => {
    const extra = { id: "x", title: "X", taskStatus: "todo" as const, kind: "todo" as const };
    const columns = [extra, ...DEFAULT_KANBAN_COLUMNS];
    expect(firstColumnIdForStatus(columns, "todo")).toBe("x");
  });

  it("newKanbanColumnId returns a non-empty string", () => {
    expect(newKanbanColumnId().length).toBeGreaterThan(4);
  });
});
