import { lazy, Suspense, useCallback, useRef, useState } from "react";
import { useParams } from "react-router";
import { DashboardLeftRail } from "../components/dashboard-placeholder/DashboardLeftRail";
import { AIPlannerContentSkeleton } from "../components/dashboard-placeholder/DashboardPlaceholderSkeletons";
import { PlannerLeaveConfirmModal } from "../components/planner/PlannerLeaveConfirmModal";

const AIProjectPlanner = lazy(() =>
  import("./AIProjectPlanner").then((m) => ({ default: m.AIProjectPlanner }))
);

export type DashboardPlaceholderAIPlannerProps = {
  /** When set, planner loads this project id for refinement (overrides route param). */
  refineProjectId?: number | null;
};

/** AI Project Planner inside the dashboard-placeholder shell (left rail + bordered main surface). */
export function DashboardPlaceholderAIPlanner({
  refineProjectId: refineProjectIdProp = null,
}: DashboardPlaceholderAIPlannerProps = {}) {
  const params = useParams<{ projectId?: string }>();
  const routePid =
    params.projectId != null && /^\d+$/.test(params.projectId) ? Number(params.projectId) : null;
  const refineProjectId =
    refineProjectIdProp != null && Number.isFinite(refineProjectIdProp)
      ? refineProjectIdProp
      : routePid;

  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);

  const requestNavigate = useCallback((proceed: () => void) => {
    pendingNavigationRef.current = proceed;
    setLeaveModalOpen(true);
  }, []);

  const handleConfirmLeave = useCallback(() => {
    const run = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    run?.();
  }, []);

  const handleLeaveModalOpenChange = useCallback((open: boolean) => {
    if (!open) {
      pendingNavigationRef.current = null;
    }
    setLeaveModalOpen(open);
  }, []);

  return (
    <>
      <PlannerLeaveConfirmModal
        open={leaveModalOpen}
        onOpenChange={handleLeaveModalOpenChange}
        onConfirmLeave={handleConfirmLeave}
      />
      <div
        className="box-border flex h-screen min-h-0 w-full flex-col overflow-hidden gap-[10px] pb-[8px] pl-[12px] pr-[8px] pt-[12px] font-['Satoshi',sans-serif]"
        style={{
          backgroundImage:
            "linear-gradient(0deg, rgba(178, 230, 247, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(90deg, var(--background) 0%, var(--background) 100%)",
        }}
      >
        <div className="flex min-h-0 w-full flex-1 flex-col items-end gap-2">
          <div className="isolate flex min-h-0 w-full flex-1 items-stretch gap-[16px]">
            <DashboardLeftRail plannerNavigationGuard={{ requestNavigate }} />
            <section className="relative z-[1] isolate flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[8px] border border-border border-solid bg-card shadow-[0px_44px_12px_0px_rgba(15,15,31,0),0px_28px_11px_0px_rgba(15,15,31,0.01),0px_16px_10px_0px_rgba(15,15,31,0.02),0px_7px_7px_0px_rgba(15,15,31,0.03),0px_2px_4px_0px_rgba(15,15,31,0.04)]">
              <Suspense fallback={<AIPlannerContentSkeleton />}>
                <AIProjectPlanner
                  embedded
                  onRequestNavigateAway={requestNavigate}
                  refineProjectId={refineProjectId}
                />
              </Suspense>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
