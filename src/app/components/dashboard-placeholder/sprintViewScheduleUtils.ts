import { addDays, endOfDay, max, min, startOfDay, subDays } from "date-fns";

import type { Member } from "@/types/member";
import type { Task } from "@/types/task";

export function parseTaskDueDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseTaskCreatedDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function assigneeNames(task: Task, memberByUserId: Map<number, Member>): string {
  const ids = task.assignees.map((s) => Number(s)).filter((n) => Number.isFinite(n));
  const names = ids.map((id) => memberByUserId.get(id)?.name).filter(Boolean) as string[];
  return names.length ? names.join(", ") : "Unassigned";
}

export function taskProgressPct(task: Task): number {
  const { total, completed } = task.checklists;
  if (total <= 0) return 0;
  return Math.min(100, Math.round((completed / total) * 100));
}

/** Gantt bar range: created → due when possible; otherwise a short window around due or today. */
export function taskGanttStartEnd(task: Task): { start: Date; end: Date } {
  const due = parseTaskDueDate(task.dueDate);
  const created = parseTaskCreatedDate(task.createdAtIso ?? null);

  if (due) {
    const end = endOfDay(due);
    let start = created ? startOfDay(created) : startOfDay(subDays(due, 7));
    if (start >= end) start = startOfDay(subDays(end, 1));
    return { start, end };
  }

  const anchor = created ? startOfDay(created) : startOfDay(new Date());
  return { start: anchor, end: endOfDay(addDays(anchor, 1)) };
}

export function ganttViewDateForTasks(tasks: Task[]): Date {
  if (tasks.length === 0) return new Date();
  const centers = tasks.map((t) => {
    const { start, end } = taskGanttStartEnd(t);
    return new Date((start.getTime() + end.getTime()) / 2);
  });
  return centers.reduce((a, b) => new Date((a.getTime() + b.getTime()) / 2));
}

export function calendarRangeForTasks(tasks: Task[], padDays = 45): { timeMin: Date; timeMax: Date } {
  const dates: Date[] = [];
  for (const t of tasks) {
    const d = parseTaskDueDate(t.dueDate);
    if (d) dates.push(startOfDay(d));
  }
  const mid = new Date();
  if (dates.length === 0) {
    return { timeMin: subDays(mid, padDays), timeMax: addDays(mid, padDays) };
  }
  const lo = min(dates);
  const hi = max(dates);
  return { timeMin: subDays(lo, padDays), timeMax: addDays(hi, padDays) };
}
