"use client";

import { Plus } from "lucide-react";

import { welcomeMilestoneTimelineMock } from "@/app/data/welcomeDashboardMock";

/** Figma node 35:11709 — lucide/goal */
const imgLucideGoal =
  "https://www.figma.com/api/mcp/asset/4c9029a9-ad80-4490-8581-35f0a2f32754";

const addButtonClass =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-[8px] border border-solid border-[#ebedee] bg-white py-2 pl-4 pr-3 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]";

/**
 * Milestone timelines — under Repository on welcome demo (Figma 35:11176 / 35:11664–35:11707).
 */
export function WelcomeMilestoneTimeline() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full items-center justify-between">
        <p className="font-['Satoshi',sans-serif] text-[24px] font-medium leading-normal whitespace-nowrap text-[#0b191f]">
          Milestone timelines
        </p>
        <button type="button" className={addButtonClass}>
          Add
          <Plus className="size-4" strokeWidth={2} />
        </button>
      </div>
      <div className="relative flex flex-col gap-4">
        <div
          className="pointer-events-none absolute top-[25px] bottom-[25px] left-[24px] w-px bg-[#e4eaec]"
          aria-hidden
        />
        {welcomeMilestoneTimelineMock.map((m) => (
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
    </div>
  );
}
