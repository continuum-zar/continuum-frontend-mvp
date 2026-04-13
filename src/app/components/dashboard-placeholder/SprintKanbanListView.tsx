"use client";

import type { DragEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ChevronDown, GripVertical } from "lucide-react";

import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";
import { memberAvatarBackground } from "@/lib/memberAvatar";
import type { Member } from "@/types/member";
import type { Task } from "@/types/task";
import { workspaceJoin } from "@/lib/workspacePaths";
import { cn } from "../ui/utils";

const imgLucideListTodo = mcpAsset("2a12c1eb-b745-4bea-b9f1-f67045f8c03a");
const imgLucideSquircleDashed = mcpAsset("e2efeca9-31cd-4cf9-ac56-b2799ee8a450");
const imgLucideCircleCheckBig = mcpAsset("244bb570-3aed-481d-8cf9-f067c69c50b0");
const imgLucideSearch1 = mcpAsset("c5ee61c3-f628-42e7-b456-58f9c49a5cfe");
const imgVector10 = mcpAsset("0d58a9e0-9d27-4eb3-ad07-b2ad64a15f10");
const imgVector11 = mcpAsset("4912f83a-d378-4c38-9bf2-ce38aa20cc19");
const imgLucideFlag = mcpAsset("299f17ae-de59-4012-9bb8-ae6509081405");
const imgFrame308 = mcpAsset("5b22b8e9-bd31-437e-a559-232247be56a0");
const imgLucideEllipsis = mcpAsset("9baf5fcb-1676-4740-8a31-f190f218b100");

type ColumnKey = "todo" | "in-progress" | "completed";

