"use client";

import type { DragEvent, ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Plus } from "lucide-react";
import { CreateTaskLiveModal } from "../CreateTaskLiveModal";

import { useProjectTasks, useUpdateTaskStatus } from "@/api/hooks";
import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";
import { memberAvatarBackground } from "@/lib/memberAvatar";
import type { Member } from "@/types/member";
import type { Task, TaskStatus } from "@/types/task";

const imgLucideListTodo = mcpAsset("2a12c1eb-b745-4bea-b9f1-f67045f8c03a");
const imgLucideFlag = mcpAsset("299f17ae-de59-4012-9bb8-ae6509081405");
const imgVector13 = mcpAsset("c1ddd3b4-d26b-4a92-b752-d84ba0208f8a");
const imgFrame308 = mcpAsset("5b22b8e9-bd31-437e-a559-232247be56a0");
const imgLucidePaperclip = mcpAsset("c4929b2e-a9fc-4fce-913e-ecf4dafe6944");
const imgLucideMessageCircle = mcpAsset("ff8c6057-7f55-46be-8899-4cb59d2eda1a");
const imgLucideSearch1 = mcpAsset("c5ee61c3-f628-42e7-b456-58f9c49a5cfe");
const imgVector10 = mcpAsset("0d58a9e0-9d27-4eb3-ad07-b2ad64a15f10");
const imgVector12 = mcpAsset("64e38728-fa1b-4a8c-97d3-cbb7f586a27c");
const imgLucideSquircleDashed = mcpAsset("e2efeca9-31cd-4cf9-ac56-b2799ee8a450");
const imgLucideCircleCheckBig = mcpAsset("244bb570-3aed-481d-8cf9-f067c69c50b0");

type ColumnId = "todo" | "in-progress" | "completed";

function statusForColumn(col: ColumnId): TaskStatus {
  if (col === "todo") return "todo";
  if (col === "in-progress") return "in-progress";
  return "done";
}

function columnForTaskStatus(status: TaskStatus): ColumnId {
  if (status === "todo") return "todo";
  if (status === "in-progress") return "in-progress";
  return "completed";
}


export type GetStartedKanbanLiveProps = {
  projectId: number;
  milestoneId: string | null;
  /** Project members (for assignee initials on cards). */
  members?: Member[];
};

