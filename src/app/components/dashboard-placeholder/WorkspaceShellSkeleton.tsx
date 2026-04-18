import { Skeleton } from "@/app/components/ui/skeleton";
import {
  DashboardTaskListTableSkeleton,
  KanbanBoardSkeleton,
  SprintKanbanListSkeleton,
} from "./DashboardPlaceholderSkeletons";

type WorkspaceShellSkeletonProps = {
  /**
   * Controls the content area placeholder:
   * - `list` (default): Created / Assigned task table skeleton.
   * - `board`: Kanban board skeleton (three columns + cards).
   * - `sprint`: Stacked column sections for the sprint list view.
   * - `generic`: Empty card with a neutral block — used for unknown workspace routes.
   */
  variant?: "list" | "board" | "sprint" | "generic";
};

/**
 * Full-page skeleton that matches the dashboard-placeholder workspace shell:
 * a 212px left rail on the left and a white rounded content card on the right.
 * Used by AuthGuard and workspace route Suspense fallbacks so the structure
 * users see while data/JS is loading is the same one that will eventually
 * render — no more "old dashboard" cards flashing before the real UI appears.
 */
export function WorkspaceShellSkeleton({ variant = "list" }: WorkspaceShellSkeletonProps) {
  return (
    <div
      className="box-border flex h-screen min-h-0 w-full min-w-0 flex-col overflow-hidden gap-[10px] pb-[8px] pl-[12px] pr-[8px] pt-[12px] font-['Satoshi',sans-serif]"
      style={{
        backgroundImage:
          "linear-gradient(0deg, rgba(178, 230, 247, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%)",
      }}
      role="status"
      aria-busy="true"
      aria-label="Loading workspace"
    >
      <div className="isolate flex min-h-0 w-full min-w-0 flex-1 flex-row items-stretch gap-[10px]">
        <WorkspaceLeftRailSkeleton />

        <section className="z-[1] flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[8px] border border-[#ebedee] bg-white shadow-[0px_44px_12px_0px_rgba(15,15,31,0),0px_28px_11px_0px_rgba(15,15,31,0.01),0px_16px_10px_0px_rgba(15,15,31,0.02),0px_7px_7px_0px_rgba(15,15,31,0.03),0px_2px_4px_0px_rgba(15,15,31,0.04)]">
          <WorkspaceContentHeaderSkeleton />
          {variant === "board" ? (
            <div className="min-h-0 flex-1 overflow-hidden pt-4">
              <KanbanBoardSkeleton />
            </div>
          ) : variant === "sprint" ? (
            <div className="min-h-0 flex-1 overflow-hidden pt-4">
              <SprintKanbanListSkeleton />
            </div>
          ) : variant === "generic" ? (
            <WorkspaceGenericBodySkeleton />
          ) : (
            <DashboardTaskListTableSkeleton />
          )}
        </section>
      </div>
    </div>
  );
}

/** Left rail ghost — matches the width and rhythm of DashboardLeftRail. */
function WorkspaceLeftRailSkeleton() {
  return (
    <div
      className="flex h-full min-h-0 w-[212px] shrink-0 flex-col items-stretch overflow-hidden"
      aria-hidden
    >
      {/* Brand mark */}
      <div className="flex items-center justify-center pb-[16px] pt-[32px]">
        <Skeleton className="h-[26px] w-[132px] rounded-[6px]" />
      </div>

      {/* Search pill */}
      <div className="flex items-center gap-2 rounded-[999px] bg-[#edf0f3] px-4 py-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-3 w-24" />
      </div>

      {/* Nav pills (Home, Invoice, Assigned, Created) */}
      <div className="flex items-center gap-[8px] pt-[8px]">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[40px] w-[47px] rounded-[8px]" />
        ))}
      </div>

      {/* Projects header */}
      <div className="flex items-center justify-between pt-4">
        <Skeleton className="h-3 w-16" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3 rounded" />
          <Skeleton className="h-3 w-3 rounded" />
        </div>
      </div>

      {/* Projects list */}
      <div className="flex min-h-0 flex-1 flex-col gap-1 pt-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex h-[40px] items-center gap-2 px-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-3 flex-1" />
          </div>
        ))}
      </div>

      {/* Timer + ticket picker row */}
      <div className="flex items-center gap-2 py-1 pl-2">
        <div className="flex flex-1 flex-col gap-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-[42px] w-[42px] shrink-0 rounded-full" />
      </div>

      {/* Divider + profile row */}
      <div className="h-px w-full bg-[#ebedee]" />
      <div className="flex h-[40px] items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-col gap-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2.5 w-32" />
          </div>
        </div>
        <Skeleton className="h-4 w-4 rounded" />
      </div>
    </div>
  );
}

/** Content card header: eyebrow, divider, title row + tab pill bar. */
function WorkspaceContentHeaderSkeleton() {
  return (
    <div className="relative z-20 flex shrink-0 flex-col gap-4 bg-white px-6 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-[8px]" />
          <Skeleton className="h-8 w-[92px] rounded-[8px]" />
        </div>
      </div>
      <div className="h-px w-full bg-[#ebedee]" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-56 rounded" />
          <Skeleton className="h-4 w-4 rounded" />
        </div>
        <div className="flex items-center gap-1 rounded-[10px] bg-[#f0f3f5] p-[2px]">
          <Skeleton className="h-8 w-20 rounded-[8px]" />
          <Skeleton className="h-8 w-20 rounded-[8px]" />
          <Skeleton className="h-8 w-20 rounded-[8px]" />
        </div>
      </div>
    </div>
  );
}

function WorkspaceGenericBodySkeleton() {
  return (
    <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-28 w-full rounded-[12px]" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-40 w-full rounded-[12px]" />
          <Skeleton className="h-40 w-full rounded-[12px]" />
        </div>
        <Skeleton className="h-56 w-full rounded-[12px]" />
      </div>
    </div>
  );
}
