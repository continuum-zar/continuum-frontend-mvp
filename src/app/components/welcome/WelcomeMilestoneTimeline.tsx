"use client";

import { useMemo, useState } from "react";
import { CircleCheckBig, Plus } from "lucide-react";

import { useProjectMilestones } from "@/api/hooks";
import type { Milestone } from "@/types/milestone";

import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";
import {
  CreateMilestoneModal,
  type CreateMilestoneModalEditing,
} from "@/app/components/dashboard-placeholder/CreateMilestoneModal";
import { welcomeMilestoneTimelineMock } from "@/app/data/welcomeDashboardMock";
import { milestoneTimelineShowsCompletedIcon } from "@/lib/milestoneCompletion";
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

function milestoneDueTimeMs(m: Milestone): number {
  if (!m.dueDateIso) return Number.POSITIVE_INFINITY;
  const raw = m.dueDateIso.includes("T") ? m.dueDateIso : `${m.dueDateIso}T12:00:00`;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

/** Earliest due date first so the list reads as a forward timeline (past → future). */
function sortMilestonesForTimeline(list: Milestone[]): Milestone[] {
  return [...list].sort((a, b) => {
    const ta = milestoneDueTimeMs(a);
    const tb = milestoneDueTimeMs(b);
    if (ta !== tb) return ta - tb;
    return String(a.name).localeCompare(String(b.name), undefined, { sensitivity: "base" });
  });
}

export type WelcomeMilestoneTimelineProps = {
  /** Demo uses mock data; `live` loads milestones for `projectId` */
  variant?: "demo" | "live";
  /** Required when `variant` is `live` */
  projectId?: number;
};

/**
 * Milestone timelines — project overview: placed above the Sprints section (after hero/metrics).
 * Live variant uses the same row styling after milestones are created via {@link CreateMilestoneModal}.
 */
export function WelcomeMilestoneTimeline({ variant = "demo", projectId }: WelcomeMilestoneTimelineProps) {
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<CreateMilestoneModalEditing | null>(null);
  const isLive = variant === "live" && projectId != null && Number.isFinite(projectId);

  const { data: milestones = [], isLoading } = useProjectMilestones(isLive ? projectId : undefined);

  const rows = useMemo(() => {
    if (!isLive) {
      const demo = [...welcomeMilestoneTimelineMock].sort((a, b) => {
        const pa = a.dateLabel.split("-").map(Number);
        const pb = b.dateLabel.split("-").map(Number);
        const da = pa.length === 3 ? new Date(pa[2], pa[1] - 1, pa[0]).getTime() : 0;
        const db = pb.length === 3 ? new Date(pb[2], pb[1] - 1, pb[0]).getTime() : 0;
        if (da !== db) return da - db;
        return String(a.title).localeCompare(String(b.title), undefined, { sensitivity: "base" });
      });
      return demo.map((m) => ({
        id: m.id,
        dateLabel: m.dateLabel,
        title: m.title,
        description: m.description,
        allTasksCompleted: Boolean(m.allTasksCompleted),
      }));
    }
    return sortMilestonesForTimeline(milestones).map((m) => ({
      id: m.id,
      dateLabel: formatTimelineDateLabel(m.dueDateIso),
      title: m.name,
      description: m.desc?.trim() || "—",
      allTasksCompleted: milestoneTimelineShowsCompletedIcon(m.progress, m.status),
    }));
  }, [isLive, milestones]);

  const showEmptyLive = isLive && !isLoading && milestones.length === 0;

  return (
    <>
      <div className="flex w-full flex-col gap-4" data-tour="welcome-milestones">
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
            onClick={() => {
              if (!isLive) return;
              setEditingMilestone(null);
              setMilestoneModalOpen(true);
            }}
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
                  {isLive ? (
                    <button
                      type="button"
                      className="flex size-[50px] shrink-0 cursor-pointer items-center justify-center rounded-[99px] bg-[#edf0f3] outline-none transition-colors hover:bg-[#e4eaec] focus-visible:ring-2 focus-visible:ring-[#1466ff]/40"
                      aria-label={`Edit milestone ${m.title}`}
                      onClick={() => {
                        const ms = milestones.find((x) => x.id === m.id);
                        if (!ms) return;
                        setEditingMilestone({
                          id: ms.id,
                          name: ms.name,
                          description: ms.desc,
                          dueDateIso: ms.dueDateIso,
                        });
                        setMilestoneModalOpen(true);
                      }}
                    >
                      {m.allTasksCompleted ? (
                        <CircleCheckBig
                          className="pointer-events-none size-4 shrink-0 text-[#0b191f]"
                          strokeWidth={2}
                          aria-hidden
                        />
                      ) : (
                        <img
                          alt=""
                          className="pointer-events-none block size-4 max-w-none shrink-0"
                          src={imgLucideGoal}
                          aria-hidden
                        />
                      )}
                    </button>
                  ) : (
                    <div className="flex size-[50px] shrink-0 items-center justify-center rounded-[99px] bg-[#edf0f3]">
                      {m.allTasksCompleted ? (
                        <CircleCheckBig
                          className="size-4 shrink-0 text-[#0b191f]"
                          strokeWidth={2}
                          aria-hidden
                        />
                      ) : (
                        <img
                          alt=""
                          className="block size-4 max-w-none shrink-0"
                          src={imgLucideGoal}
                          aria-hidden
                        />
                      )}
                    </div>
                  )}
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
        <CreateMilestoneModal
          open={milestoneModalOpen}
          onOpenChange={(open) => {
            setMilestoneModalOpen(open);
            if (!open) setEditingMilestone(null);
          }}
          projectId={projectId}
          editingMilestone={editingMilestone}
        />
      )}
    </>
  );
}
