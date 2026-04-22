"use client";

import type { ReactNode, RefObject } from "react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, Flag, GripVertical, Plus, Trash2 } from "lucide-react";
import { CreateTaskLiveModal } from "../CreateTaskLiveModal";
import { KanbanTaskCardContextMenu } from "./KanbanTaskCardContextMenu";
import { kanbanTaskDescriptionPreview } from "./kanbanTaskDescriptionPreview";
import { KanbanAssigneeAvatars } from "./KanbanAssigneeAvatars";
import { KanbanTaskMetaPills } from "./KanbanTaskMetaPills";
import { KanbanBoardColumnHeader } from "./KanbanBoardColumnHeader";
import { KanbanColumnHeaderKebabMenu } from "./KanbanColumnHeaderKebabMenu";
import { filterKanbanTasksBySearchQueryRespectingDrag } from "./kanbanColumnSearchUtils";
import { SprintKanbanListView } from "./SprintKanbanListView";

import { Dialog, DialogClose, DialogOverlay, DialogPortal } from "@/app/components/ui/dialog";
import {
  KanbanBoardSkeleton,
  SprintKanbanListSkeleton,
} from "@/app/components/dashboard-placeholder/DashboardPlaceholderSkeletons";
import { cn } from "@/app/components/ui/utils";
import {
  useAssignTask,
  useRemoveTaskAssignee,
  useDeleteProjectKanbanColumn,
  useDeleteTask,
  useProjectKanbanBoard,
  useProjectTasksInfinite,
  useUpdateProjectKanbanBoard,
  useUpdateTaskStatus,
} from "@/api/hooks";
import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";
import { reorderKanbanColumns } from "@/lib/kanbanColumnReorder";
import { useKanbanColumnPointerDrag } from "@/lib/useKanbanColumnPointerDrag";
import { useKanbanPointerDrag } from "@/lib/useKanbanPointerDrag";
import { workspaceJoin } from "@/lib/workspacePaths";
import type { Member } from "@/types/member";
import { taskPriorityFlagClass, taskPriorityLabel, type Task, type TaskStatus } from "@/types/task";

import {
  DEFAULT_KANBAN_COLUMNS,
  firstColumnIdForStatus,
  isDefaultKanbanColumn,
  kindForTaskStatus,
  mapKanbanBoardFromApi,
  mapKanbanBoardToApi,
  newKanbanColumnId,
  resolveTaskColumnId,
  tasksForKanbanColumn,
  type KanbanColumnConfig,
} from "./kanbanBoardTypes";

const imgLucideListTodo = mcpAsset("2a12c1eb-b745-4bea-b9f1-f67045f8c03a");
const imgVector13 = mcpAsset("c1ddd3b4-d26b-4a92-b752-d84ba0208f8a");
const imgFrame308 = mcpAsset("5b22b8e9-bd31-437e-a559-232247be56a0");
const imgLucideSearch1 = mcpAsset("c5ee61c3-f628-42e7-b456-58f9c49a5cfe");
/** Plus icon — To-do column “Create task” (same asset as mock Get started kanban, DashboardPlaceholder). */
const imgVector11 = mcpAsset("4912f83a-d378-4c38-9bf2-ce38aa20cc19");
const imgVector12 = mcpAsset("64e38728-fa1b-4a8c-97d3-cbb7f586a27c");
const imgLucideSquircleDashed = mcpAsset("e2efeca9-31cd-4cf9-ac56-b2799ee8a450");
const imgLucideCircleCheckBig = mcpAsset("244bb570-3aed-481d-8cf9-f067c69c50b0");

export type GetStartedKanbanLiveProps = {
  projectId: number;
  milestoneId: string | null;
  /** Project members (for assignee initials on cards). */
  members?: Member[];
  /** Board columns vs list table — same task data. */
  view?: "board" | "list";
  /** Ref to the board's horizontal scroll container — lets the top-bar slider drive scrollLeft. */
  boardScrollRef?: RefObject<HTMLDivElement | null>;
};

