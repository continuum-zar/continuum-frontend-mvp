import { describe, expect, it } from "vitest";

import {
  DEFAULT_KANBAN_COLUMNS,
  firstColumnIdForStatus,
  kanbanColumnAutoSortInfo,
  newKanbanColumnId,
  orderKanbanColumnTasksForDisplay,
  resolveTaskColumnId,
  sortKanbanTasksByChecklistCompletionDescending,
  sortKanbanTasksByPriorityDescending,
  taskChecklistCompletionRatio,
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
    priority: over.priority,
    assignees: over.assignees ?? [],
    attachments: over.attachments ?? 0,
    comments: over.comments ?? 0,
    checklists: over.checklists ?? { total: 0, completed: 0 },
    milestoneId: over.milestoneId ?? "m1",
  };
}

describe("kanbanBoardTypes", () => {
  it("resolves by column id matching task.status before first todo-kind column when there is no preference", () => {
    const extraTodo = { id: "col-backlog", title: "Backlog", taskStatus: "todo" as const, kind: "todo" as const };
    const columns = [extraTodo, ...DEFAULT_KANBAN_COLUMNS];
    const t = task({ id: "1", status: "todo" });
    expect(resolveTaskColumnId(t, columns, {})).toBe("todo");
    expect(tasksForKanbanColumn([t], DEFAULT_KANBAN_COLUMNS[0]!, columns, {}).map((x) => x.id)).toEqual(["1"]);
    expect(tasksForKanbanColumn([t], extraTodo, columns, {}).length).toBe(0);
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

  it("sortKanbanTasksByPriorityDescending orders high before low and unknowns last", () => {
    const a = task({ id: "a", status: "todo", priority: "low" });
    const b = task({ id: "b", status: "todo", priority: "high" });
    const c = task({ id: "c", status: "todo" });
    const d = task({ id: "d", status: "todo", priority: "medium" });
    expect(sortKanbanTasksByPriorityDescending([a, b, c, d]).map((t) => t.id)).toEqual(["b", "d", "a", "c"]);
  });

  it("sortKanbanTasksByChecklistCompletionDescending orders by ratio descending", () => {
    const half = task({ id: "half", status: "in-progress", checklists: { total: 2, completed: 1 } });
    const full = task({ id: "full", status: "in-progress", checklists: { total: 4, completed: 4 } });
    const none = task({ id: "none", status: "in-progress", checklists: { total: 0, completed: 0 } });
    const quarter = task({ id: "quarter", status: "in-progress", checklists: { total: 4, completed: 1 } });
    expect(sortKanbanTasksByChecklistCompletionDescending([half, full, none, quarter]).map((t) => t.id)).toEqual([
      "full",
      "half",
      "quarter",
      "none",
    ]);
  });

  it("taskChecklistCompletionRatio is 0 when total is 0", () => {
    const t = task({ id: "x", status: "in-progress", checklists: { total: 0, completed: 0 } });
    expect(taskChecklistCompletionRatio(t)).toBe(0);
  });

  it("orderKanbanColumnTasksForDisplay applies todo vs in-progress vs done", () => {
    const todoCol = DEFAULT_KANBAN_COLUMNS[0]!;
    const progCol = DEFAULT_KANBAN_COLUMNS[1]!;
    const doneCol = DEFAULT_KANBAN_COLUMNS[2]!;
    const t1 = task({ id: "1", status: "todo", priority: "low" });
    const t2 = task({ id: "2", status: "todo", priority: "high" });
    expect(orderKanbanColumnTasksForDisplay(todoCol, [t1, t2]).map((x) => x.id)).toEqual(["2", "1"]);

    const p1 = task({ id: "p1", status: "in-progress", checklists: { total: 2, completed: 1 } });
    const p2 = task({ id: "p2", status: "in-progress", checklists: { total: 2, completed: 2 } });
    expect(orderKanbanColumnTasksForDisplay(progCol, [p1, p2]).map((x) => x.id)).toEqual(["p2", "p1"]);

    const d1 = task({ id: "d1", status: "done" });
    const d2 = task({ id: "d2", status: "done" });
    expect(orderKanbanColumnTasksForDisplay(doneCol, [d1, d2]).map((x) => x.id)).toEqual(["d1", "d2"]);
  });

  it("kanbanColumnAutoSortInfo matches columns that use auto-sort in orderKanbanColumnTasksForDisplay", () => {
    expect(kanbanColumnAutoSortInfo(DEFAULT_KANBAN_COLUMNS[0]!)?.description).toMatch(/priority/i);
    expect(kanbanColumnAutoSortInfo(DEFAULT_KANBAN_COLUMNS[1]!)?.description).toMatch(/checklist/i);
    expect(kanbanColumnAutoSortInfo(DEFAULT_KANBAN_COLUMNS[2]!)).toBeNull();
  });
});
