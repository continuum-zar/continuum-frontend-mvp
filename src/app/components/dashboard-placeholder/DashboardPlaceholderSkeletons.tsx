import { Skeleton } from "@/app/components/ui/skeleton";

const TASK_TABLE_GRID =
  "grid grid-cols-[225px_185px_292px_72px_124px_52px_56px_24px] items-center gap-6";

type DashboardTaskListTableSkeletonProps = {
  rowCount?: number;
};

/** Table header + skeleton rows matching the unified My tasks (assigned / created) lists. */
export function DashboardTaskListTableSkeleton({ rowCount = 8 }: DashboardTaskListTableSkeletonProps) {
  return (
    <>
      <div className="relative z-10 shrink-0 border-b border-[#ebedee] bg-[#f0f3f5] px-6 pt-4">
        <div className={`${TASK_TABLE_GRID} rounded-t-[8px] px-4 py-3 text-[16px] text-[#606d76]`}>
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
      <div
        className="scrollbar-none relative z-0 min-h-0 flex-1 overflow-y-auto overflow-x-clip px-6 pb-4 overscroll-y-contain"
        role="status"
        aria-busy="true"
        aria-label="Loading tasks"
      >
        {Array.from({ length: rowCount }, (_, i) => (
          <div
            key={i}
            className={`${TASK_TABLE_GRID} border-b border-[#ebedee] bg-white px-4 py-2`}
            aria-hidden
          >
            <div className="flex min-w-0 items-center gap-2">
              <Skeleton className="h-4 w-4 shrink-0 rounded" />
              <Skeleton className="h-4 max-w-[180px] min-w-0 flex-1" />
            </div>
            <Skeleton className="h-3 w-[120px]" />
            <Skeleton className="h-10 w-full max-w-[280px]" />
            <Skeleton className="h-6 w-6 justify-self-start rounded-full" />
            <Skeleton className="h-3 w-20" />
            <div className="flex justify-center">
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-3 w-8" />
            <div className="flex justify-center">
              <Skeleton className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/** Kanban board: column headers + card-shaped placeholders. */
export function KanbanBoardSkeleton() {
  return (
    <div
      className="content-stretch relative z-[1] flex min-h-[320px] w-full flex-1 gap-4 overflow-x-auto px-4 pb-4 font-['Satoshi',sans-serif]"
      role="status"
      aria-busy="true"
      aria-label="Loading tasks"
    >
      {[0, 1, 2].map((col) => (
        <div
          key={col}
          className="flex min-h-[120px] w-[350px] shrink-0 flex-col overflow-hidden rounded-[16px] p-4"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%), linear-gradient(90deg, rgb(240, 243, 245) 0%, rgb(240, 243, 245) 100%)",
          }}
        >
          <div className="flex w-full shrink-0 items-center gap-2 pb-4">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="h-px w-full shrink-0 bg-[#e5e7eb]" />
          <div className="scrollbar-none flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pt-4">
            {[0, 1, 2].map((row) => (
              <Skeleton key={row} className="h-[120px] w-full shrink-0 rounded-[16px]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Dashboard home content skeleton: header row, summary band, and two side-by-side
 * panels — matches the shape of the home view when KPI cards / productivity rhythm
 * are hidden.
 */
export function DashboardHomeContentSkeleton() {
  return (
    <div
      className="flex w-full flex-col gap-6 px-6 pb-6 pt-6"
      role="status"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-32 rounded-[8px]" />
          <Skeleton className="h-8 w-28 rounded-[8px]" />
        </div>
      </div>
      <Skeleton className="h-28 w-full rounded-[12px]" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-[280px] w-full rounded-[12px]" />
        <Skeleton className="h-[280px] w-full rounded-[12px]" />
      </div>
      <Skeleton className="h-[220px] w-full rounded-[12px]" />
    </div>
  );
}

/**
 * Productivity rhythm content skeleton: header, member legend row, and a tall
 * heatmap-style block matching the rhythm view layout.
 */
export function ProductivityRhythmContentSkeleton() {
  return (
    <div
      className="flex w-full flex-col gap-6 px-6 pb-6 pt-6"
      role="status"
      aria-busy="true"
      aria-label="Loading productivity rhythm"
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-3 w-80" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-[8px]" />
          <Skeleton className="h-8 w-28 rounded-[8px]" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-7 w-32 rounded-[999px]" />
        ))}
      </div>
      <Skeleton className="h-[360px] w-full rounded-[12px]" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Skeleton className="h-[220px] w-full rounded-[12px]" />
        <Skeleton className="h-[220px] w-full rounded-[12px]" />
      </div>
    </div>
  );
}

/**
 * AI planner content skeleton: input panel + a stack of project/section blocks.
 * Replaces the spinner shown while the planner page chunk loads.
 */
export function AIPlannerContentSkeleton() {
  return (
    <div
      className="flex w-full flex-col gap-6 px-6 pb-6 pt-6"
      role="status"
      aria-busy="true"
      aria-label="Loading AI planner"
    >
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-3 w-96 max-w-full" />
      </div>
      <Skeleton className="h-[140px] w-full rounded-[12px]" />
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-[12px] border border-[#ebedee] bg-white p-4"
            aria-hidden
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-20 rounded-[8px]" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Task detail skeleton: title row, meta band, description block, and an
 * activity-style list. Used while the task detail chunk + initial data load.
 */
export function TaskDetailSkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-6 pb-6 pt-6"
      role="status"
      aria-busy="true"
      aria-label="Loading task"
    >
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-8 w-3/4" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-7 w-24 rounded-[8px]" />
        <Skeleton className="h-7 w-28 rounded-[8px]" />
        <Skeleton className="h-7 w-20 rounded-[8px]" />
        <Skeleton className="h-7 w-24 rounded-[8px]" />
      </div>
      <Skeleton className="h-[180px] w-full rounded-[12px]" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3" aria-hidden>
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Sprint list view: stacked column sections with row blocks. */
export function SprintKanbanListSkeleton() {
  return (
    <div
      className="content-stretch relative z-[1] flex min-h-[280px] w-full flex-1 flex-col gap-4 px-4 pb-4 font-['Satoshi',sans-serif]"
      role="status"
      aria-busy="true"
      aria-label="Loading tasks"
    >
      {[0, 1, 2].map((sec) => (
        <div key={sec} className="flex flex-col gap-3 rounded-[16px] border border-[#ebedee] bg-[#f9fafb] p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-36" />
          </div>
          {[0, 1].map((row) => (
            <Skeleton key={row} className="h-14 w-full rounded-[12px]" />
          ))}
        </div>
      ))}
    </div>
  );
}
