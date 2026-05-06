"use client";

import type React from "react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ChevronDown, Flag, GripVertical } from "lucide-react";

import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";
import type { Member } from "@/types/member";
import { taskPriorityFlagClass, taskPriorityLabel, type Task } from "@/types/task";
import { workspaceJoin } from "@/lib/workspacePaths";
import { cn } from "../ui/utils";
import { VirtualList } from "@/app/components/ui/VirtualList";
import { kanbanColumnAutoSortInfo, type KanbanColumnConfig } from "./kanbanBoardTypes";
import { KanbanColumnAutoSortHint } from "./KanbanColumnAutoSortHint";
import { KanbanColumnSearchControls } from "./KanbanColumnSearchControls";
import { filterKanbanTasksBySearchQueryRespectingDrag } from "./kanbanColumnSearchUtils";
import { KanbanAssigneeAvatars } from "./KanbanAssigneeAvatars";
import { KanbanTaskMetaPills } from "./KanbanTaskMetaPills";
import { kanbanTaskDescriptionPreview } from "./kanbanTaskDescriptionPreview";

const imgLucideListTodo = mcpAsset("2a12c1eb-b745-4bea-b9f1-f67045f8c03a");
const imgLucideSquircleDashed = mcpAsset("e2efeca9-31cd-4cf9-ac56-b2799ee8a450");
const imgLucideCircleCheckBig = mcpAsset("244bb570-3aed-481d-8cf9-f067c69c50b0");
const imgLucideSearch1 = mcpAsset("c5ee61c3-f628-42e7-b456-58f9c49a5cfe");
const imgVector10 = mcpAsset("0d58a9e0-9d27-4eb3-ad07-b2ad64a15f10");
const imgVector11 = mcpAsset("4912f83a-d378-4c38-9bf2-ce38aa20cc19");
const imgFrame308 = mcpAsset("5b22b8e9-bd31-437e-a559-232247be56a0");
const imgLucideEllipsis = mcpAsset("9baf5fcb-1676-4740-8a31-f190f218b100");

