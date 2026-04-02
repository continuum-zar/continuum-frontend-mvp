"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { useProjectMilestones } from "@/api/hooks";
import type { Milestone } from "@/types/milestone";

import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";
import { CreateMilestoneModal } from "@/app/components/dashboard-placeholder/CreateMilestoneModal";
import { welcomeMilestoneTimelineMock } from "@/app/data/welcomeDashboardMock";
import { cn } from "../ui/utils";

/** Figma node 35:11709 — lucide/goal */
const imgLucideGoal = mcpAsset("4c9029a9-ad80-4490-8581-35f0a2f32754");

const addButtonClass =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-[8px] border border-solid border-[#ebedee] bg-white py-2 pl-4 pr-3 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]";

function formatTimelineDateLabel(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function sortMilestonesForTimeline(list: Milestone[]): Milestone[] {
  return [...list].sort((a, b) => {
    const ta = a.dueDateIso ? new Date(a.dueDateIso.includes("T") ? a.dueDateIso : `${a.dueDateIso}T12:00:00`).getTime() : 0;
    const tb = b.dueDateIso ? new Date(b.dueDateIso.includes("T") ? b.dueDateIso : `${b.dueDateIso}T12:00:00`).getTime() : 0;
    return tb - ta;
  });
}

export type WelcomeMilestoneTimelineProps = {
  /** Demo uses mock data; `live` loads milestones for `projectId` */
  variant?: "demo" | "live";
  /** Required when `variant` is `live` */
  projectId?: number;
};

/**
 * Milestone timelines — under Repository on welcome (Figma 35:11176 / 35:11664–35:11707).
 * Live variant uses the same row styling after milestones are created via {@link CreateMilestoneModal}.
 */
export function WelcomeMilestoneTimeline({ variant = "demo", projectId }: WelcomeMilestoneTimelineProps) {
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const isLive = variant === "live" && projectId != null && Number.isFinite(projectId);

  const { data: milestones = [], isLoading } = useProjectMilestones(isLive ? projectId : undefined);

  const rows = useMemo(() => {
    if (!isLive) {
      return welcomeMilestoneTimelineMock.map((m) => ({
        id: m.id,
        dateLabel: m.dateLabel,
        title: m.title,
        description: m.description,
      }));
    }
    return sortMilestonesForTimeline(milestones).map((m) => ({
      id: m.id,
      dateLabel: formatTimelineDateLabel(m.dueDateIso),
      title: m.name,
      description: m.desc?.trim() || "—",
    }));
  }, [isLive, milestones]);

  const showEmptyLive = isLive && !isLoading && milestones.length === 0;

  return (
    <>
      <div className="flex w-full flex-col gap-4">
        <div className="flex w-full items-center justify-between">
          <p className="font-['Satoshi',sans-serif] text-[24px] font-medium leading-normal whitespace-nowrap text-[#0b191f]">
            Milestone timelines
          </p>
          <button
            type="button"
            className={cn(
              addButtonClass,
              !isLive && "cursor-not-allowed opacity-60"
            )}
            disabled={!isLive}
            title={!isLive ? "Open a project from the sidebar to add milestones" : undefined}
            onClick={() => isLive && setMilestoneModalOpen(true)}
          >
            Add
            <Plus className="size-4" strokeWidth={2} />
          </button>
        </div>

        {isLive && isLoading && (
          <div className="flex min-h-[120px] w-full items-center justify-center font-['Satoshi',sans-serif] text-[14px] text-[#727d83]">
            Loading milestones…
          </div>
        )}

        {showEmptyLive && (
          <div className="flex min-h-[185px] w-full flex-1 items-center justify-center rounded-[12px] bg-white p-6">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative size-12 shrink-0">
                <img alt="" className="absolute block size-full max-w-none" src={imgLucideGoal} />
              </div>
              <p className="font-['Satoshi',sans-serif] text-[16px] font-bold leading-normal text-[#727d83]">
                No milestone connected
              </p>
            </div>
          </div>
        )}

        {((isLive && !isLoading && milestones.length > 0) || !isLive) && (
          <div className="relative flex flex-col gap-4">
            <div
              className="pointer-events-none absolute top-[25px] bottom-[25px] left-[24px] w-px bg-[#e4eaec]"
              aria-hidden
            />
            {rows.map((m) => (
              <div key={m.id} className="relative z-[1] flex max-w-[474px] items-start overflow-hidden rounded-[8px] pr-2">
                <div className="flex w-[50px] shrink-0 justify-center">
                  <div className="flex size-[50px] shrink-0 items-center justify-center rounded-[99px] bg-[#edf0f3]">
                    <img
                      alt=""
                      className="block size-4 max-w-none shrink-0"
                      src={imgLucideGoal}
                      aria-hidden
                    />
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center py-1.5 pl-4 pr-2 font-['Satoshi',sans-serif] font-medium leading-normal">
                  <p className="w-[183px] max-w-full truncate text-[12px] text-[#727d83]">{m.dateLabel}</p>
                  <p className="text-[16px] text-[#0b191f]">{m.title}</p>
                  <p className="truncate text-[12px] text-[#727d83] whitespace-nowrap">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isLive && projectId != null && (
        <CreateMilestoneModal open={milestoneModalOpen} onOpenChange={setMilestoneModalOpen} projectId={projectId} />
      )}
    </>
  );
}
