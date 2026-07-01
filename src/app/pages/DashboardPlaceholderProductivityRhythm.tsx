import { lazy, Suspense } from "react";
import { BrandedLoadingPlaceholder } from "@/app/components/ui/branded-loading";

const DashboardLeftRail = lazy(() =>
  import("../components/dashboard-placeholder/DashboardLeftRail").then((m) => ({
    default: m.DashboardLeftRail,
  }))
);

// Productivity Rhythm is temporarily disabled. The page renders the branded
// "Continuum" placeholder with a "Coming soon" status while the feature (and
// its backend `/users/{id}/rhythm` endpoint) is switched off.
export function DashboardPlaceholderProductivityRhythm() {
  return (
    <div
      className="box-border flex h-screen min-h-0 w-full flex-col overflow-hidden gap-[10px] pb-[8px] pl-[12px] pr-[8px] pt-[12px] font-['Satoshi',sans-serif]"
      style={{
        backgroundImage:
          "linear-gradient(0deg, rgba(178, 230, 247, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%)",
      }}
    >
      <div className="flex min-h-0 w-full flex-1 flex-col items-end gap-2">
        <div className="isolate flex min-h-0 w-full flex-1 items-stretch gap-[16px]">
          <Suspense fallback={<div className="h-full w-[212px] shrink-0" aria-hidden />}>
            <DashboardLeftRail />
          </Suspense>
          <section className="relative z-[1] isolate flex min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto rounded-[8px] border border-[#ebedee] border-solid bg-white shadow-[0px_44px_12px_0px_rgba(15,15,31,0),0px_28px_11px_0px_rgba(15,15,31,0.01),0px_16px_10px_0px_rgba(15,15,31,0.02),0px_7px_7px_0px_rgba(15,15,31,0.03),0px_2px_4px_0px_rgba(15,15,31,0.04)]">
            <div className="mx-auto flex w-full max-w-[1500px] flex-1 items-center justify-center">
              <BrandedLoadingPlaceholder
                label="Coming soon"
                hint="Productivity Rhythm is taking a short break. We're polishing it and it'll be back soon."
                className="min-h-[60vh]"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