function formatDueLong(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

export type SprintKanbanListViewProps = {
  tasks: Task[];
  members: Member[];
  projectId: number;
  milestoneId: string | null;
  onCreateTask: () => void;
  /** Drag-and-drop between sections — same behavior as board view. */
  draggingId: string | null;
  dragOverCol: ColumnKey | null;
  onTaskDragStart: (taskId: string) => (e: DragEvent<HTMLDivElement>) => void;
  onTaskDragEnd: () => void;
  onTaskDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onColumnDragOver: (col: ColumnKey) => (e: DragEvent<HTMLDivElement>) => void;
  onColumnDragLeave: (col: ColumnKey) => (e: DragEvent<HTMLDivElement>) => void;
  onColumnDrop: (col: ColumnKey) => (e: DragEvent<HTMLDivElement>) => void;
};

export function SprintKanbanListView({
  tasks,
  members,
  projectId,
  milestoneId,
  onCreateTask,
  draggingId,
  dragOverCol,
  onTaskDragStart,
  onTaskDragEnd,
  onTaskDragOver,
  onColumnDragOver,
  onColumnDragLeave,
  onColumnDrop,
}: SprintKanbanListViewProps) {
  void projectId;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const memberByUserId = useMemo(() => new Map(members.map((m) => [m.userId, m])), [members]);

  const [expanded, setExpanded] = useState<Record<ColumnKey, boolean>>({
    todo: true,
    "in-progress": true,
    completed: true,
  });

  const byColumn = useMemo(() => {
    return {
      todo: tasks.filter((t) => t.status === "todo"),
      "in-progress": tasks.filter((t) => t.status === "in-progress"),
      completed: tasks.filter((t) => t.status === "done"),
    };
  }, [tasks]);

  const toggle = (col: ColumnKey) => {
    setExpanded((e) => ({ ...e, [col]: !e[col] }));
  };

  const renderRow = (task: Task, col: ColumnKey) => {
    const isDragging = draggingId === task.id;
    const desc = task.description?.trim() ?? "";
    const descPreview =
      desc.length > 120 ? `${desc.slice(0, 117).trim()}…` : desc;
    const { total: checklistTotal, completed: checklistDone } = task.checklists;
    const checklistPct =
      checklistTotal > 0 ? Math.min(100, Math.round((checklistDone / checklistTotal) * 100)) : 0;
    const progressFraction = checklistTotal > 0 ? checklistPct / 100 : 0;
    const assigneeUserId =
      task.assignees.length > 0 && task.assignees[0] ? Number(task.assignees[0]) : null;
    const assignee =
      assigneeUserId != null && Number.isFinite(assigneeUserId)
        ? memberByUserId.get(assigneeUserId)
        : undefined;
    const assigneeMissing = assigneeUserId != null && assignee == null;

    return (
      <div
        key={task.id}
        draggable
        onDragStart={onTaskDragStart(task.id)}
        onDragEnd={onTaskDragEnd}
        onDragOver={onTaskDragOver}
        onDrop={(e) => {
          e.stopPropagation();
          onColumnDrop(col)(e);
        }}
        onClick={() =>
          navigate(`${workspaceJoin("task", String(task.id))}?${searchParams.toString()}`)
        }
        className={cn(
          "w-full select-none transition-opacity duration-100",
          isDragging ? "cursor-grabbing opacity-0" : "cursor-grab",
        )}
      >
        <div
          className={cn(
            "list-kanban-drag-surface bg-white content-stretch flex w-full gap-[24px] border-solid px-[16px] py-[6px] text-left transition-colors hover:bg-[#fafbfc]",
            isDragging ? "border-2 border-[#24B5F8]" : "border-b border-[#ebedee]",
          )}
        >
        <div className="content-stretch flex w-[380px] shrink-0 items-center gap-[8px]">
          <GripVertical className="size-4 shrink-0 text-[#9fa5a8]" aria-hidden />
          <p className="font-['Satoshi:Medium',sans-serif] relative min-w-0 shrink truncate text-[16px] text-[#131617]">
            {task.title}
          </p>
        </div>
        <p
          className="font-['Satoshi:Medium',sans-serif] relative h-[38px] w-[245px] shrink-0 overflow-hidden text-[14px] leading-[1.35] text-[#727d83]"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {descPreview || "—"}
        </p>
        <div className="content-stretch flex w-[72px] shrink-0 items-center justify-start pr-[8px]">
          {assignee ? (
            <div
              className="content-stretch flex size-[24px] shrink-0 items-center justify-center rounded-[999px] border border-solid border-white"
              style={{ backgroundColor: memberAvatarBackground(assignee.userId) }}
              title={assignee.name}
            >
              <span className="font-['Satoshi:Medium',sans-serif] text-[9px] leading-[0.4] text-white">
                {assignee.initials}
              </span>
            </div>
          ) : assigneeMissing ? (
            <div
              className="flex size-[24px] shrink-0 items-center justify-center rounded-[999px] border border-solid border-[#e4e8eb] bg-[#f5f7f8]"
              title={`Assignee (user #${assigneeUserId})`}
            >
              <span className="font-['Satoshi:Medium',sans-serif] text-[9px] text-[#727d83]">?</span>
            </div>
          ) : (
            <span className="font-['Satoshi:Medium',sans-serif] truncate text-[12px] text-[#727d83]">—</span>
          )}
        </div>
        <p className="font-['Satoshi:Medium',sans-serif] w-[124px] shrink-0 overflow-hidden text-[14px] text-ellipsis whitespace-nowrap text-[#697378]">
          {formatDueLong(task.dueDate)}
        </p>
        <div className="content-stretch flex w-[52px] shrink-0 items-center justify-center">
          <div className="relative size-[16px] shrink-0" title={`Scope: ${task.scope}`}>
            <img alt="" className="absolute block max-w-none size-full" src={imgLucideFlag} />
          </div>
        </div>
        <div className="content-stretch flex min-h-px min-w-0 flex-[1_0_0] flex-col items-start">
          <div
            className="relative w-full py-[3px]"
            role="progressbar"
            aria-valuenow={checklistPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Checklist progress"
          >
            <div className="relative mx-[6px] h-2 overflow-hidden rounded-[4px] bg-[#e4e8eb]">
              <div
                className="absolute inset-y-0 left-0 rounded-[4px] bg-[#0b191f]"
                style={{ width: `${checklistPct}%` }}
              />
            </div>
            <div
              className="pointer-events-none absolute top-1/2 z-[1] size-[12px] -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `calc(6px + (100% - 12px) * ${progressFraction})`,
              }}
              aria-hidden
            >
              <div className="absolute inset-[-33.33%]">
                <img alt="" className="block max-w-none size-full" src={imgFrame308} />
              </div>
            </div>
          </div>
        </div>
        <div
          className="content-stretch flex size-[24px] shrink-0 items-center justify-center"
          aria-hidden
        >
          <div className="relative size-[16px] shrink-0">
            <img alt="" className="absolute block max-w-none size-full" src={imgLucideEllipsis} />
          </div>
        </div>
        </div>
      </div>
    );
  };

  const section = (
    col: ColumnKey,
    label: string,
    iconSrc: string,
    headerRight: ReactNode,
    emptyMsg: string,
  ) => {
    const list = byColumn[col];
    const isOpen = expanded[col];

    return (
      <div
        key={col}
        className="content-stretch flex w-full flex-col items-start overflow-clip rounded-tl-[8px] rounded-tr-[8px]"
      >
        <div className="flex w-full min-w-0 shrink-0 items-center justify-between gap-3 py-[8px]">
          <button
            type="button"
            onClick={() => toggle(col)}
            className="flex min-w-0 max-w-[min(100%,520px)] cursor-pointer items-center gap-[8px] border-0 bg-transparent p-0 text-left"
          >
            <div className="relative size-[16px] shrink-0">
              <img alt="" className="absolute block max-w-none size-full" src={iconSrc} />
            </div>
            <p className="font-['Satoshi:Medium',sans-serif] min-w-0 shrink truncate text-[14px] leading-[normal] not-italic text-[#606d76]">
              {label}
            </p>
            <ChevronDown
              className={cn("size-4 shrink-0 text-[#606d76] transition-transform", isOpen && "-rotate-180")}
              aria-hidden
            />
          </button>
          <div className="flex shrink-0 flex-nowrap items-center justify-end gap-[12px]">{headerRight}</div>
        </div>

        {isOpen && (
          <div className="content-stretch flex w-full flex-col items-start overflow-clip rounded-tl-[8px] rounded-tr-[8px]">
            <div className="border-[#ebedee] bg-[#f0f3f5] content-stretch flex w-full shrink-0 gap-[24px] border-b border-solid px-[16px] py-[12px]">
              <div className="content-stretch flex w-[380px] shrink-0 items-center">
                <p className="font-['Satoshi:Medium',sans-serif] text-[16px] text-[#606d76]">Task</p>
              </div>
              <p className="font-['Satoshi:Medium',sans-serif] w-[245px] shrink-0 overflow-hidden text-[16px] text-ellipsis whitespace-nowrap text-[#606d76]">
                Description
              </p>
              <p className="font-['Satoshi:Medium',sans-serif] w-[72px] shrink-0 overflow-hidden text-[16px] text-ellipsis whitespace-nowrap text-[#606d76]">
                Assignee
              </p>
              <p className="font-['Satoshi:Medium',sans-serif] w-[124px] shrink-0 overflow-hidden text-[16px] text-ellipsis whitespace-nowrap text-[#606d76]">
                Due Date
              </p>
              <p className="font-['Satoshi:Medium',sans-serif] w-[52px] shrink-0 overflow-hidden text-[16px] text-ellipsis whitespace-nowrap text-[#606d76]">
                Priority
              </p>
              <p className="font-['Satoshi:Medium',sans-serif] min-w-0 flex-[1_0_0] overflow-hidden text-[16px] text-ellipsis whitespace-nowrap text-[#606d76]">
                Priority
              </p>
              <div className="w-[24px] shrink-0" aria-hidden />
            </div>
            <div
              className={cn(
                "relative flex w-full flex-col items-stretch overflow-clip rounded-b-[8px] transition-colors duration-200",
                list.length === 0 ? "min-h-[52px]" : "min-h-0",
                dragOverCol === col && draggingId !== null && "bg-[rgba(249,250,251,0.75)]",
              )}
              onDragOver={onColumnDragOver(col)}
              onDragLeave={onColumnDragLeave(col)}
              onDrop={onColumnDrop(col)}
            >
              {dragOverCol === col && draggingId !== null ? (
                <div
                  className="h-[52px] w-full shrink-0 rounded-[8px] border-2 border-dashed border-[#cdd2d5] bg-[rgba(255,255,255,0.55)]"
                  aria-hidden
                />
              ) : null}
              {list.length === 0 ? (
                <p className="px-4 py-6 font-['Satoshi',sans-serif] text-[13px] text-[#727d83]">{emptyMsg}</p>
              ) : (
                list.map((t) => renderRow(t, col))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const searchEllipsis = (
    <>
      <button
        type="button"
        className="inline-flex size-[24px] shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
        aria-label="Search tasks"
      >
        <img alt="" className="block size-full max-h-full max-w-full object-contain" src={imgLucideSearch1} />
      </button>
      <div
        className="inline-flex size-[24px] shrink-0 items-center justify-center overflow-hidden rounded-[4px] px-[4px]"
        aria-hidden
      >
        <div className="relative h-[2px] w-[16px] shrink-0">
          <div className="absolute inset-[-50%_-6.25%]">
            <img alt="" className="block max-w-none size-full" src={imgVector10} />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="scrollbar-none content-stretch relative z-[1] flex w-full min-h-0 flex-1 flex-col items-stretch gap-[24px] overflow-x-auto overflow-y-auto font-['Satoshi',sans-serif]">
      {section(
        "todo",
        "To-do",
        imgLucideListTodo,
        <>
          {searchEllipsis}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCreateTask();
            }}
            className="content-stretch flex shrink-0 cursor-pointer items-center overflow-clip rounded-[6px] border-0 bg-transparent p-[5px]"
            aria-label="Create task"
          >
            <div className="relative size-[14px] shrink-0">
              <div className="absolute inset-[-5.36%]">
                <img alt="" className="block max-w-none size-full" src={imgVector11} />
              </div>
            </div>
          </button>
        </>,
        `No tasks in To-do${milestoneId ? " for this milestone" : ""}.`,
      )}
      {section(
        "in-progress",
        "In-Progress",
        imgLucideSquircleDashed,
        searchEllipsis,
        "No tasks in progress.",
      )}
      {section(
        "completed",
        "Completed",
        imgLucideCircleCheckBig,
        searchEllipsis,
        "No completed tasks.",
      )}
    </div>
  );
}
