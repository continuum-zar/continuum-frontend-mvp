"use client";

import type { ReactNode, RefObject } from "react";
import { Fragment, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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

import { Dialog, DialogClose, DialogOverlay, DialogPortal } from "@/app/components/ui/dialog";
import {
  KanbanBoardSkeleton,
  SprintKanbanListSkeleton,
} from "@/app/components/dashboard-placeholder/DashboardPlaceholderSkeletons";
import { cn } from "@/app/components/ui/utils";
import { projectKeys } from "@/api/projects";
import { projectTaskEventsStreamUrl } from "@/api/projectTaskEvents";
import {
  useAssignTask,
  useRemoveTaskAssignee,
  useDeleteProjectKanbanColumn,
  useDeleteTask,
  useProjectKanbanBoard,
  useProjectMilestones,
  useProjectTasksInfinite,
  useUpdateProjectKanbanBoard,
  useUpdateTaskStatus,
  getApiErrorMessage,
  invalidateProjectTaskLists,
} from "@/api/hooks";
import { patchTaskMilestone, updateTaskStatus } from "@/api/tasks";
import { useAuthStore } from "@/store/authStore";
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
  orderKanbanColumnTasksForDisplay,
  resolveTaskColumnId,
  tasksForKanbanColumn,
  type KanbanColumnConfig,
} from "./kanbanBoardTypes";

const CalendarTaskView = lazy(() =>
  import("./CalendarTaskView").then((m) => ({ default: m.CalendarTaskView })),
);
const GanttChartView = lazy(() =>
  import("./GanttChartView").then((m) => ({ default: m.GanttChartView })),
);
const SprintKanbanListView = lazy(() =>
  import("./SprintKanbanListView").then((m) => ({ default: m.SprintKanbanListView })),
);

const imgLucideListTodo = mcpAsset("2a12c1eb-b745-4bea-b9f1-f67045f8c03a");
const imgLucideSearch1 = mcpAsset("c5ee61c3-f628-42e7-b456-58f9c49a5cfe");
const imgLucideSquircleDashed = mcpAsset("e2efeca9-31cd-4cf9-ac56-b2799ee8a450");
const imgLucideCircleCheckBig = mcpAsset("244bb570-3aed-481d-8cf9-f067c69c50b0");

