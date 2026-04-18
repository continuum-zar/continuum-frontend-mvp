import { Skeleton } from "@/app/components/ui/skeleton";

const TASK_TABLE_GRID =
  "grid grid-cols-[225px_185px_292px_72px_124px_52px_56px_24px] items-center gap-6";

type DashboardTaskListTableSkeletonProps = {
  rowCount?: number;
};

/** Table header + skeleton rows matching Created / Assigned dashboard task lists. */
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
