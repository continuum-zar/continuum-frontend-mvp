import { useEffect, useMemo } from "react";
import { format, isValid, parseISO } from "date-fns";
import { useNavigate, useSearchParams } from "react-router";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { Ellipsis, Flag, GripVertical, ListTodo, Target } from "lucide-react";
import { DashboardLeftRail } from "../components/dashboard-placeholder/DashboardLeftRail";
import { workspaceJoin, type WorkspaceMyTasksScope, workspaceMyTasksHref } from "@/lib/workspacePaths";
import { useAssignedToMeTasks, useCreatedByMeTasks } from "@/api/hooks";
import { fetchMembers, projectKeys } from "@/api/projects";
import { useAuthStore } from "@/store/authStore";
import { memberAvatarBackground, memberAvatarBackgroundFromKey } from "@/lib/memberAvatar";
import type { Member } from "@/types/member";
import { taskPriorityFlagClass, type TaskAPIResponse } from "@/types/task";
import { STALE_REFERENCE_MS, LONG_GC_MS } from "@/lib/queryDefaults";
import { Skeleton } from "@/app/components/ui/skeleton";
import { DashboardTaskListTableSkeleton } from "@/app/components/dashboard-placeholder/DashboardPlaceholderSkeletons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";

const MAX_MEMBER_FETCH_CONCURRENCY = 8;

function parseScope(raw: string | null): WorkspaceMyTasksScope {
  return raw === "created" ? "created" : "assigned";
}

function checklistProgressPercent(task: TaskAPIResponse): string {
  const items = task.checklists ?? [];
  if (items.length === 0) return "0%";
  const done = items.filter((c) => c.done).length;
  return `${Math.round((done / items.length) * 100)}%`;
}

function formatDueDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = parseISO(iso);
  if (!isValid(d)) return "—";
  return format(d, "d MMMM yyyy");
}

function userInitials(first?: string, last?: string, email?: string): string {
  const a = first?.trim()?.[0] ?? "";
  const b = last?.trim()?.[0] ?? "";
  if (a || b) return `${a}${b}`.toUpperCase();
  const e = email?.trim();
  if (e && e.length >= 2) return e.slice(0, 2).toUpperCase();
  return "?";
}

function placeholderTaskHref(row: TaskAPIResponse, from: WorkspaceMyTasksScope): string {
  const q = new URLSearchParams();
  q.set("project", String(row.project_id));
  if (row.milestone_id != null) q.set("milestone", String(row.milestone_id));
  q.set("from", from);
  return `${workspaceJoin("task", String(row.id))}?${q.toString()}`;
}

const tabBtn = (active: boolean) =>
  `rounded-[8px] px-4 py-2 text-[14px] font-medium ${
    active
      ? "border border-[#ededed] bg-white text-[#0b191f] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
      : "text-[#606d76]"
  }`;

