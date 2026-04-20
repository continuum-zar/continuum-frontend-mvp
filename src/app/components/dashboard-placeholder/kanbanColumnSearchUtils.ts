import type { Task } from "@/types/task";

export function normalizeKanbanSearchQuery(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Filters tasks by title or description (case-insensitive substring). */
export function filterKanbanTasksBySearchQuery(tasks: Task[], rawQuery: string): Task[] {
  const q = normalizeKanbanSearchQuery(rawQuery);
  if (!q) return tasks;
  return tasks.filter((t) => {
    const title = t.title.toLowerCase();
    const desc = (t.description ?? "").toLowerCase();
    return title.includes(q) || desc.includes(q);
  });
}

/**
 * Same as {@link filterKanbanTasksBySearchQuery}, but keeps a task that is mid-drag visible
 * so the row does not unmount during pointer drag when it no longer matches the query.
 */
export function filterKanbanTasksBySearchQueryRespectingDrag(
  tasks: Task[],
  rawQuery: string,
  draggingId: string | null,
): Task[] {
  const filtered = filterKanbanTasksBySearchQuery(tasks, rawQuery);
  if (!draggingId) return filtered;
  if (filtered.some((t) => t.id === draggingId)) return filtered;
  const dragged = tasks.find((t) => t.id === draggingId);
  return dragged ? [...filtered, dragged] : filtered;
}