export type GetStartedKanbanLiveProps = {
  projectId: number;
  milestoneId: string | null;
  /** Project members (for assignee initials on cards). */
  members?: Member[];
  /** Board, list, Gantt, or calendar — same filtered task data. */
  view?: "board" | "list" | "gantt" | "calendar";
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
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const tasksQuery = useProjectTasksInfinite(projectId);
  const milestonesQuery = useProjectMilestones(projectId);
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

  const mergedTasks = useMemo(() => {
    const rows =
      tasksQuery.data?.pages.flatMap((p) => p.tasks ?? []) ?? [];
    return rows.filter((t): t is Task => t != null);
  }, [tasksQuery.data?.pages]);

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
  const milestoneNameById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const ms of milestonesQuery.data ?? []) {
      const key = String(ms.id);
      if (ms.name && ms.name.trim() !== "") {
        m[key] = ms.name.trim();
      }
    }
    return m;
  }, [milestonesQuery.data]);

  const milestonePickerRows = useMemo(() => {
    const rows = milestonesQuery.data ?? [];
    if (rows.length === 0) return undefined;
    return [
      { milestoneId: null as string | null, label: "No milestone" },
      ...rows.map((m) => ({ milestoneId: m.id, label: m.name })),
    ];
  }, [milestonesQuery.data]);

  const [columns, setColumns] = useState<KanbanColumnConfig[]>(() => [...DEFAULT_KANBAN_COLUMNS]);
  const [taskColumnPreference, setTaskColumnPreference] = useState<Record<string, string>>({});

  useEffect(() => {
    kanbanInitializedRef.current = false;
    kanbanLastSavedSerializedRef.current = null;
    setColumns([...DEFAULT_KANBAN_COLUMNS]);
    setTaskColumnPreference({});
  }, [projectId]);

  useEffect(() => {
    if (typeof window === "undefined" || !isAuthenticated || !accessToken) return;
    let cancelled = false;
    let es: EventSource | null = null;
    const onMessage = (ev: MessageEvent<string>) => {
      try {
        const data = JSON.parse(ev.data) as { type?: string; project_id?: number };
        if (data.type === "task_updated" && Number(data.project_id) === projectId) {
          void queryClient.invalidateQueries({ queryKey: projectKeys.tasks(projectId) });
          void queryClient.invalidateQueries({ queryKey: projectKeys.tasksInfinite(projectId) });
        }
      } catch {
        /* ignore malformed */
      }
    };
    void (async () => {
      let url: string;
      try {
        url = await projectTaskEventsStreamUrl(projectId);
      } catch (err) {
        console.debug("[GetStartedKanbanLive] failed to mint SSE ticket", err);
        return;
      }
      if (cancelled) return;
      es = new EventSource(url);
      es.addEventListener("message", onMessage as EventListener);
      es.onerror = () => {
        console.debug("[GetStartedKanbanLive] project task-events stream closed or errored");
        es?.close();
      };
    })();
    return () => {
      cancelled = true;
      if (es) {
        es.removeEventListener("message", onMessage as EventListener);
        es.close();
      }
    };
  }, [projectId, accessToken, isAuthenticated, queryClient]);

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
      const forCol = tasksForKanbanColumn(filtered, c, columns, taskColumnPreference);
      m[c.id] = orderKanbanColumnTasksForDisplay(c, forCol);
    }
    return m;
  }, [filtered, columns, taskColumnPreference]);

  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createTaskColumnId, setCreateTaskColumnId] = useState<string | null>(null);
  const openCreateTaskInColumn = useCallback((columnId: string) => {
    setCreateTaskColumnId(columnId);
    setCreateTaskOpen(true);
  }, []);
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task | null>(null);
  const [columnPendingDelete, setColumnPendingDelete] = useState<KanbanColumnConfig | null>(null);
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [newColumnStatus, setNewColumnStatus] = useState<TaskStatus>("todo");
  const [boardColumnSearchOpen, setBoardColumnSearchOpen] = useState<Record<string, boolean>>({});
  const [boardColumnSearchQuery, setBoardColumnSearchQuery] = useState<Record<string, string>>({});
  const [columnBulkMovePending, setColumnBulkMovePending] = useState(false);

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

  const handleMoveAllTasksInColumn = useCallback(
    async (sourceColumnId: string, targetColumnId: string) => {
      if (sourceColumnId === targetColumnId || columnBulkMovePending) return;
      const tasks = columnTasks[sourceColumnId] ?? [];
      if (tasks.length === 0) return;
      const targetCol = columns.find((c) => c.id === targetColumnId);
      if (!targetCol) return;

      setColumnBulkMovePending(true);
      const toastId = toast.loading(`Moving ${tasks.length} task${tasks.length === 1 ? "" : "s"}…`);
      try {
        setTaskColumnPreference((prev) => {
          const next = { ...prev };
          for (const t of tasks) next[t.id] = targetColumnId;
          return next;
        });
        const settled = await Promise.allSettled(
          tasks.map((t) => updateTaskStatus(t.id, targetCol.id)),
        );
        const failed = settled.filter((r) => r.status === "rejected").length;
        const ok = settled.length - failed;
        invalidateProjectTaskLists(queryClient, projectId);
        toast.dismiss(toastId);
        if (failed === 0) {
          toast.success(`Moved ${ok} task${ok === 1 ? "" : "s"} to ${targetCol.title}`);
        } else if (ok === 0) {
          const rejected = settled.find(
            (r): r is PromiseRejectedResult => r.status === "rejected",
          );
          toast.error(
            rejected
              ? getApiErrorMessage(rejected.reason, "Could not move tasks")
              : "Could not move tasks",
          );
        } else {
          toast.error(`${failed} of ${tasks.length} tasks failed to move`);
        }
      } catch (e) {
        toast.dismiss(toastId);
        toast.error(getApiErrorMessage(e, "Failed to move tasks"));
      } finally {
        setColumnBulkMovePending(false);
      }
    },
    [columnBulkMovePending, columnTasks, columns, projectId, queryClient],
  );

  const handleMoveAllTasksInColumnToMilestone = useCallback(
    async (columnId: string, milestoneId: string | null) => {
      if (columnBulkMovePending) return;
      const tasks = columnTasks[columnId] ?? [];
      const apiMid = milestoneId === null ? null : Number(milestoneId);
      const toUpdate = tasks.filter((t) => {
        const mid = t.milestoneId?.trim() ? t.milestoneId : null;
        if (milestoneId === null) return mid !== null;
        return mid !== milestoneId;
      });
      if (toUpdate.length === 0) {
        toast.info("All tasks in this list already use that milestone");
        return;
      }

      const destLabel =
        milestoneId === null
          ? "no milestone"
          : milestonePickerRows?.find((o) => o.milestoneId === milestoneId)?.label ?? "milestone";

      setColumnBulkMovePending(true);
      const toastId = toast.loading(
        `Updating ${toUpdate.length} task${toUpdate.length === 1 ? "" : "s"}…`,
      );
      try {
        const settled = await Promise.allSettled(
          toUpdate.map((t) => patchTaskMilestone(t.id, apiMid)),
        );
        const failed = settled.filter((r) => r.status === "rejected").length;
        const ok = settled.length - failed;
        invalidateProjectTaskLists(queryClient, projectId);
        toast.dismiss(toastId);
        if (failed === 0) {
          toast.success(`Moved ${ok} task${ok === 1 ? "" : "s"} to ${destLabel}`);
        } else if (ok === 0) {
          const rejected = settled.find(
            (r): r is PromiseRejectedResult => r.status === "rejected",
          );
          toast.error(
            rejected
              ? getApiErrorMessage(rejected.reason, "Could not update milestones")
              : "Could not update milestones",
          );
        } else {
          toast.error(`${failed} of ${toUpdate.length} tasks failed to update`);
        }
      } catch (e) {
        toast.dismiss(toastId);
        toast.error(getApiErrorMessage(e, "Failed to update milestones"));
      } finally {
        setColumnBulkMovePending(false);
      }
    },
    [columnBulkMovePending, columnTasks, milestonePickerRows, projectId, queryClient],
  );

  const handleMoveTaskToMilestone = useCallback(
    async (taskId: string, milestoneId: string | null) => {
      try {
        await patchTaskMilestone(taskId, milestoneId === null ? null : Number(milestoneId));
        toast.success(milestoneId ? "Task moved to milestone" : "Task removed from milestone");
        invalidateProjectTaskLists(queryClient, projectId);
      } catch (e) {
        toast.error(getApiErrorMessage(e, "Failed to update milestone"));
      }
    },
    [projectId, queryClient],
  );

  const renderColumnKebabMenu = (col: KanbanColumnConfig) => {
    const tasksInCol = columnTasks[col.id] ?? [];
    const milestoneBulkOpts =
      milestonePickerRows == null
        ? undefined
        : milestonePickerRows.map((opt) => {
            const allMatch =
              tasksInCol.length > 0 &&
              tasksInCol.every((t) => {
                const mid = t.milestoneId?.trim() ? t.milestoneId : null;
                return opt.milestoneId === null ? mid === null : mid === opt.milestoneId;
              });
            return { ...opt, disabled: tasksInCol.length === 0 || allMatch };
          });

    return (
      <KanbanColumnHeaderKebabMenu
        column={col}
        onAddList={() => setAddColumnOpen(true)}
        onRequestDeleteList={
          isDefaultKanbanColumn(col) ? undefined : () => setColumnPendingDelete(col)
        }
        moveTasksTargetColumns={columns
          .filter((c) => c.id !== col.id)
          .map((c) => ({ id: c.id, label: c.title }))}
        onMoveAllTasksToColumn={(targetId) => void handleMoveAllTasksInColumn(col.id, targetId)}
        tasksInColumnCount={tasksInCol.length}
        isMoveTasksPending={columnBulkMovePending}
        moveTasksToMilestoneOptions={milestoneBulkOpts}
        onMoveAllTasksToMilestone={(mid) =>
          void handleMoveAllTasksInColumnToMilestone(col.id, mid)
        }
      />
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

  const kanbanBoardRowRef = useRef<HTMLDivElement | null>(null);

  const { draggingId, dragOverCol, cardPointerDown } = useKanbanPointerDrag({
    boardScrollRef: kanbanBoardRowRef,
    onDrop: (taskId, colId) => {
      handleMoveToColumn(taskId, colId);
    },
    getTaskColumn: (taskId) => {
      const task = filtered.find((t) => t.id === taskId);
      return task ? resolveTaskColumnId(task, columns, taskColumnPreference) : null;
    },
  });

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
    const { total: checklistTotal, completed: checklistDone } = task.checklists ?? {
      total: 0,
      completed: 0,
    };
    const checklistPct =
      checklistTotal > 0 ? Math.min(100, Math.round((checklistDone / checklistTotal) * 100)) : 0;
    const assigneeUserIds = (task.assignees ?? [])
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
        milestoneMoveOptions={milestonePickerRows}
        taskMilestoneId={task.milestoneId || null}
        onMoveTaskToMilestone={(milestoneId) => void handleMoveTaskToMilestone(task.id, milestoneId)}
      >
        <div
          className={cn(
            "content-stretch flex flex-col items-start relative shrink-0 w-full select-none transition-opacity duration-100",
            isDragging ? "pointer-events-none" : "cursor-open-hand",
          )}
          onPointerDown={cardPointerDown(task.id)}
          onClick={() => {
            if (!isDragging) navigate(taskHref);
          }}
        >
          {isDragging ? (
            <div
              className="flex min-h-[152px] w-full shrink-0 flex-col items-center justify-center rounded-[8px] border-2 border-dashed border-[#cdd2d5] bg-[rgba(255,255,255,0.45)] px-3 py-4"
              aria-label="Original column — drop here to keep this task in this list"
            />
          ) : (
        <div
          className="border-border bg-white content-stretch flex flex-col items-start overflow-clip relative rounded-[8px] border border-solid shadow-[0px_20px_6px_0px_rgba(26,59,84,0),0px_13px_5px_0px_rgba(26,59,84,0),0px_7px_4px_0px_rgba(26,59,84,0.01),0px_3px_3px_0px_rgba(26,59,84,0.03),0px_1px_2px_0px_rgba(26,59,84,0.03)] shrink-0 w-full"
        >
          <div className="content-stretch flex flex-col gap-[16px] items-start p-[14px] relative shrink-0 w-full">
            <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
              <div className="content-stretch flex gap-[12px] items-start justify-between relative shrink-0 w-full">
                <p className="flex-[1_0_0] font-['Satoshi:Medium',sans-serif] leading-[normal] min-h-px min-w-px not-italic relative text-[#0b191f] text-[16px] tracking-[-0.16px]">
                  {task.title}
                </p>
                <Flag
                  size={14}
                  className={cn("shrink-0", taskPriorityFlagClass(task.priority))}
                  aria-label={`Priority: ${taskPriorityLabel(task.priority)}`}
                />
              </div>
              {descPreview ? (
                <p
                  className="font-['Satoshi:Medium',sans-serif] line-clamp-2 leading-[normal] not-italic relative shrink-0 w-full text-[#606d76] text-[14px]"
                  title={descTruncated ? desc : undefined}
                >
                  {descPreview}
                </p>
              ) : null}
            </div>
            <div
              className="relative h-[2px] w-full shrink-0 overflow-hidden bg-[#ebedee]"
              role="progressbar"
              aria-valuenow={checklistPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Checklist progress"
            >
              <div
                className="absolute inset-y-0 left-0 bg-[#08090A]"
                style={{ width: `${checklistPct}%` }}
              />
            </div>
            <div className="content-stretch relative flex w-full shrink-0 flex-wrap items-center justify-between gap-2">
              <div className="content-stretch relative flex min-w-0 shrink-0 items-center">
                <KanbanAssigneeAvatars
                  assigneeUserIds={assigneeUserIds}
                  memberByUserId={memberByUserId}
                  sizePx={18}
                  variant="card"
                />
              </div>
              <div className="ml-auto min-w-0 max-w-full">
                <KanbanTaskMetaPills
                  attachments={task.attachments}
                  comments={task.comments}
                  branchCount={branchCount}
                  dependencyCount={task.dependencyCount ?? 0}
                  wrap
                />
              </div>
            </div>
          </div>
        </div>
          )}
        </div>
      </KanbanTaskCardContextMenu>
    );
  };

  if (tasksQuery.isLoading || kanbanBoardQuery.isLoading) {
    return view === "list" ? <SprintKanbanListSkeleton /> : <KanbanBoardSkeleton />;
  }

  const openTaskHref = (taskId: string) => {
    const taskPath = workspaceJoin("task", String(taskId));
    const taskSearch = searchParams.toString();
    navigate(taskSearch ? `${taskPath}?${taskSearch}` : taskPath);
  };

  if (tasksQuery.isError) {
    return (
      <div className="content-stretch relative z-[1] flex w-full min-h-[200px] flex-1 items-center justify-center gap-[16px] px-4 text-center font-['Satoshi',sans-serif] text-[14px] text-[#727d83]">
        Could not load tasks for this project.
      </div>
    );
  }

  const colWrap = (
    columnId: string,
    children: ReactNode,
    header: ReactNode,
    isColumnDragSource = false,
  ) => {
    const isDropTarget = dragOverCol === columnId && draggingId !== null;
    return (
      <div
        data-kanban-col={columnId}
        className={cn(
          "content-stretch flex h-full min-h-0 flex-col items-start overflow-hidden p-[16px] relative rounded-[16px] min-h-[120px] transition-colors duration-200",
          isColumnDragSource && "opacity-0",
          isDropTarget && "bg-[#eef4f8]",
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
        {isDropTarget ? (
          <div
            className="pointer-events-none absolute inset-x-[16px] top-0 h-[3px] rounded-full bg-primary"
            aria-hidden
          />
        ) : null}
        <div className="flex w-full shrink-0 flex-col gap-4 bg-[#f9fafb]">
          {header}
        </div>
        <div
          className="scrollbar-none flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto py-4"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)",
          }}
        >
          {children}
        </div>
      </div>
    );
  };

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
        onCreateTask={() => openCreateTaskInColumn(col.id)}
        kebabMenu={renderColumnKebabMenu(col)}
      />
    );
  };

  const alternateViewFallback =
    view === "list" ? <SprintKanbanListSkeleton /> : <KanbanBoardSkeleton />;

  return (
    <>
      {view === "list" ? (
        <Suspense fallback={alternateViewFallback}>
          <SprintKanbanListView
            tasks={filtered}
            columns={columns}
            columnTasks={columnTasks}
            members={members}
            projectId={projectId}
            milestoneId={milestoneId}
            onCreateTask={openCreateTaskInColumn}
            draggingId={draggingId}
            dragOverCol={dragOverCol}
            cardPointerDown={cardPointerDown}
            columnKebabMenu={(col) => renderColumnKebabMenu(col)}
          />
        </Suspense>
      ) : view === "gantt" ? (
        <Suspense fallback={alternateViewFallback}>
          <GanttChartView
            tasks={filtered}
            members={members}
            milestoneNameById={milestoneNameById}
            onOpenTask={openTaskHref}
            scrollRef={boardScrollRef}
          />
        </Suspense>
      ) : view === "calendar" ? (
        <Suspense fallback={alternateViewFallback}>
          <CalendarTaskView tasks={filtered} onOpenTask={openTaskHref} />
        </Suspense>
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
        onOpenChange={(next) => {
          setCreateTaskOpen(next);
          if (!next) setCreateTaskColumnId(null);
        }}
        projectId={projectId}
        milestoneId={milestoneId}
        defaultColumnId={createTaskColumnId}
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
