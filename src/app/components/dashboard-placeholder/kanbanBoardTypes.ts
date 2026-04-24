import type { KanbanBoardColumnApi } from "@/types/kanban";
import type { Task, TaskPriority, TaskStatus, TaskStatusAPI } from "@/types/task";

/** Higher rank sorts first (top of column). Unknown / missing priority sorts last. */
const PRIORITY_SORT_RANK: Record<TaskPriority, number> = {
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

function prioritySortRank(priority: Task["priority"]): number {
  if (priority == null) return 0;
  return PRIORITY_SORT_RANK[priority] ?? 0;
}

/** To-Do columns: highest priority first. Stable for ties. */
export function sortKanbanTasksByPriorityDescending(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => prioritySortRank(b.priority) - prioritySortRank(a.priority));
}

/** 0–1 completion ratio; 0 when there are no checklist items. */
export function taskChecklistCompletionRatio(task: Task): number {
  const { total, completed } = task.checklists;
  if (total <= 0) return 0;
  return completed / total;
}

/** In-Progress columns: highest checklist completion first. Stable for ties. */
export function sortKanbanTasksByChecklistCompletionDescending(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) => taskChecklistCompletionRatio(b) - taskChecklistCompletionRatio(a),
  );
}

/** Apply column-specific default ordering before rendering (To-Do / In-Progress only). */
export function orderKanbanColumnTasksForDisplay(column: KanbanColumnConfig, tasks: Task[]): Task[] {
  if (column.kind === "todo") return sortKanbanTasksByPriorityDescending(tasks);
  if (column.kind === "in-progress") return sortKanbanTasksByChecklistCompletionDescending(tasks);
  return [...tasks];
}

/** Tooltip / aria copy for column headers: matches {@link orderKanbanColumnTasksForDisplay} behavior. */
export type KanbanColumnAutoSortInfo = {
  description: string;
};

/** When non-null, tasks in this column are auto-sorted; show sort icon next to the title. */
export function kanbanColumnAutoSortInfo(column: KanbanColumnConfig): KanbanColumnAutoSortInfo | null {
  if (column.kind === "todo") {
    return {
      description:
        "Sorted by priority: highest priority at the top. Same priority keeps a stable order.",
    };
  }
  if (column.kind === "in-progress") {
    return {
      description:
        "Sorted by checklist completion: most complete at the top. Same completion keeps a stable order.",
    };
  }
  return null;
}

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

const DEFAULT_KANBAN_COLUMN_IDS = new Set(DEFAULT_KANBAN_COLUMNS.map((c) => c.id));

/** Built-in columns (To-do, In-Progress, Completed) cannot be removed from the board. */
export function isDefaultKanbanColumn(col: KanbanColumnConfig): boolean {
  return DEFAULT_KANBAN_COLUMN_IDS.has(col.id);
}

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
    const prefCol = columns.find((c) => c.id === prefId);
    if (prefCol) return prefId;
  }
  const byStoredId = columns.find((c) => c.id === task.status);
  if (byStoredId) return byStoredId.id;
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

export type { KanbanBoardColumnApi } from "@/types/kanban";

function taskStatusFromApi(s: TaskStatusAPI): TaskStatus {
  if (s === "in_progress") return "in-progress";
  if (s === "todo" || s === "done") return s;
  return s;
}

function taskStatusToApi(s: TaskStatus): TaskStatusAPI {
  if (s === "in-progress") return "in_progress";
  return s;
}

/** Map persisted board columns to UI `KanbanColumnConfig`. */
export function mapKanbanBoardFromApi(columns: KanbanBoardColumnApi[]): KanbanColumnConfig[] {
  return columns.map((c) => ({
    id: c.id,
    title: c.title,
    taskStatus: taskStatusFromApi(c.task_status),
    kind: taskStatusFromApi(c.kind) as KanbanColumnKind,
  }));
}

/** Map UI columns to API payload. */
export function mapKanbanBoardToApi(columns: KanbanColumnConfig[]): KanbanBoardColumnApi[] {
  return columns.map((c) => ({
    id: c.id,
    title: c.title,
    task_status: taskStatusToApi(c.taskStatus),
    kind: taskStatusToApi(c.kind as TaskStatus),
  }));
}
