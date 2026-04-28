"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Gantt, ViewMode, type Task as GanttTask } from "gantt-task-react";
import "gantt-task-react/dist/index.css";


import type { Member } from "@/types/member";
import type { Task } from "@/types/task";

import {
  assigneeNames,
  ganttViewDateForTasks,
  taskGanttStartEnd,
  taskProgressPct,
} from "./sprintViewScheduleUtils";

export type GanttChartViewProps = {
  tasks: Task[];
  members: Member[];
  milestoneNameById?: Record<string, string>;
  onOpenTask?: (taskId: string) => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
};
const GANTT_COLUMN_WIDTH_DAY = 42;
const GANTT_PRE_STEPS_DAY = 1;

type TaskListHeaderProps = {
  headerHeight: number;
  rowWidth: string;
  fontFamily: string;
  fontSize: string;
};

type TaskListTableProps = {
  rowHeight: number;
  rowWidth: string;
  fontFamily: string;
  fontSize: string;
  locale: string;
  tasks: GanttTask[];
  selectedTaskId: string;
  setSelectedTask: (taskId: string) => void;
  onExpanderClick: (task: GanttTask) => void;
};

type TooltipProps = {
  task: GanttTask;
  fontSize: string;
  fontFamily: string;
};

function truncateLabel(value: string, maxChars: number): string {
  const text = value.trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function startOfDayDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function formatIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

// Header defined inside GanttChartView as useCallback so it can access the resize state via refs.

function GanttNameOnlyTable({
  rowHeight,
  rowWidth,
  fontFamily,
  fontSize,
  tasks,
  selectedTaskId,
  setSelectedTask,
}: TaskListTableProps) {
  return (
    <div style={{ width: rowWidth, fontFamily, fontSize }}>
      {tasks.map((task, index) => {
        const isSelected = selectedTaskId === task.id;
        const isParent = task.id.startsWith("milestone-");
        return (
          <div
            key={task.id}
            className={`flex items-center border-b border-[#edf1f4] px-2 ${
              index % 2 === 0 ? "bg-white" : "bg-[#fbfcfd]"
            } ${isSelected ? "ring-1 ring-inset ring-[#c7d3da]" : ""}`}
            style={{ height: rowHeight }}
          >
            <span className="mr-1 inline-flex size-5 shrink-0" aria-hidden />
            <button
              type="button"
              className={`min-w-0 flex-1 truncate text-left ${
                isParent ? "font-semibold text-[#2f3d45]" : "text-[#3c4b53]"
              }`}
              title={task.name}
              onClick={() => setSelectedTask(task.id)}
            >
              {task.name}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function GanttTaskTooltip({ task, fontSize, fontFamily }: TooltipProps) {
  const isMilestone = task.type === "project";
  return (
    <div
      className="w-[260px] rounded-[10px] border border-[#dce4ea] bg-white p-3 shadow-[0_8px_24px_rgba(11,25,31,0.12)]"
      style={{ fontFamily, fontSize }}
    >
      <p className="truncate text-[13px] font-semibold text-[#1d2b33]" title={task.name}>
        {task.name}
      </p>
      <div className="mt-2 space-y-1 text-[12px] text-[#5b6870]">
        <p>
          <span className="font-medium text-[#36454d]">From:</span> {formatShortDate(task.start)}
        </p>
        <p>
          <span className="font-medium text-[#36454d]">To:</span> {formatShortDate(task.end)}
        </p>
        <p>
          <span className="font-medium text-[#36454d]">Progress:</span> {task.progress}%
        </p>
        <p>
          <span className="font-medium text-[#36454d]">Type:</span> {isMilestone ? "Milestone" : "Task"}
        </p>
      </div>
    </div>
  );
}

export function GanttChartView({
  tasks,
  members,
  milestoneNameById = {},
  onOpenTask,
  scrollRef,
}: GanttChartViewProps) {
  const memberByUserId = useMemo(() => new Map(members.map((m) => [m.userId, m])), [members]);
  const [collapsedMilestones, setCollapsedMilestones] = useState<Record<string, boolean>>({});
  const ganttRootRef = useRef<HTMLDivElement | null>(null);

  // Resizable name column
  const [listCellWidth, setListCellWidth] = useState(340);
  const listCellWidthRef = useRef(340);
  const dragStartRef = useRef({ x: 0, startWidth: 340 });

  const GanttNameOnlyHeader = useCallback(
    ({ headerHeight, rowWidth, fontFamily, fontSize }: TaskListHeaderProps) => {
      const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        dragStartRef.current = { x: e.clientX, startWidth: listCellWidthRef.current };
        const onMove = (ev: PointerEvent) => {
          const newWidth = Math.max(160, Math.min(680, dragStartRef.current.startWidth + ev.clientX - dragStartRef.current.x));
          listCellWidthRef.current = newWidth;
          setListCellWidth(newWidth);
        };
        const onUp = () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      };
      return (
        <div
          className="relative flex items-center border-b border-[#e9edf0] bg-[#f8fafb] px-3 text-[#4c5961]"
          style={{ height: headerHeight, width: rowWidth, fontFamily, fontSize }}
        >
          <span className="font-medium">Name</span>
          {/* Drag handle */}
          <div
            className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none bg-transparent transition-colors hover:bg-[#c7d3da]/60 active:bg-[#a8b8c2]/80"
            onPointerDown={onPointerDown}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize name column"
          />
        </div>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (scrollRef && ganttRootRef.current) {
      // Find the first scrollable container inside gantt-task-react
      // which is typically responsible for horizontal scrolling in the chart timeline.
      const timelineScrollContainer = Array.from(ganttRootRef.current.querySelectorAll("div")).find(
        (el) => {
          const style = window.getComputedStyle(el);
          return style.overflowX === "auto" || style.overflowX === "scroll";
        }
      );
      if (timelineScrollContainer) {
        (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = timelineScrollContainer;
      }
    }
  });

  const ganttTasks: GanttTask[] = useMemo(() => {
    const grouped = new Map<string, Task[]>();
    for (const task of tasks) {
      const key = task.milestoneId?.trim() || "none";
      const bucket = grouped.get(key);
      if (bucket) {
        bucket.push(task);
      } else {
        grouped.set(key, [task]);
      }
    }

    const out: GanttTask[] = [];
    const keys = [...grouped.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    for (const key of keys) {
      const milestoneTasks = grouped.get(key) ?? [];
      if (milestoneTasks.length === 0) continue;

      const childRows: GanttTask[] = milestoneTasks.map((task) => {
        const { start, end } = taskGanttStartEnd(task);
        const names = assigneeNames(task, memberByUserId);
        const rowLabel = truncateLabel(`${task.title} · ${names}`, 66);
        return {
          id: `task-${task.id}`,
          type: "task",
          name: rowLabel,
          start,
          end,
          progress: taskProgressPct(task),
          project: `milestone-${key}`,
          styles: {
            backgroundColor: "#cfecff",
            backgroundSelectedColor: "#9bd8ff",
            progressColor: "#043e59",
            progressSelectedColor: "#0b191f",
          },
        };
      });
      const orderedChildren = [...childRows].sort(
        (a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime(),
      );
      for (let i = 1; i < orderedChildren.length; i += 1) {
        orderedChildren[i]!.dependencies = [orderedChildren[i - 1]!.id];
      }

      const milestoneStart = childRows.reduce(
        (min, row) => (row.start < min ? row.start : min),
        childRows[0]!.start,
      );
      const milestoneEnd = childRows.reduce(
        (max, row) => (row.end > max ? row.end : max),
        childRows[0]!.end,
      );
      const milestoneProgress = Math.round(
        childRows.reduce((sum, row) => sum + row.progress, 0) / childRows.length,
      );

      out.push({
        id: `milestone-${key}`,
        type: "task",
        name: truncateLabel(
          key === "none"
            ? "Unscheduled milestone"
            : milestoneNameById[key] ?? milestoneNameById[String(Number(key))] ?? `Milestone ${key}`,
          44,
        ),
        start: milestoneStart,
        end: milestoneEnd,
        progress: milestoneProgress,
        hideChildren: collapsedMilestones[key] ?? false,
        styles: {
          backgroundColor: "#d1d5db",
          backgroundSelectedColor: "#b8bec4",
          progressColor: "#0b191f",
          progressSelectedColor: "#1a2e3a",
        },
      });
      out.push(...orderedChildren);
    }

    return out;
  }, [tasks, memberByUserId, collapsedMilestones]);

  const viewDate = useMemo(() => ganttViewDateForTasks(tasks), [tasks]);
  const dayHeaderDates = useMemo(() => {
    if (ganttTasks.length === 0) return [];
    let minStart = ganttTasks[0]!.start;
    let maxEnd = ganttTasks[0]!.end;
    for (const row of ganttTasks) {
      if (row.start < minStart) minStart = row.start;
      if (row.end > maxEnd) maxEnd = row.end;
    }
    const start = addDays(startOfDayDate(minStart), -GANTT_PRE_STEPS_DAY);
    const end = addDays(startOfDayDate(maxEnd), 19);
    const dates: Date[] = [];
    let cursor = new Date(start);
    while (cursor < end) {
      dates.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    }
    return dates;
  }, [ganttTasks]);

  useEffect(() => {
    const root = ganttRootRef.current;
    if (!root || dayHeaderDates.length === 0) return;
    const svg = root.querySelector("svg");
    if (!(svg instanceof SVGSVGElement)) return;

    const bottomTexts = root.querySelectorAll<SVGTextElement>("._9w8d5");
    bottomTexts.forEach((node, idx) => {
      const date = dayHeaderDates[idx];
      if (!date) return;
      node.textContent = String(date.getDate());
      node.setAttribute("style", "cursor: help;");
      const existingTitle = node.querySelector("title");
      if (existingTitle) existingTitle.remove();
      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = formatIsoDate(date);
      node.appendChild(title);
    });

    svg.querySelectorAll('[data-gantt-week-label="1"]').forEach((n) => n.remove());
    for (let i = 0; i < dayHeaderDates.length; i += 7) {
      const date = dayHeaderDates[i]!;
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("data-gantt-week-label", "1");
      text.setAttribute("x", String(GANTT_COLUMN_WIDTH_DAY * i + GANTT_COLUMN_WIDTH_DAY * 0.5));
      text.setAttribute("y", "14");
      text.setAttribute("fill", "#37434b");
      text.setAttribute("font-size", "12");
      text.setAttribute("font-family", "'Satoshi', sans-serif");
      text.textContent = formatIsoDate(date);
      svg.appendChild(text);
    }
  }, [dayHeaderDates]);

  if (tasks.length === 0) {
    return (
      <div
        className="flex min-h-[280px] w-full flex-1 items-center justify-center rounded-[8px] border border-[#ebedee] bg-[#f9fafb] px-4 font-['Satoshi',sans-serif] text-[14px] text-[#727d83]"
        role="status"
      >
        No tasks in this sprint — add tasks to see the Gantt chart.
      </div>
    );
  }

  return (
    <div
      ref={ganttRootRef}
      className="gantt-readable scrollbar-none flex w-full min-w-0 flex-1 flex-col overflow-auto rounded-[8px] border border-[#ebedee] bg-white font-['Satoshi',sans-serif]"
      role="region"
      aria-label="Gantt chart of sprint tasks"
    >
      <div className="min-h-[min(70vh,720px)] w-full min-w-[640px]">
        <Gantt
          tasks={ganttTasks}
          viewMode={ViewMode.Day}
          viewDate={viewDate}
          listCellWidth={`${listCellWidth}px`}
          columnWidth={GANTT_COLUMN_WIDTH_DAY}
          rowHeight={36}
          preStepsCount={GANTT_PRE_STEPS_DAY}
          barCornerRadius={4}
          barProgressColor="#043e59"
          barProgressSelectedColor="#0b191f"
          barBackgroundColor="#cfecff"
          barBackgroundSelectedColor="#9bd8ff"
          fontFamily="'Satoshi', sans-serif"
          fontSize="13px"
          TaskListHeader={GanttNameOnlyHeader}
          TaskListTable={GanttNameOnlyTable}
          TooltipContent={GanttTaskTooltip}
          onExpanderClick={(milestone) => {
            if (!milestone.id.startsWith("milestone-")) return;
            const key = milestone.id.slice("milestone-".length);
            setCollapsedMilestones((prev) => ({ ...prev, [key]: !prev[key] }));
          }}
          onClick={(t) => {
            if (!t.id.startsWith("task-")) return;
            onOpenTask?.(t.id.slice("task-".length));
          }}
          onDoubleClick={(t) => {
            if (!t.id.startsWith("task-")) return;
            onOpenTask?.(t.id.slice("task-".length));
          }}
        />
      </div>
      <style>{`
        .gantt-readable ._3lLk3 {
          padding-inline: 10px;
          font-size: 12px;
          line-height: 1.3;
          color: #27333a;
        }
        .gantt-readable ._34SS0 {
          min-height: 36px;
        }
        .gantt-readable ._2QjE6 {
          padding-right: 6px;
          font-size: 11px;
          color: #4b5961;
        }
        .gantt-readable ._3zRJQ {
          display: none;
        }
        .gantt-readable ._2q1Kt {
          display: none;
        }
        /* Hide ALL native scrollbars inside the gantt library */
        .gantt-readable * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .gantt-readable *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `}</style>
    </div>
  );
}