export function GetStartedKanbanLive({ projectId, milestoneId, members = [] }: GetStartedKanbanLiveProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tasksQuery = useProjectTasks(projectId);
  const updateStatusMutation = useUpdateTaskStatus(projectId);
  const pendingMoveRef = useRef(new Set<string>());
  const memberByUserId = useMemo(() => new Map(members.map((m) => [m.userId, m])), [members]);

  const filtered = useMemo(() => {
    const list = tasksQuery.data ?? [];
    if (!milestoneId) return list;
    return list.filter((t) => t.milestoneId === milestoneId);
  }, [tasksQuery.data, milestoneId]);

  const byColumn = useMemo(() => {
    return {
      todo: filtered.filter((t) => t.status === "todo"),
      "in-progress": filtered.filter((t) => t.status === "in-progress"),
      completed: filtered.filter((t) => t.status === "done"),
    };
  }, [filtered]);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ColumnId | null>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  const handleMove = (taskId: string, newStatus: TaskStatus) => {
    if (pendingMoveRef.current.has(taskId)) return;
    const task = filtered.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    pendingMoveRef.current.add(taskId);
    updateStatusMutation.mutate(
      { taskId, status: newStatus },
      {
        onSettled: () => {
          pendingMoveRef.current.delete(taskId);
        },
      }
    );
  };

  const handleDragStart = (taskId: string) => (e: DragEvent<HTMLDivElement>) => {
    setDraggingId(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
    const el = e.currentTarget;
    const ghost = el.cloneNode(true) as HTMLElement;
    ghost.style.transform = "rotate(3deg)";
    const ghostCard = ghost.querySelector(".bg-white") as HTMLElement | null;
    if (ghostCard) {
      ghostCard.style.border = "2px solid #24B5F8";
    }
    ghost.style.width = `${el.offsetWidth}px`;
    ghost.style.position = "fixed";
    ghost.style.top = "-9999px";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    requestAnimationFrame(() => document.body.removeChild(ghost));
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverCol(null);
  };

  const handleColumnDragOver = (col: ColumnId) => (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggingId === null) return;
    const task = filtered.find((t) => t.id === draggingId);
    if (!task) return;
    if (columnForTaskStatus(task.status) !== col) {
      setDragOverCol(col);
    }
  };

  const handleColumnDragLeave = (col: ColumnId) => (e: DragEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (!target.contains(e.relatedTarget as Node)) {
      if (dragOverCol === col) setDragOverCol(null);
    }
  };

  const handleDrop = (col: ColumnId) => (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;
    handleMove(taskId, statusForColumn(col));
    setDraggingId(null);
    setDragOverCol(null);
  };

  const handleCardDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const renderLiveCard = (task: Task) => {
    const isDragging = draggingId === task.id;
    const desc = task.description?.trim() ?? "";
    const descPreview = desc.length > 220 ? `${desc.slice(0, 217).trim()}…` : desc;
    const showBadges = task.attachments > 0 || task.comments > 0;
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
        className={`content-stretch flex flex-col items-start relative shrink-0 w-full select-none transition-opacity duration-100 ${isDragging ? "cursor-grabbing opacity-0" : "cursor-grab"}`}
        draggable
        onDragStart={handleDragStart(task.id)}
        onDragEnd={handleDragEnd}
        onDragOver={handleCardDragOver}
        onClick={() => navigate(`/dashboard-placeholder/task/${task.id}?${searchParams.toString()}`)}
      >
        <div
          className={`bg-white ${isDragging ? "border-2 border-[#24B5F8]" : "border border-[#ebedee]"} border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[16px] shadow-[0px_20px_6px_0px_rgba(26,59,84,0),0px_13px_5px_0px_rgba(26,59,84,0),0px_7px_4px_0px_rgba(26,59,84,0.01),0px_3px_3px_0px_rgba(26,59,84,0.03),0px_1px_2px_0px_rgba(26,59,84,0.03)] shrink-0 w-full`}
        >
          <div className="content-stretch flex flex-col gap-[16px] items-start p-[24px] relative shrink-0 w-full">
            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
              <div className="content-stretch flex flex-col gap-[8px] items-start justify-center relative shrink-0 w-full">
                <div className="content-stretch flex gap-[12px] items-start justify-center relative shrink-0 w-full">
                  <p className="flex-[1_0_0] font-['Satoshi:Medium',sans-serif] leading-[normal] min-h-px min-w-px not-italic relative text-[#0b191f] text-[20px] tracking-[-0.2px]">
                    {task.title}
                  </p>
                  <div className="content-stretch flex items-center justify-center relative shrink-0 size-[27px]">
                    <div className="relative shrink-0 size-[16px]">
                      <img alt="" className="absolute block max-w-none size-full" src={imgLucideFlag} />
                    </div>
                  </div>
                </div>
              </div>
              {descPreview ? (
                <>
                  <div className="h-0 relative shrink-0 w-full">
                    <div className="absolute inset-[-0.57px_0]">
                      <img alt="" className="block max-w-none size-full" src={imgVector13} />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                    <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[16px] w-full line-clamp-4">
                      {descPreview}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
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
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
              <div className="content-stretch flex min-w-0 items-center relative shrink-0">
                {assignee ? (
                  <div
                    className="content-stretch flex shrink-0 items-center justify-center rounded-[999px] border border-solid border-white size-[24px]"
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
                  <div className="flex min-w-0 max-w-full items-center gap-1.5">
                    <div
                      className="flex size-[24px] shrink-0 items-center justify-center rounded-[999px] border border-dashed border-[#cdd2d5] bg-[#fafbfc]"
                      title="Unassigned"
                    >
                      <span className="text-[10px] text-[#727d83]">—</span>
                    </div>
                    <span className="truncate font-['Satoshi:Medium',sans-serif] text-[11px] text-[#727d83]">
                      Unassigned
                    </span>
                  </div>
                )}
              </div>
              <div className="content-stretch flex gap-[8px] h-[24px] items-start relative shrink-0">
                <div
                  className={`bg-[#f0f3f5] content-stretch flex gap-[4px] items-center justify-center px-[12px] py-[4px] relative rounded-[16px] self-stretch shrink-0${showBadges ? "" : " opacity-0"}`}
                >
                  <div className="relative shrink-0 size-[16px]">
                    <img alt="" className="absolute block max-w-none size-full" src={imgLucidePaperclip} />
                  </div>
                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[11px] whitespace-nowrap">
                    {task.attachments}
                  </p>
                </div>
                <div
                  className={`bg-[#f0f3f5] content-stretch flex gap-[4px] items-center justify-center px-[12px] py-[4px] relative rounded-[16px] self-stretch shrink-0${showBadges ? "" : " opacity-0"}`}
                >
                  <div className="content-stretch flex items-center justify-center relative shrink-0 size-[15.333px]">
                    <div className="relative shrink-0 size-[13.33px]">
                      <img alt="" className="absolute block max-w-none size-full" src={imgLucideMessageCircle} />
                    </div>
                  </div>
                  <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[11px] whitespace-nowrap">
                    {task.comments}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (tasksQuery.isLoading) {
    return (
      <div className="content-stretch relative z-[1] flex w-full min-h-[200px] flex-1 items-center justify-center gap-[16px] font-['Satoshi',sans-serif] text-[14px] text-[#727d83]">
        Loading tasks…
      </div>
    );
  }

  if (tasksQuery.isError) {
    return (
      <div className="content-stretch relative z-[1] flex w-full min-h-[200px] flex-1 items-center justify-center gap-[16px] px-4 text-center font-['Satoshi',sans-serif] text-[14px] text-[#727d83]">
        Could not load tasks for this project.
      </div>
    );
  }

  const columnHeaderDivider = (
    <div className="h-0 relative w-full shrink-0">
      <div className="absolute inset-[-0.57px_0]">
        <img alt="" className="block max-w-none size-full" src={imgVector12} />
      </div>
    </div>
  );

  const colWrap = (col: ColumnId, children: ReactNode, header: ReactNode) => (
    <div
      className={`content-stretch flex h-full min-h-0 flex-[1_0_0] flex-col items-start overflow-hidden min-w-px p-[16px] relative rounded-[16px] min-h-[120px] transition-colors duration-200 ${dragOverCol === col ? "border-2 border-dashed border-[#cdd2d5]" : ""}`}
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%), linear-gradient(90deg, rgb(240, 243, 245) 0%, rgb(240, 243, 245) 100%)",
      }}
      onDragOver={handleColumnDragOver(col)}
      onDragLeave={handleColumnDragLeave(col)}
      onDrop={handleDrop(col)}
    >
      <div className="flex w-full shrink-0 flex-col gap-4 bg-[#f9fafb]">
        {header}
        {columnHeaderDivider}
      </div>
      <div className="scrollbar-none flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto pt-4">
        {dragOverCol === col && draggingId !== null && (
          <div className="h-[184px] w-full shrink-0 rounded-[16px] border-2 border-dashed border-[#cdd2d5] bg-[rgba(255,255,255,0.45)]" />
        )}
        {children}
      </div>
    </div>
  );

  const todoHeader = (
    <div className="content-stretch flex items-center justify-between relative isolate w-full shrink-0 z-[2]">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
        <div className="relative shrink-0 size-[16px]">
          <img alt="" className="absolute block max-w-none size-full" src={imgLucideListTodo} />
        </div>
        <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[14px] whitespace-nowrap">
          To-do
        </p>
      </div>
      <div className="content-stretch flex gap-[12px] items-center relative shrink-0 ml-auto">
        <button type="button" className="inline-flex size-[24px] shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0" aria-hidden>
          <img alt="" className="block size-full max-h-full max-w-full object-contain" src={imgLucideSearch1} />
        </button>
        <div className="content-stretch flex flex-col items-start overflow-clip px-[4px] py-[11px] relative rounded-[4px] shrink-0 w-[24px]">
          <div className="h-[2px] relative shrink-0 w-[16px]">
            <div className="absolute inset-[-50%_-6.25%]">
              <img alt="" className="block max-w-none size-full" src={imgVector10} />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setCreateTaskOpen(true); }}
          className="inline-flex items-center justify-center overflow-clip border-0 bg-transparent p-[5px] rounded-[6px] shrink-0 cursor-pointer"
          aria-label="Create task"
        >
          <Plus size={14} className="text-[#606d76]" strokeWidth={2} />
        </button>
      </div>
    </div>
  );

  const inProgressHeader = (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
        <div className="relative shrink-0 size-[16px]">
          <img alt="" className="absolute block max-w-none size-full" src={imgLucideSquircleDashed} />
        </div>
        <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[14px] whitespace-nowrap">
          In-Progress
        </p>
      </div>
      <div className="content-stretch flex items-center relative shrink-0">
        <div className="content-stretch flex flex-col items-start overflow-clip px-[4px] py-[11px] relative rounded-[4px] shrink-0 w-[24px]">
          <div className="h-[2px] relative shrink-0 w-[16px]">
            <div className="absolute inset-[-50%_-6.25%]">
              <img alt="" className="block max-w-none size-full" src={imgVector10} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const doneHeader = (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
        <div className="relative shrink-0 size-[16px]">
          <img alt="" className="absolute block max-w-none size-full" src={imgLucideCircleCheckBig} />
        </div>
        <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[14px] whitespace-nowrap">
          Completed
        </p>
      </div>
      <div className="content-stretch flex items-center relative shrink-0">
        <div className="content-stretch flex flex-col items-start overflow-clip px-[4px] py-[11px] relative rounded-[4px] shrink-0 w-[24px]">
          <div className="h-[2px] relative shrink-0 w-[16px]">
            <div className="absolute inset-[-50%_-6.25%]">
              <img alt="" className="block max-w-none size-full" src={imgVector10} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="content-stretch relative z-[1] flex w-full flex-1 min-h-0 items-stretch gap-[16px]">
        {colWrap(
          "todo",
          <>
            {byColumn.todo.map(renderLiveCard)}
            {byColumn.todo.length === 0 && (
              <p className="text-[13px] text-[#727d83]">No tasks in To-do{milestoneId ? " for this milestone" : ""}.</p>
            )}
          </>,
          todoHeader
        )}
        {colWrap(
          "in-progress",
          <>
            {byColumn["in-progress"].map(renderLiveCard)}
            {byColumn["in-progress"].length === 0 && <p className="text-[13px] text-[#727d83]">No tasks in progress.</p>}
          </>,
          inProgressHeader
        )}
        {colWrap(
          "completed",
          <>
            {byColumn.completed.map(renderLiveCard)}
            {byColumn.completed.length === 0 && <p className="text-[13px] text-[#727d83]">No completed tasks.</p>}
          </>,
          doneHeader
        )}
      </div>
      <CreateTaskLiveModal
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        projectId={projectId}
        milestoneId={milestoneId}
      />
    </>
  );
}
