import { useMemo, useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { useNavigate } from "react-router";
import { Bell, Ellipsis, Flag, GripVertical, Share, Target } from "lucide-react";
import { DashboardLeftRail } from "../components/dashboard-placeholder/DashboardLeftRail";
import { useAssignedToMeTasks } from "@/api/hooks";
import { useAuthStore } from "@/store/authStore";
import { memberAvatarBackgroundFromKey } from "@/lib/memberAvatar";
import type { TaskAPIResponse } from "@/types/task";

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

/** Same destination as Kanban / list task cards: dashboard-placeholder task shell + TaskDetail. */
function placeholderTaskHref(row: TaskAPIResponse): string {
  const q = new URLSearchParams();
  q.set("project", String(row.project_id));
  if (row.milestone_id != null) q.set("milestone", String(row.milestone_id));
  q.set("from", "assigned");
  return `/dashboard-placeholder/task/${row.id}?${q.toString()}`;
}

const tabBtn = (active: boolean) =>
  `rounded-[8px] px-4 py-2 text-[14px] font-medium ${
    active
      ? "border border-[#ededed] bg-white text-[#0b191f] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
      : "text-[#606d76]"
  }`;

export function DashboardPlaceholderAssigned() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"Sprint" | "Time logs" | "Activity">("Sprint");
  const user = useAuthStore((s) => s.user);
  const { data: assignedTasks = [], isLoading, isError, refetch } = useAssignedToMeTasks({
    enabled: tab === "Sprint",
  });

  const assigneeInitials = useMemo(
    () => userInitials(user?.first_name, user?.last_name, user?.email),
    [user?.first_name, user?.last_name, user?.email]
  );
  const assigneeBg = user ? memberAvatarBackgroundFromKey(user.id || user.email) : "#e19c02";

  const tasks = tab === "Sprint" ? assignedTasks : [];

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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#606d76]">
                <Target size={16} />
                <p className="text-[16px]">Assigned to Me</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#ededed] bg-white text-[#0b191f] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]">
                  <Bell size={16} />
                </button>
                <button className="flex h-8 items-center gap-2 rounded-[8px] border border-[#ededed] bg-white px-4 text-[14px] text-[#0b191f] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]">
                  <Share size={16} />
                  Share
                </button>
              </div>
            </div>

            <div className="h-px w-full bg-[#ebedee]" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-[32px] font-medium text-[#0b191f]">Assigned to Me</p>
                <Ellipsis size={16} className="text-[#0b191f]" />
              </div>
              <div className="rounded-[10px] bg-[#f0f3f5] p-[2px]">
                <button className={tabBtn(tab === "Sprint")} onClick={() => setTab("Sprint")}>
                  Sprint
                </button>
                <button className={tabBtn(tab === "Time logs")} onClick={() => setTab("Time logs")}>
                  Time logs
                </button>
                <button className={tabBtn(tab === "Activity")} onClick={() => setTab("Activity")}>
                  Activity
                </button>
              </div>
            </div>
          </div>

          {tab !== "Sprint" ? (
            <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto overflow-x-clip px-6 pb-4 pt-4 overscroll-y-contain">
              <div className="flex flex-col items-center gap-4 py-16 text-[#727d83]">
                <div className="flex w-[286px] flex-col items-center gap-4">
                  <Target size={48} />
                  <p className="text-[20px] font-bold">No Tasks Assigned to Me</p>
                  <p className="text-[14px]">TBA</p>
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto overflow-x-clip px-6 pb-4 pt-4 overscroll-y-contain">
              <div className="flex flex-col items-center justify-center py-16 text-[#727d83]">
                <p className="text-[14px]">Loading tasks…</p>
              </div>
            </div>
          ) : isError ? (
            <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto overflow-x-clip px-6 pb-4 pt-4 overscroll-y-contain">
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#727d83]">
                <p className="text-[14px]">Could not load tasks.</p>
                <button
                  type="button"
                  className="rounded-[8px] border border-[#ebedee] px-3 py-1.5 text-[14px] text-[#0b191f]"
                  onClick={() => void refetch()}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto overflow-x-clip px-6 pb-4 pt-4 overscroll-y-contain">
              <div className="flex flex-col items-center py-16 text-[#727d83]">
                <div className="flex w-[286px] flex-col items-center gap-4">
                  <Target size={48} />
                  <p className="text-[20px] font-bold">No Tasks Assigned to Me</p>
                  <p className="text-[14px]">Tasks assigned to you will appear here.</p>
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
                {tasks.map((row) => (
                  <div
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    className="grid cursor-pointer grid-cols-[225px_185px_292px_72px_124px_52px_56px_24px] items-center gap-6 border-b border-[#ebedee] bg-white px-4 py-1 transition-colors hover:bg-[#fafbfc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#24B5F8]"
                    onClick={() => navigate(placeholderTaskHref(row))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(placeholderTaskHref(row));
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
                      <Flag size={16} aria-hidden />
                    </div>
                    <p className="text-[14px] text-[#697378]">{checklistProgressPercent(row)}</p>
                    <div className="flex justify-center text-[#697378]">
                      <button
                        type="button"
                        className="rounded p-0.5 hover:bg-[#f0f3f5]"
                        aria-label="Task options"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Ellipsis size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
