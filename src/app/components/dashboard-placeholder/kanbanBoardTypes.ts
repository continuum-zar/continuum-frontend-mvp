import type { Task, TaskStatus } from "@/types/task";

export type KanbanColumnKind = "todo" | "in-progress" | "done";

/** One swimlane column on the board; `taskStatus` is what the API accepts on drop. */
export type KanbanColumnConfig = {
  id: string;
  title: string;
  taskStatus: TaskStatus;
  kind: KanbanColumnKind;
};

export const DEFAULT_KANBAN_COLUMNS: KanbanColumnConfig[] = [
  { id: "todo", title: "To-do", taskStatus: "todo", kind: "todo" },
  { id: "in-progress", title: "In-Progress", taskStatus: "in-progress", kind: "in-progress" },
  { id: "completed", title: "Completed", taskStatus: "done", kind: "done" },
];

export function kindForTaskStatus(status: TaskStatus): KanbanColumnKind {
  if (status === "done") return "done";
  if (status === "in-progress") return "in-progress";
  return "todo";
}

export function resolveTaskColumnId(
  task: Task,
  columns: KanbanColumnConfig[],
  preferenceByTaskId: Record<string, string>,
): string {
  const prefId = preferenceByTaskId[task.id];
  if (prefId) {
    const col = columns.find((c) => c.id === prefId);
    if (col && col.taskStatus === task.status) return prefId;
  }
  const first = columns.find((c) => c.taskStatus === task.status);
  return first?.id ?? columns[0]!.id;
}

export function firstColumnIdForStatus(columns: KanbanColumnConfig[], status: TaskStatus): string {
  return columns.find((c) => c.taskStatus === status)?.id ?? columns[0]!.id;
}

export function tasksForKanbanColumn(
  tasks: Task[],
  column: KanbanColumnConfig,
  columns: KanbanColumnConfig[],
  preferenceByTaskId: Record<string, string>,
): Task[] {
  return tasks.filter((t) => resolveTaskColumnId(t, columns, preferenceByTaskId) === column.id);
}

export function newKanbanColumnId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `col-${crypto.randomUUID()}`;
  return `col-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
