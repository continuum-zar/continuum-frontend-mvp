import { DashboardLeftRail } from "../components/dashboard-placeholder/DashboardLeftRail";
import { AIProjectPlanner } from "./AIProjectPlanner";

/** AI Project Planner inside the dashboard-placeholder shell (left rail + bordered main surface). */
export function DashboardPlaceholderAIPlanner() {
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
          <DashboardLeftRail />
          <section className="relative z-[1] isolate flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[8px] border border-[#ebedee] border-solid bg-white shadow-[0px_44px_12px_0px_rgba(15,15,31,0),0px_28px_11px_0px_rgba(15,15,31,0.01),0px_16px_10px_0px_rgba(15,15,31,0.02),0px_7px_7px_0px_rgba(15,15,31,0.03),0px_2px_4px_0px_rgba(15,15,31,0.04)]">
            <AIProjectPlanner embedded />
          </section>
        </div>
      </div>
    </div>
  );
}