export function DashboardPlaceholderMyTasks() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawScope = searchParams.get("scope");
  const scope = parseScope(rawScope);

  useEffect(() => {
    if (rawScope !== null && rawScope !== "assigned" && rawScope !== "created") {
      setSearchParams({ scope: "assigned" }, { replace: true });
      return;
    }
    if (rawScope === null) {
      setSearchParams({ scope: "assigned" }, { replace: true });
    }
  }, [rawScope, setSearchParams]);

  const user = useAuthStore((s) => s.user);
  const assigneeInitials = useMemo(
    () => userInitials(user?.first_name, user?.last_name, user?.email),
    [user?.first_name, user?.last_name, user?.email]
  );
  const assigneeBg = user ? memberAvatarBackgroundFromKey(user.id || user.email) : "#e19c02";

  const {
    data: assignedTasks = [],
    isLoading: assignedLoading,
    isError: assignedError,
    refetch: refetchAssigned,
  } = useAssignedToMeTasks({
    enabled: scope === "assigned",
  });

  const {
    data: createdTasks = [],
    isLoading: createdLoading,
    isError: createdError,
    refetch: refetchCreated,
  } = useCreatedByMeTasks({
    enabled: scope === "created",
  });

  const projectIds = useMemo(
    () => [...new Set(createdTasks.map((t) => t.project_id))],
    [createdTasks]
  );

  const { cachedProjectIds, projectIdsToFetch } = useMemo(() => {
    const cached: number[] = [];
    const toFetch: number[] = [];
    for (const pid of projectIds) {
      const hit = queryClient.getQueryData<Member[]>(projectKeys.members(pid));
      if (hit) {
        cached.push(pid);
      } else if (toFetch.length < MAX_MEMBER_FETCH_CONCURRENCY) {
        toFetch.push(pid);
      }
    }
    return { cachedProjectIds: cached, projectIdsToFetch: toFetch };
  }, [projectIds, queryClient]);

  const memberQueries = useQueries({
    queries: projectIdsToFetch.map((pid) => ({
      queryKey: projectKeys.members(pid),
      queryFn: () => fetchMembers(pid),
      enabled: scope === "created",
      staleTime: STALE_REFERENCE_MS,
      gcTime: LONG_GC_MS,
      refetchOnWindowFocus: false,
    })),
  });

  const memberByProjectUser = useMemo(() => {
    const map = new Map<string, Member>();
    projectIdsToFetch.forEach((pid, idx) => {
      const members = memberQueries[idx]?.data;
      if (!members) return;
      for (const m of members) {
        map.set(`${pid}:${m.userId}`, m);
      }
    });
    for (const pid of cachedProjectIds) {
      const members = queryClient.getQueryData<Member[]>(projectKeys.members(pid));
      if (!members) continue;
      for (const m of members) {
        map.set(`${pid}:${m.userId}`, m);
      }
    }
    return map;
  }, [projectIdsToFetch, cachedProjectIds, memberQueries, queryClient]);

  const memberQueryIdxByProjectId = useMemo(() => {
    const m = new Map<number, number>();
    projectIdsToFetch.forEach((pid, i) => m.set(pid, i));
    return m;
  }, [projectIdsToFetch]);

  const showAssigneeSkeleton = (row: TaskAPIResponse) => {
    if (row.assigned_to == null) return false;
    if (memberByProjectUser.has(`${row.project_id}:${row.assigned_to}`)) return false;
    const idx = memberQueryIdxByProjectId.get(row.project_id);
    if (idx === undefined) return false;
    return memberQueries[idx]?.isLoading === true;
  };

  const setScope = (next: WorkspaceMyTasksScope) => {
    void navigate(workspaceMyTasksHref(next), { replace: true });
  };

  const tasks = scope === "assigned" ? assignedTasks : createdTasks;
  const isLoading = scope === "assigned" ? assignedLoading : createdLoading;
  const isError = scope === "assigned" ? assignedError : createdError;
  const refetch = scope === "assigned" ? refetchAssigned : refetchCreated;

  const titleMain = scope === "assigned" ? "Assigned to Me" : "Created by Me";
  const titleEyebrow = scope === "assigned" ? "Assigned to Me" : "Created by Me";

  return (
    <div
      className="box-border flex h-screen min-h-0 w-full min-w-0 flex-col overflow-hidden gap-[10px] pb-[8px] pl-[12px] pr-[8px] pt-[12px] font-['Satoshi',sans-serif]"
      style={{
        backgroundImage:
          "linear-gradient(0deg, rgba(178, 230, 247, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%)",
      }}
    >
      <div className="isolate flex min-h-0 w-full min-w-0 flex-1 flex-row items-stretch gap-[10px]">
        <DashboardLeftRail />

        <section className="z-[1] flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[8px] border border-[#ebedee] bg-white shadow-[0px_44px_12px_0px_rgba(15,15,31,0),0px_28px_11px_0px_rgba(15,15,31,0.01),0px_16px_10px_0px_rgba(15,15,31,0.02),0px_7px_7px_0px_rgba(15,15,31,0.03),0px_2px_4px_0px_rgba(15,15,31,0.04)]">
          <div className="relative z-20 flex shrink-0 flex-col gap-4 bg-white px-6 pt-4">
            <div className="flex items-center gap-2 text-[#606d76]">
              {scope === "assigned" ? <Target size={16} /> : <ListTodo size={16} />}
              <p className="text-[16px]">{titleEyebrow}</p>
            </div>

            <div className="h-px w-full bg-[#ebedee]" />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <p className="text-[32px] font-medium text-[#0b191f]">{titleMain}</p>
                <Ellipsis size={16} className="text-[#0b191f]" />
              </div>
              <div
                role="tablist"
                aria-label="Task list scope"
                data-tour="my-tasks-scope-toggle"
                className="rounded-[10px] bg-[#f0f3f5] p-[2px]"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={scope === "assigned"}
                  className={tabBtn(scope === "assigned")}
                  onClick={() => setScope("assigned")}
                >
                  Assigned to me
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={scope === "created"}
                  className={tabBtn(scope === "created")}
                  onClick={() => setScope("created")}
                >
                  Created by me
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <DashboardTaskListTableSkeleton />
          ) : isError ? (
            <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto overflow-x-clip px-6 pb-4 pt-4 overscroll-y-contain">
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#727d83]">
                <p className="text-[14px]">Could not load tasks.</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="rounded-[8px] border border-[#ebedee] px-3 py-1.5 text-[14px] text-[#0b191f]"
                      onClick={() => void refetch()}
                    >
                      Retry
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Retry loading tasks</TooltipContent>
                </Tooltip>
              </div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto overflow-x-clip px-6 pb-4 pt-4 overscroll-y-contain">
              <div className="flex flex-col items-center py-16 text-[#727d83]">
                <div className="flex w-[286px] flex-col items-center gap-4">
                  {scope === "assigned" ? <Target size={48} /> : <ListTodo size={48} />}
                  <p className="text-[20px] font-bold">
                    {scope === "assigned" ? "No Tasks Assigned to Me" : "No Tasks Created by You"}
                  </p>
                  <p className="text-[14px]">
                    {scope === "assigned"
                      ? "Tasks assigned to you will appear here."
                      : "Tasks you create will show up here."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="relative z-10 shrink-0 border-b border-[#ebedee] bg-[#f0f3f5] px-6 pt-4">
                <div className="grid grid-cols-[225px_185px_292px_72px_124px_52px_56px_24px] items-center gap-6 rounded-t-[8px] px-4 py-3 text-[16px] text-[#606d76]">
                  <p>Task</p>
                  <p>Project</p>
                  <p>Description</p>
                  <p>Assignee</p>
                  <p>Due Date</p>
                  <p>Priority</p>
                  <p>Progress</p>
                  <span />
                </div>
              </div>
              <div className="scrollbar-none relative z-0 min-h-0 flex-1 overflow-y-auto overflow-x-clip px-6 pb-4 overscroll-y-contain">
                {scope === "assigned"
                  ? tasks.map((row) => (
                      <div
                        key={row.id}
                        role="button"
                        tabIndex={0}
                        className="grid cursor-pointer grid-cols-[225px_185px_292px_72px_124px_52px_56px_24px] items-center gap-6 border-b border-[#ebedee] bg-white px-4 py-1 transition-colors hover:bg-[#fafbfc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#24B5F8]"
                        onClick={() => navigate(placeholderTaskHref(row, "assigned"))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigate(placeholderTaskHref(row, "assigned"));
                          }
                        }}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <GripVertical size={16} className="pointer-events-none shrink-0 text-[#727d83]" aria-hidden />
                          <p className="min-w-0 truncate text-[16px] text-[#131617]">{row.title || "Untitled task"}</p>
                        </div>
                        <p className="truncate text-[14px] text-[#727d83]">
                          {row.project_name?.trim() || `Project ${row.project_id}`}
                        </p>
                        <p className="line-clamp-2 text-[14px] text-[#727d83]">
                          {row.description?.trim() || "—"}
                        </p>
                        <div className="flex items-center">
                          <div
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-white text-[9px] text-white"
                            style={{ backgroundColor: assigneeBg }}
                            title={user?.email ?? "You"}
                          >
                            {assigneeInitials}
                          </div>
                        </div>
                        <p className="text-[14px] text-[#697378]">{formatDueDate(row.due_date)}</p>
                        <div className="flex justify-center text-[#697378]">
                          <Flag size={16} className={taskPriorityFlagClass(row.priority)} aria-hidden />
                        </div>
                        <p className="text-[14px] text-[#697378]">{checklistProgressPercent(row)}</p>
                        <div className="flex justify-center text-[#697378]">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="rounded p-0.5 hover:bg-[#f0f3f5]"
                                aria-label="Task options"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Ellipsis size={16} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Task options</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    ))
                  : tasks.map((row) => {
                      const assignee =
                        row.assigned_to != null
                          ? memberByProjectUser.get(`${row.project_id}:${row.assigned_to}`)
                          : undefined;
                      const assigneeBg =
                        row.assigned_to != null ? memberAvatarBackground(row.assigned_to) : "#9fa5a8";
                      const assigneeLabel =
                        assignee?.initials ??
                        (row.assigned_to != null ? String(row.assigned_to).slice(-2) : "");

                      return (
                        <div
                          key={row.id}
                          role="button"
                          tabIndex={0}
                          className="grid cursor-pointer grid-cols-[225px_185px_292px_72px_124px_52px_56px_24px] items-center gap-6 border-b border-[#ebedee] bg-white px-4 py-1 transition-colors hover:bg-[#fafbfc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#24B5F8]"
                          onClick={() => navigate(placeholderTaskHref(row, "created"))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              navigate(placeholderTaskHref(row, "created"));
                            }
                          }}
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <GripVertical size={16} className="pointer-events-none shrink-0 text-[#727d83]" aria-hidden />
                            <p className="min-w-0 truncate text-[16px] text-[#131617]">{row.title || "Untitled task"}</p>
                          </div>
                          <p className="truncate text-[14px] text-[#727d83]">
                            {row.project_name?.trim() || `Project ${row.project_id}`}
                          </p>
                          <p className="line-clamp-2 text-[14px] text-[#727d83]">{row.description?.trim() || "—"}</p>
                          <div className="flex items-center">
                            {showAssigneeSkeleton(row) ? (
                              <Skeleton className="h-6 w-6 shrink-0 rounded-full" aria-label="Loading assignee" />
                            ) : row.assigned_to != null ? (
                              <div
                                className="flex h-6 w-6 items-center justify-center rounded-full border border-white text-[9px] text-white"
                                style={{ backgroundColor: assigneeBg }}
                                title={assignee?.name ?? assignee?.email ?? `User ${row.assigned_to}`}
                              >
                                {assigneeLabel}
                              </div>
                            ) : (
                              <span className="text-[14px] text-[#697378]">—</span>
                            )}
                          </div>
                          <p className="text-[14px] text-[#697378]">{formatDueDate(row.due_date)}</p>
                          <div className="flex justify-center text-[#697378]">
                            <Flag size={16} className={taskPriorityFlagClass(row.priority)} aria-hidden />
                          </div>
                          <p className="text-[14px] text-[#697378]">{checklistProgressPercent(row)}</p>
                          <div className="flex justify-center text-[#697378]">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="rounded p-0.5 hover:bg-[#f0f3f5]"
                                  aria-label="Task options"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Ellipsis size={16} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Task options</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      );
                    })}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