export function GetStartedKanbanLive({
  projectId,
  milestoneId,
  members = [],
  view = "board",
  boardScrollRef,
}: GetStartedKanbanLiveProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tasksQuery = useProjectTasksInfinite(projectId);
  const kanbanBoardQuery = useProjectKanbanBoard(projectId);
  const updateKanbanBoardMutation = useUpdateProjectKanbanBoard(projectId);
  const deleteKanbanColumnMutation = useDeleteProjectKanbanColumn(projectId);
  const updateStatusMutation = useUpdateTaskStatus(projectId);
  const deleteTaskMutation = useDeleteTask(projectId);
  const assignTaskMutation = useAssignTask();
  const removeTaskAssigneeMutation = useRemoveTaskAssignee();
  const pendingMoveRef = useRef(new Set<string>());
  const kanbanInitializedRef = useRef(false);
  const kanbanLastSavedSerializedRef = useRef<string | null>(null);
  const memberByUserId = useMemo(() => new Map(members.map((m) => [m.userId, m])), [members]);

  const mergedTasks = useMemo(
    () => tasksQuery.data?.pages.flatMap((p) => p.tasks) ?? [],
    [tasksQuery.data?.pages],
  );

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = tasksQuery;
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    // Defer extra page fetches to the browser's idle window so the first page paints (and the user can
    // interact) before we churn the network with follow-up pages. Keeps the UI responsive on slow links.
    type IdleHandle = number;
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => IdleHandle;
      cancelIdleCallback?: (handle: IdleHandle) => void;
    };
    let handle: IdleHandle;
    let usedIdle = false;
    if (typeof win.requestIdleCallback === "function") {
      usedIdle = true;
      handle = win.requestIdleCallback(() => {
        void fetchNextPage();
      }, { timeout: 2_000 });
    } else {
      handle = window.setTimeout(() => {
        void fetchNextPage();
      }, 250);
    }
    return () => {
      if (usedIdle && typeof win.cancelIdleCallback === "function") {
        win.cancelIdleCallback(handle);
      } else {
        window.clearTimeout(handle);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const filtered = useMemo(() => {
    const list = mergedTasks;
    if (!milestoneId) return list;
    return list.filter((t) => t.milestoneId === milestoneId);
  }, [mergedTasks, milestoneId]);

  const [columns, setColumns] = useState<KanbanColumnConfig[]>(() => [...DEFAULT_KANBAN_COLUMNS]);
  const [taskColumnPreference, setTaskColumnPreference] = useState<Record<string, string>>({});

  useEffect(() => {
    kanbanInitializedRef.current = false;
    kanbanLastSavedSerializedRef.current = null;
    setColumns([...DEFAULT_KANBAN_COLUMNS]);
    setTaskColumnPreference({});
  }, [projectId]);

  useEffect(() => {
    if (!kanbanBoardQuery.isSuccess || kanbanBoardQuery.data == null) return;
    if (kanbanInitializedRef.current) return;
    setColumns(mapKanbanBoardFromApi(kanbanBoardQuery.data));
    kanbanLastSavedSerializedRef.current = JSON.stringify(kanbanBoardQuery.data);
    kanbanInitializedRef.current = true;
  }, [kanbanBoardQuery.isSuccess, kanbanBoardQuery.data]);

  useEffect(() => {
    if (!kanbanBoardQuery.isError || kanbanInitializedRef.current) return;
    const fallback = [...DEFAULT_KANBAN_COLUMNS];
    setColumns(fallback);
    kanbanLastSavedSerializedRef.current = JSON.stringify(mapKanbanBoardToApi(fallback));
    kanbanInitializedRef.current = true;
  }, [kanbanBoardQuery.isError]);

  useEffect(() => {
    if (!kanbanInitializedRef.current) return;
    const payload = mapKanbanBoardToApi(columns);
    const serialized = JSON.stringify(payload);
    if (serialized === kanbanLastSavedSerializedRef.current) return;
    const timer = window.setTimeout(() => {
      updateKanbanBoardMutation.mutate(payload, {
        onSuccess: () => {
          kanbanLastSavedSerializedRef.current = serialized;
        },
      });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [columns, updateKanbanBoardMutation]);

  const columnTasks = useMemo(() => {
    const m: Record<string, Task[]> = {};
    for (const c of columns) {
      m[c.id] = tasksForKanbanColumn(filtered, c, columns, taskColumnPreference);
    }
    return m;
  }, [filtered, columns, taskColumnPreference]);

  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task | null>(null);
  const [columnPendingDelete, setColumnPendingDelete] = useState<KanbanColumnConfig | null>(null);
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [newColumnStatus, setNewColumnStatus] = useState<TaskStatus>("todo");
  const [boardColumnSearchOpen, setBoardColumnSearchOpen] = useState<Record<string, boolean>>({});
  const [boardColumnSearchQuery, setBoardColumnSearchQuery] = useState<Record<string, string>>({});

  const handleMoveToColumn = (taskId: string, targetColumnId: string) => {
    const targetCol = columns.find((c) => c.id === targetColumnId);
    const task = filtered.find((t) => t.id === taskId);
    if (!task || !targetCol) return;

    const sourceColId = resolveTaskColumnId(task, columns, taskColumnPreference);
    if (sourceColId === targetColumnId) return;

    setTaskColumnPreference((prev) => ({ ...prev, [taskId]: targetColumnId }));

    if (pendingMoveRef.current.has(taskId)) return;
    pendingMoveRef.current.add(taskId);
    updateStatusMutation.mutate(
      { taskId, status: targetCol.id },
      {
        onSettled: () => {
          pendingMoveRef.current.delete(taskId);
        },
      },
    );
  };

  const confirmAddColumn = () => {
    const title = newColumnTitle.trim();
    if (!title) {
      toast.error("Enter a column name");
      return;
    }
    const col: KanbanColumnConfig = {
      id: newKanbanColumnId(),
      title,
      taskStatus: newColumnStatus,
      kind: kindForTaskStatus(newColumnStatus),
    };
    setColumns((prev) => [...prev, col]);
    setNewColumnTitle("");
    setNewColumnStatus("todo");
    setAddColumnOpen(false);
    toast.success(`Added column “${title}”`);
  };

  const confirmDeleteColumn = () => {
    const col = columnPendingDelete;
    if (!col || isDefaultKanbanColumn(col)) {
      setColumnPendingDelete(null);
      return;
    }
    const prevColumns = columns;
    const prevPreference = taskColumnPreference;
    const prevSerialized = kanbanLastSavedSerializedRef.current;

    const remaining = columns.filter((c) => c.id !== col.id);
    const fallbackId = firstColumnIdForStatus(remaining, col.taskStatus);
    const nextPreference: Record<string, string> = { ...taskColumnPreference };
    for (const task of filtered) {
      if (resolveTaskColumnId(task, columns, taskColumnPreference) === col.id) {
        nextPreference[task.id] = fallbackId;
      }
    }

    setColumns(remaining);
    setTaskColumnPreference(nextPreference);
    setColumnPendingDelete(null);

    const optimisticPayload = mapKanbanBoardToApi(remaining);
    kanbanLastSavedSerializedRef.current = JSON.stringify(optimisticPayload);

    deleteKanbanColumnMutation.mutate(col.id, {
      onSuccess: (apiColumns) => {
        toast.success(`Removed column “${col.title}”`);
        kanbanLastSavedSerializedRef.current = JSON.stringify(apiColumns);
        setColumns(mapKanbanBoardFromApi(apiColumns));
      },
      onError: () => {
        setColumns(prevColumns);
        setTaskColumnPreference(prevPreference);
        kanbanLastSavedSerializedRef.current = prevSerialized;
      },
    });
  };

  const { draggingId, dragOverCol, cardPointerDown } = useKanbanPointerDrag({
    onDrop: (taskId, colId) => {
      handleMoveToColumn(taskId, colId);
    },
    getTaskColumn: (taskId) => {
      const task = filtered.find((t) => t.id === taskId);
      return task ? resolveTaskColumnId(task, columns, taskColumnPreference) : null;
    },
  });

  const kanbanBoardRowRef = useRef<HTMLDivElement | null>(null);
  const setKanbanBoardRowRef = useCallback(
    (el: HTMLDivElement | null) => {
      kanbanBoardRowRef.current = el;
      if (boardScrollRef) {
        boardScrollRef.current = el;
      }
    },
    [boardScrollRef],
  );

  const columnIds = useMemo(() => columns.map((c) => c.id), [columns]);

  const columnDrag = useKanbanColumnPointerDrag({
    boardRef: kanbanBoardRowRef,
    columnIds,
    onReorder: (from, to) => {
      setColumns((prev) => reorderKanbanColumns(prev, from, to));
    },
  });

  const renderLiveCard = (task: Task) => {
    const isDragging = draggingId === task.id;
    const desc = task.description?.trim() ?? "";
    const { preview: descPreview, isTruncated: descTruncated } =
      kanbanTaskDescriptionPreview(desc);
    const branchCount = task.linkedBranches?.length ?? 0;
    const { total: checklistTotal, completed: checklistDone } = task.checklists;
    const checklistPct =
      checklistTotal > 0 ? Math.min(100, Math.round((checklistDone / checklistTotal) * 100)) : 0;
    const progressFraction = checklistTotal > 0 ? checklistPct / 100 : 0;
    const assigneeUserIds = task.assignees
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n));

    const taskPath = workspaceJoin("task", String(task.id));
    const taskSearch = searchParams.toString();
    const taskHref = taskSearch ? `${taskPath}?${taskSearch}` : taskPath;

    const copyTaskLink = async () => {
      try {
        const url = new URL(taskHref, window.location.origin).href;
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      } catch {
        toast.error("Could not copy link");
      }
    };

    const resolvedColId = resolveTaskColumnId(task, columns, taskColumnPreference);
    const resolvedCol = columns.find((c) => c.id === resolvedColId);

    return (
      <KanbanTaskCardContextMenu
        key={task.id}
        taskId={task.id}
        currentColumnId={resolvedColId}
        currentColumnKind={resolvedCol?.kind ?? "todo"}
        moveColumnOptions={columns.map((c) => ({ id: c.id, label: c.title }))}
        members={members}
        currentAssigneeIds={assigneeUserIds}
        onAssignMember={(userId) => {
          assignTaskMutation.mutate({ taskId: task.id, userId });
        }}
        onUnassignMember={(userId) => {
          removeTaskAssigneeMutation.mutate({ taskId: task.id, userId });
        }}
        onOpenTask={() => navigate(taskHref)}
        onEditTask={() => {
          const next = new URLSearchParams(searchParams);
          next.set("edit", "title");
          navigate(`${taskPath}?${next.toString()}`);
        }}
        onCopyLink={() => void copyTaskLink()}
        onDelete={() => setTaskPendingDelete(task)}
        onMoveToColumn={(columnId) => handleMoveToColumn(task.id, columnId)}
      >
        <div
          className={`content-stretch flex flex-col items-start relative shrink-0 w-full select-none transition-opacity duration-100 ${isDragging ? "opacity-0" : "cursor-open-hand"}`}
          onPointerDown={cardPointerDown(task.id)}
          onClick={() => navigate(taskHref)}
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
                    <Flag
                      size={16}
                      className={taskPriorityFlagClass(task.priority)}
                      aria-label={`Priority: ${taskPriorityLabel(task.priority)}`}
                    />
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
                    <p
                      className="font-['Satoshi:Medium',sans-serif] line-clamp-2 leading-[normal] not-italic relative shrink-0 w-full text-[#606d76] text-[16px]"
                      title={descTruncated ? desc : undefined}
                    >
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
              <div className="content-stretch relative flex min-w-0 shrink-0 items-center">
                <KanbanAssigneeAvatars
                  assigneeUserIds={assigneeUserIds}
                  memberByUserId={memberByUserId}
                  sizePx={24}
                  variant="card"
                />
              </div>
              <KanbanTaskMetaPills
                attachments={task.attachments}
                comments={task.comments}
                branchCount={branchCount}
              />
            </div>
          </div>
        </div>
        </div>
      </KanbanTaskCardContextMenu>
    );
  };

  if (tasksQuery.isLoading || kanbanBoardQuery.isLoading) {
    return view === "list" ? <SprintKanbanListSkeleton /> : <KanbanBoardSkeleton />;
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

  const colWrap = (
    columnId: string,
    children: ReactNode,
    header: ReactNode,
    isColumnDragSource = false,
  ) => (
    <div
      data-kanban-col={columnId}
      className={cn(
        "content-stretch flex h-full min-h-0 flex-col items-start overflow-hidden p-[16px] relative rounded-[16px] min-h-[120px] transition-colors duration-200",
        dragOverCol === columnId ? "border-2 border-dashed border-[#cdd2d5]" : "",
        isColumnDragSource && "opacity-0",
      )}
      style={{
        flexGrow: 1,
        flexShrink: 0,
        flexBasis: "350px",
        width: "350px",
        minWidth: "350px",
        backgroundImage:
          "linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%), linear-gradient(90deg, rgb(240, 243, 245) 0%, rgb(240, 243, 245) 100%)",
      }}
    >
      <div className="flex w-full shrink-0 flex-col gap-4 bg-[#f9fafb]">
        {header}
        {columnHeaderDivider}
      </div>
      <div className="scrollbar-none flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto pt-4">
        {dragOverCol === columnId && draggingId !== null && (
          <div className="h-[184px] w-full shrink-0 rounded-[16px] border-2 border-dashed border-[#cdd2d5] bg-[rgba(255,255,255,0.45)]" />
        )}
        {children}
      </div>
    </div>
  );

  const boardColumnIconSrc = (kind: KanbanColumnConfig["kind"]) => {
    if (kind === "in-progress") return imgLucideSquircleDashed;
    if (kind === "done") return imgLucideCircleCheckBig;
    return imgLucideListTodo;
  };

  const renderBoardColumnHeader = (col: KanbanColumnConfig) => {
    const showCreateTask = col.taskStatus === "todo";
    const reorderHandle = (
      <button
        type="button"
        className="inline-flex size-[24px] shrink-0 cursor-grab touch-none items-center justify-center rounded-[4px] border-0 bg-transparent p-0 text-[#727d83] active:cursor-grabbing hover:text-[#0b191f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b191f]/15 motion-reduce:transition-none"
        aria-label={`Reorder column: ${col.title}`}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          columnDrag.columnDragHandlePointerDown(col.id)(e);
        }}
      >
        <GripVertical className="size-[18px]" strokeWidth={2} aria-hidden />
      </button>
    );
    return (
      <KanbanBoardColumnHeader
        col={col}
        reorderHandle={reorderHandle}
        columnIconSrc={boardColumnIconSrc(col.kind)}
        searchOpen={boardColumnSearchOpen[col.id] ?? false}
        query={boardColumnSearchQuery[col.id] ?? ""}
        onQueryChange={(value) =>
          setBoardColumnSearchQuery((prev) => ({ ...prev, [col.id]: value }))
        }
        onSearchOpen={() => setBoardColumnSearchOpen((prev) => ({ ...prev, [col.id]: true }))}
        onSearchClose={() => {
          setBoardColumnSearchOpen((prev) => ({ ...prev, [col.id]: false }));
          setBoardColumnSearchQuery((prev) => ({ ...prev, [col.id]: "" }));
        }}
        searchIconSrc={imgLucideSearch1}
        showCreateTask={showCreateTask}
        onCreateTask={() => setCreateTaskOpen(true)}
        createIconSrc={imgVector11}
        kebabMenu={
          <KanbanColumnHeaderKebabMenu
            column={col}
            onAddList={() => setAddColumnOpen(true)}
            onRequestDeleteList={
              isDefaultKanbanColumn(col) ? undefined : () => setColumnPendingDelete(col)
            }
          />
        }
      />
    );
  };

  return (
    <>
      {view === "list" ? (
        <SprintKanbanListView
          tasks={filtered}
          columns={columns}
          columnTasks={columnTasks}
          members={members}
          projectId={projectId}
          milestoneId={milestoneId}
          onCreateTask={() => setCreateTaskOpen(true)}
          draggingId={draggingId}
          dragOverCol={dragOverCol}
          cardPointerDown={cardPointerDown}
          columnKebabMenu={(col) => (
            <KanbanColumnHeaderKebabMenu
              column={col}
              onAddList={() => setAddColumnOpen(true)}
              onRequestDeleteList={
                isDefaultKanbanColumn(col) ? undefined : () => setColumnPendingDelete(col)
              }
            />
          )}
        />
      ) : (
        <>
      <style>{`
        [data-kanban-board-row] {
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          min-width: 0 !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        [data-kanban-board-row]::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        [data-kanban-board-row] > [data-kanban-col] {
          flex-grow: 0 !important;
          flex-shrink: 0 !important;
          flex-basis: 350px !important;
          width: 350px !important;
          min-width: 350px !important;
        }
      `}</style>
      <div
        ref={setKanbanBoardRowRef}
        data-kanban-board-row
        className="content-stretch relative z-[1] flex w-full min-w-0 flex-1 min-h-0 flex-nowrap items-stretch gap-[16px] overflow-x-auto"
      >
        {columns.map((col, index) => {
          const rawList = columnTasks[col.id] ?? [];
          const q = boardColumnSearchQuery[col.id] ?? "";
          const list = filterKanbanTasksBySearchQueryRespectingDrag(rawList, q, draggingId);
          const emptyTail = col.taskStatus === "todo" && milestoneId ? " for this milestone" : "";
          const searchFilterActive = q.trim().length > 0 && rawList.length > 0 && list.length === 0;
          const showDropBar =
            columnDrag.draggingColumnId != null &&
            columnDrag.dropInsertSlot != null &&
            columnDrag.dropInsertSlot === index;
          return (
            <Fragment key={col.id}>
              {showDropBar ? (
                <div
                  className="pointer-events-none shrink-0 self-stretch rounded-full bg-primary w-1 min-h-[120px] shadow-[0_0_12px_color-mix(in_srgb,var(--primary)_35%,transparent)]"
                  aria-hidden
                />
              ) : null}
              {colWrap(
                col.id,
                <>
                  {list.map(renderLiveCard)}
                  {list.length === 0 && (
                    <p className="text-[13px] text-[#727d83]">
                      {searchFilterActive
                        ? "No tasks match your search."
                        : `No tasks in ${col.title}${emptyTail}.`}
                    </p>
                  )}
                </>,
                renderBoardColumnHeader(col),
                columnDrag.draggingColumnId === col.id,
              )}
            </Fragment>
          );
        })}
        {columnDrag.draggingColumnId != null &&
        columnDrag.dropInsertSlot === columns.length ? (
          <div
            className="pointer-events-none shrink-0 self-stretch rounded-full bg-primary w-1 min-h-[120px] shadow-[0_0_12px_color-mix(in_srgb,var(--primary)_35%,transparent)]"
            aria-hidden
          />
        ) : null}
        <div className="flex shrink-0 flex-col items-stretch justify-start pt-[16px]">
          <button
            type="button"
            onClick={() => setAddColumnOpen(true)}
            className="border-border text-muted-foreground hover:bg-muted/40 flex h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-2 rounded-[16px] border border-dashed px-3 font-['Satoshi:Medium',sans-serif] text-[13px] transition-colors"
            aria-label="Add column"
          >
            <Plus className="size-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Add column</span>
          </button>
        </div>
      </div>
        </>
      )}
      <CreateTaskLiveModal
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        projectId={projectId}
        milestoneId={milestoneId}
      />
      <Dialog
        open={addColumnOpen}
        onOpenChange={(open) => {
          setAddColumnOpen(open);
          if (!open) {
            setNewColumnTitle("");
            setNewColumnStatus("todo");
          }
        }}
      >
        <DialogPortal>
          <DialogOverlay className="bg-black/25" />
          <DialogPrimitive.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            )}
          >
            <div className="grid w-full grid-cols-[20px_1fr_20px] items-center border-b border-[#f5f5f5] bg-[#f9f9f9] px-9 py-4">
              <DialogClose asChild>
                <button
                  type="button"
                  className="inline-flex size-5 items-center justify-center text-[#606d76] transition-colors hover:text-[#0b191f]"
                  aria-label="Close"
                >
                  <ArrowLeft className="size-5" />
                </button>
              </DialogClose>
              <DialogPrimitive.Title className="text-center font-['Satoshi',sans-serif] text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
                Add column
              </DialogPrimitive.Title>
              <div className="size-5" />
            </div>
            <div className="flex w-full flex-col gap-5 px-9 py-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="kanban-new-col-title" className="font-['Satoshi',sans-serif] text-[13px] font-medium text-[#606d76]">
                  Column name
                </label>
                <input
                  id="kanban-new-col-title"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  placeholder="e.g. Backlog, Review, Blocked"
                  className="font-['Satoshi',sans-serif] h-11 w-full rounded-[8px] border border-[#e9e9e9] bg-white px-3 text-[14px] text-[#0b191f] outline-none ring-0 placeholder:text-[#9fa5a8] focus:border-[#0b191f]/20 focus:ring-2 focus:ring-[#0b191f]/10"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="kanban-new-col-status" className="font-['Satoshi',sans-serif] text-[13px] font-medium text-[#606d76]">
                  Task status for this column
                </label>
                <select
                  id="kanban-new-col-status"
                  value={newColumnStatus}
                  onChange={(e) => setNewColumnStatus(e.target.value as TaskStatus)}
                  className="font-['Satoshi',sans-serif] h-11 w-full rounded-[8px] border border-[#e9e9e9] bg-white px-3 text-[14px] text-[#0b191f] outline-none focus:border-[#0b191f]/20 focus:ring-2 focus:ring-[#0b191f]/10"
                >
                  <option value="todo">To-do</option>
                  <option value="in-progress">In progress</option>
                  <option value="done">Done</option>
                </select>
                <p className="font-['Satoshi',sans-serif] text-[12px] leading-relaxed text-[#727d83]">
                  Tasks dropped here update to this status. You can add several columns that share a status to split work visually.
                </p>
              </div>
              <div className="flex w-full items-center justify-end gap-2">
                <DialogClose asChild>
                  <button
                    type="button"
                    className="inline-flex h-10 min-w-[96px] items-center justify-center rounded-[8px] border border-[#e9e9e9] bg-white px-5 font-['Satoshi',sans-serif] text-[14px] font-semibold text-[#0b191f] transition-colors duration-150 hover:bg-[#f5f7f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b191f]/10"
                  >
                    Cancel
                  </button>
                </DialogClose>
                <button
                  type="button"
                  onClick={confirmAddColumn}
                  className="inline-flex h-10 min-w-[96px] items-center justify-center rounded-[8px] bg-[#0b191f] px-5 font-['Satoshi',sans-serif] text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-[#1a2d36] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b191f]/20"
                >
                  Add column
                </button>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
      <Dialog
        open={columnPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setColumnPendingDelete(null);
        }}
      >
        <DialogPortal>
          <DialogOverlay className="bg-black/25" />
          <DialogPrimitive.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            )}
          >
            <div className="grid w-full grid-cols-[20px_1fr_20px] items-center border-b border-[#f5f5f5] bg-[#f9f9f9] px-9 py-4">
              <DialogClose asChild>
                <button
                  type="button"
                  className="inline-flex size-5 items-center justify-center text-[#606d76] transition-colors hover:text-[#0b191f]"
                  aria-label="Close"
                >
                  <ArrowLeft className="size-5" />
                </button>
              </DialogClose>
              <DialogPrimitive.Title className="text-center font-['Satoshi',sans-serif] text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
                Delete list
              </DialogPrimitive.Title>
              <div className="size-5" />
            </div>

            <div className="flex w-full flex-col gap-6 px-9 py-6">
              <div className="flex items-start gap-3">
                <div className="flex shrink-0 items-start pt-0.5 text-[#dc2626]" aria-hidden>
                  <Trash2 className="size-5" strokeWidth={1.75} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="font-['Satoshi',sans-serif] text-[18px] font-medium leading-tight tracking-[-0.18px] text-[#0b191f]">
                    Remove this list?
                  </p>
                  <DialogPrimitive.Description className="font-['Satoshi',sans-serif] text-[14px] font-medium leading-relaxed text-[#606d76]">
                    {columnPendingDelete?.title ? (
                      <>
                        <span className="text-[#0b191f]">“{columnPendingDelete.title}”</span> will be removed from the
                        board. Tasks in this list stay on the project and move to another column with the same status.
                      </>
                    ) : (
                      "This list will be removed from the board. Tasks stay on the project and move to another column with the same status."
                    )}
                  </DialogPrimitive.Description>
                </div>
              </div>

              <div className="flex w-full items-center justify-end gap-2">
                <DialogClose asChild>
                  <button
                    type="button"
                    className="inline-flex h-10 min-w-[96px] items-center justify-center rounded-[8px] border border-[#e9e9e9] bg-white px-5 font-['Satoshi',sans-serif] text-[14px] font-semibold text-[#0b191f] transition-colors duration-150 hover:bg-[#f5f7f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b191f]/10"
                  >
                    Cancel
                  </button>
                </DialogClose>
                <button
                  type="button"
                  onClick={confirmDeleteColumn}
                  className="inline-flex h-10 min-w-[96px] items-center justify-center rounded-[8px] bg-[#dc2626] px-5 font-['Satoshi',sans-serif] text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-[#b91c1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626]/30"
                >
                  Delete list
                </button>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
      <Dialog
        open={taskPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setTaskPendingDelete(null);
        }}
      >
        <DialogPortal>
          <DialogOverlay className="bg-black/25" />
          <DialogPrimitive.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            )}
          >
            <div className="grid w-full grid-cols-[20px_1fr_20px] items-center border-b border-[#f5f5f5] bg-[#f9f9f9] px-9 py-4">
              <DialogClose asChild>
                <button
                  type="button"
                  className="inline-flex size-5 items-center justify-center text-[#606d76] transition-colors hover:text-[#0b191f]"
                  aria-label="Close"
                >
                  <ArrowLeft className="size-5" />
                </button>
              </DialogClose>
              <DialogPrimitive.Title className="text-center font-['Satoshi',sans-serif] text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
                Delete task
              </DialogPrimitive.Title>
              <div className="size-5" />
            </div>

            <div className="flex w-full flex-col gap-6 px-9 py-6">
              <div className="flex items-start gap-3">
                <div className="flex shrink-0 items-start pt-0.5 text-[#dc2626]" aria-hidden>
                  <Trash2 className="size-5" strokeWidth={1.75} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="font-['Satoshi',sans-serif] text-[18px] font-medium leading-tight tracking-[-0.18px] text-[#0b191f]">
                    Delete this task?
                  </p>
                  <DialogPrimitive.Description className="font-['Satoshi',sans-serif] text-[14px] font-medium leading-relaxed text-[#606d76]">
                    {taskPendingDelete?.title ? (
                      <>
                        <span className="text-[#0b191f]">“{taskPendingDelete.title}”</span>{" "}
                        will be permanently removed. This action cannot be undone.
                      </>
                    ) : (
                      "This task will be permanently removed. This action cannot be undone."
                    )}
                  </DialogPrimitive.Description>
                </div>
              </div>

              <div className="flex w-full items-center justify-end gap-2">
                <DialogClose asChild>
                  <button
                    type="button"
                    className="inline-flex h-10 min-w-[96px] items-center justify-center rounded-[8px] border border-[#e9e9e9] bg-white px-5 font-['Satoshi',sans-serif] text-[14px] font-semibold text-[#0b191f] transition-colors duration-150 hover:bg-[#f5f7f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b191f]/10"
                  >
                    Cancel
                  </button>
                </DialogClose>
                <button
                  type="button"
                  onClick={() => {
                    if (taskPendingDelete) deleteTaskMutation.mutate(taskPendingDelete.id);
                    setTaskPendingDelete(null);
                  }}
                  disabled={deleteTaskMutation.isPending}
                  className="inline-flex h-10 min-w-[96px] items-center justify-center rounded-[8px] bg-[#dc2626] px-5 font-['Satoshi',sans-serif] text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-[#b91c1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626]/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleteTaskMutation.isPending ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
}