function formatDueLong(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

export type SprintKanbanListViewProps = {
  tasks: Task[];
  /** Column definitions (order matches board). */
  columns: KanbanColumnConfig[];
  /** Tasks per `column.id`, including column preference routing from the parent. */
  columnTasks: Record<string, Task[]>;
  members: Member[];
  projectId: number;
  milestoneId: string | null;
  onCreateTask: () => void;
  /** Drag-and-drop between sections — same behavior as board view. */
  draggingId: string | null;
  dragOverCol: string | null;
  cardPointerDown: (taskId: string) => (e: React.PointerEvent<HTMLDivElement>) => void;
  /** Kebab menu for column headers; when omitted, a static placeholder icon is shown. */
  columnKebabMenu?: (col: KanbanColumnConfig) => ReactNode;
};

function iconSrcForKanbanColumnKind(kind: KanbanColumnConfig["kind"]): string {
  if (kind === "in-progress") return imgLucideSquircleDashed;
  if (kind === "done") return imgLucideCircleCheckBig;
  return imgLucideListTodo;
}

export function SprintKanbanListView({
  tasks: _tasks,
  columns,
  columnTasks,
  members,
  projectId,
  milestoneId,
  onCreateTask,
  draggingId,
  dragOverCol,
  cardPointerDown,
  columnKebabMenu,
}: SprintKanbanListViewProps) {
  void projectId;
  void _tasks;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const memberByUserId = useMemo(() => new Map(members.map((m) => [m.userId, m])), [members]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(columns.map((c) => [c.id, true])),
  );
  const [columnSearchOpen, setColumnSearchOpen] = useState<Record<string, boolean>>({});
  const [columnSearchQuery, setColumnSearchQuery] = useState<Record<string, string>>({});

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      for (const c of columns) {
        if (!(c.id in next)) next[c.id] = true;
      }
      return next;
    });
  }, [columns]);

  const toggle = (colId: string) => {
    setExpanded((e) => ({ ...e, [colId]: !e[colId] }));
  };

  const renderRow = (task: Task) => {
    const isDragging = draggingId === task.id;
    const desc = task.description?.trim() ?? "";
    const { preview: descPreview, isTruncated: descTruncated } =
      kanbanTaskDescriptionPreview(desc);
    const { total: checklistTotal, completed: checklistDone } = task.checklists ?? {
      total: 0,
      completed: 0,
    };
    const checklistPct =
      checklistTotal > 0 ? Math.min(100, Math.round((checklistDone / checklistTotal) * 100)) : 0;
    const progressFraction = checklistTotal > 0 ? checklistPct / 100 : 0;
    const assigneeUserIds = (task.assignees ?? [])
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n));
    const branchCount = task.linkedBranches?.length ?? 0;

    return (
      <div
        onPointerDown={cardPointerDown(task.id)}
        onClick={() => {
          if (!isDragging) {
            navigate(`${workspaceJoin("task", String(task.id))}?${searchParams.toString()}`);
          }
        }}
        className={cn(
          "w-full select-none transition-opacity duration-100",
          isDragging ? "pointer-events-none" : "cursor-open-hand",
        )}
      >
        {isDragging ? (
          <div
            className="list-kanban-drag-surface flex h-[52px] w-full shrink-0 items-center justify-center rounded-[8px] border-2 border-dashed border-[#cdd2d5] bg-[rgba(255,255,255,0.55)] px-4"
            aria-label="Original column — drop here to keep this task in this list"
          />
        ) : (
        <div
          className="list-kanban-drag-surface bg-white content-stretch flex w-full gap-[24px] border-b border-[#ebedee] border-solid px-[16px] py-[6px] text-left transition-colors hover:bg-[#fafbfc]"
        >
        <div className="content-stretch flex w-[380px] shrink-0 flex-col gap-1.5">
          <div className="flex min-w-0 items-center gap-[8px]">
            <GripVertical className="size-4 shrink-0 text-[#9fa5a8]" aria-hidden />
            <p className="font-['Satoshi:Medium',sans-serif] relative min-w-0 shrink truncate text-[16px] text-[#131617]">
              {task.title}
            </p>
          </div>
          <div className="flex min-h-[24px] items-center pl-6">
            <KanbanTaskMetaPills
              attachments={task.attachments}
              comments={task.comments}
              branchCount={branchCount}
              dependencyCount={task.dependencyCount ?? 0}
            />
          </div>
        </div>
        <p
          className="font-['Satoshi:Medium',sans-serif] relative h-[38px] w-[245px] shrink-0 overflow-hidden text-[14px] leading-[1.35] text-[#727d83]"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
          title={descTruncated ? desc : undefined}
        >
          {descPreview || "—"}
        </p>
        <div className="content-stretch flex w-[72px] shrink-0 items-center justify-start pr-[8px]">
          <KanbanAssigneeAvatars
            assigneeUserIds={assigneeUserIds}
            memberByUserId={memberByUserId}
            sizePx={24}
            variant="row"
          />
        </div>
        <p className="font-['Satoshi:Medium',sans-serif] w-[124px] shrink-0 overflow-hidden text-[14px] text-ellipsis whitespace-nowrap text-[#697378]">
          {formatDueLong(task.dueDate)}
        </p>
        <div className="content-stretch flex w-[52px] shrink-0 items-center justify-center">
          <div className="relative flex size-[16px] shrink-0 items-center justify-center" title={`Priority: ${taskPriorityLabel(task.priority)}`}>
            <Flag size={16} className={taskPriorityFlagClass(task.priority)} aria-hidden />
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
        )}
      </div>
    );
  };

  const section = (
    col: KanbanColumnConfig,
    headerRight: ReactNode,
    emptyMsg: string,
    displayList: Task[],
    searchFilterActive: boolean,
  ) => {
    const list = displayList;
    const isOpen = expanded[col.id] ?? true;
    const sortInfo = kanbanColumnAutoSortInfo(col);

    return (
      <div
        key={col.id}
        className="content-stretch flex w-full flex-col items-start overflow-clip rounded-tl-[8px] rounded-tr-[8px]"
      >
        <div className="flex w-full min-w-0 shrink-0 items-center justify-between gap-3 py-[8px]">
          <div className="flex min-w-0 max-w-[min(100%,560px)] flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => toggle(col.id)}
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-[8px] border-0 bg-transparent p-0 text-left"
            >
              <div className="relative size-[16px] shrink-0">
                <img alt="" className="absolute block max-w-none size-full" src={iconSrcForKanbanColumnKind(col.kind)} />
              </div>
              <p className="font-['Satoshi:Medium',sans-serif] min-w-0 flex-1 truncate text-[14px] leading-[normal] not-italic text-[#606d76]">
                {col.title}
              </p>
              <ChevronDown
                className={cn("size-4 shrink-0 text-[#606d76] transition-transform", isOpen && "-rotate-180")}
                aria-hidden
              />
            </button>
            {sortInfo != null ? <KanbanColumnAutoSortHint info={sortInfo} /> : null}
          </div>
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
                Progress
              </p>
              <div className="w-[24px] shrink-0" aria-hidden />
            </div>
            <div
              data-kanban-col={col.id}
              className={cn(
                "relative flex w-full flex-col items-stretch overflow-clip rounded-b-[8px] transition-colors duration-200",
                list.length === 0 ? "min-h-[52px]" : "min-h-0",
                dragOverCol === col.id && draggingId !== null && "bg-[rgba(249,250,251,0.75)]",
              )}
            >
              {dragOverCol === col.id && draggingId !== null ? (
                <div
                  className="h-[52px] w-full shrink-0 rounded-[8px] border-2 border-dashed border-[#cdd2d5] bg-[rgba(255,255,255,0.55)]"
                  aria-hidden
                />
              ) : null}
              {list.length === 0 ? (
                <p className="px-4 py-6 font-['Satoshi',sans-serif] text-[13px] text-[#727d83]">
                  {searchFilterActive ? "No tasks match your search." : emptyMsg}
                </p>
              ) : (
                <VirtualList
                  items={list}
                  threshold={16}
                  estimateSize={72}
                  gap={0}
                  maxHeight="min(70vh, 720px)"
                  fixedHeight
                  getItemKey={(t) => t.id}
                  scrollClassName="rounded-b-[8px]"
                >
                  {(t) => renderRow(t)}
                </VirtualList>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const searchAndKebab = (col: KanbanColumnConfig) => (
    <KanbanColumnSearchControls
      variant="list"
      open={columnSearchOpen[col.id] ?? false}
      query={columnSearchQuery[col.id] ?? ""}
      onQueryChange={(value) =>
        setColumnSearchQuery((prev) => ({ ...prev, [col.id]: value }))
      }
      onOpen={() => setColumnSearchOpen((prev) => ({ ...prev, [col.id]: true }))}
      onClose={() => {
        setColumnSearchOpen((prev) => ({ ...prev, [col.id]: false }));
        setColumnSearchQuery((prev) => ({ ...prev, [col.id]: "" }));
      }}
      searchIconSrc={imgLucideSearch1}
    >
      {columnKebabMenu ? (
        columnKebabMenu(col)
      ) : (
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
      )}
    </KanbanColumnSearchControls>
  );

  const createTaskControl = (
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
  );

  return (
    <div className="scrollbar-none content-stretch relative z-[1] flex w-full min-h-0 flex-1 flex-col items-stretch gap-[24px] overflow-x-auto overflow-y-auto font-['Satoshi',sans-serif]">
      {columns.map((col) => {
        const rawList = columnTasks[col.id] ?? [];
        const q = columnSearchQuery[col.id] ?? "";
        const displayList = filterKanbanTasksBySearchQueryRespectingDrag(rawList, q, draggingId);
        const searchFilterActive = q.trim().length > 0 && rawList.length > 0 && displayList.length === 0;

        const headerRight = (
          <>
            {searchAndKebab(col)}
            {col.taskStatus === "todo" ? createTaskControl : null}
          </>
        );
        const emptyTail =
          col.taskStatus === "todo" && milestoneId ? " for this milestone" : "";
        const emptyMsg = `No tasks in ${col.title}${emptyTail}.`;
        return section(col, headerRight, emptyMsg, displayList, searchFilterActive);
      })}
    </div>
  );
}
