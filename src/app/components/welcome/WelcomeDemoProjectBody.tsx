"use client";

import { Info, Plus } from "lucide-react";

import { memberAvatarBackground } from "@/lib/memberAvatar";
import { welcomeGaugeMock, welcomeTeamMock } from "@/app/data/welcomeDashboardMock";

import { LiveHeroGauge, LiveMetricsRow } from "./LiveProjectGauges";
import { WelcomeMilestoneTimeline } from "./WelcomeMilestoneTimeline";
import {
  WelcomeRecentActivity,
  WelcomeRepo,
  WelcomeResources,
} from "./WelcomeActivityResourcesRepo";

const addButtonClass =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-[8px] border border-solid border-[#ebedee] bg-white py-2 pl-4 pr-3 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]";

function DemoTeamMemberCard({
  name,
  initials,
  roleLabel,
  totalHours,
  tasksCompleted,
  bg,
}: {
  name: string;
  initials: string;
  roleLabel: string;
  totalHours: number;
  tasksCompleted: number;
  bg: string;
}) {
  return (
    <div className="flex w-full max-w-[260px] shrink-0 flex-col gap-6 rounded-[12px] border border-solid border-[#ebedee] bg-white p-6 shadow-[0px_20px_6px_0px_rgba(26,59,84,0),0px_13px_5px_0px_rgba(26,59,84,0),0px_7px_4px_0px_rgba(26,59,84,0.01),0px_3px_3px_0px_rgba(26,59,84,0.03),0px_1px_2px_0px_rgba(26,59,84,0.03)]">
      <div className="flex h-10 w-full min-w-0 items-center">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="flex size-[35px] shrink-0 items-center justify-center rounded-full font-['Satoshi',sans-serif] text-[13px] font-medium leading-[0.4] text-white"
            style={{ backgroundColor: bg }}
          >
            {initials}
          </div>
          <div className="flex min-w-0 flex-col font-['Satoshi',sans-serif] font-medium leading-normal">
            <p className="truncate text-[14px] text-[#0b191f]" title={name}>
              {name}
            </p>
            <p className="truncate text-[12px] text-[#727d83]" title={roleLabel}>
              {roleLabel}
            </p>
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col gap-2 font-['Satoshi',sans-serif] text-[14px] font-medium leading-normal">
        <div className="flex w-full items-center justify-between gap-2">
          <p className="text-[#727d83]">Total hours</p>
          <p className="min-w-[34px] overflow-hidden text-ellipsis text-right tabular-nums text-[#0b191f]">
            {totalHours}
          </p>
        </div>
        <div className="flex w-full items-center justify-between gap-2">
          <p className="text-[#727d83]">Task completed</p>
          <p className="min-w-[34px] overflow-hidden text-ellipsis text-right tabular-nums text-[#0b191f]">
            {tasksCompleted}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Demo project overview for the `/welcome` route. Renders the same layout and
 * components as {@link WelcomeEmptyProjectBody} (dynamic gauges, milestone
 * timeline, recent activity, resources, repository, team) but from static mock
 * data so it stays aligned with the live project view.
 */
export function WelcomeDemoProjectBody({
  onOpenInviteMembers,
}: {
  onOpenInviteMembers?: () => void;
}) {
  return (
    <div className="relative flex w-full min-w-0 flex-col items-center gap-16 pb-8 pt-12">
      <div className="flex w-full max-w-[815px] flex-col items-center gap-16">
        <LiveHeroGauge score={welcomeGaugeMock.heroScore} />
        <LiveMetricsRow
          hpsRatio={welcomeGaugeMock.hpsRatio}
          completedWeight={welcomeGaugeMock.completedWeight}
          totalWeight={welcomeGaugeMock.totalWeight}
          trivialCommits={welcomeGaugeMock.trivialCommits}
          incrementalCommits={welcomeGaugeMock.incrementalCommits}
          structuralCommits={welcomeGaugeMock.structuralCommits}
        />
      </div>

      <div className="flex w-full max-w-[815px] flex-col">
        <WelcomeMilestoneTimeline variant="demo" />
      </div>

      <div className="flex w-full max-w-[815px] flex-col gap-4">
        <WelcomeRecentActivity />
      </div>

      <div className="flex w-full max-w-[815px] flex-col gap-4">
        <WelcomeResources />
      </div>

      <div className="flex w-full max-w-[815px] flex-col gap-4">
        <WelcomeRepo />
      </div>

      <div className="flex w-full max-w-[815px] flex-col gap-4" data-tour="welcome-members">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="font-['Satoshi',sans-serif] text-[24px] font-medium leading-normal text-[#0b191f]">
              Team
            </p>
            <Info className="size-4 shrink-0 text-[#727d83]" strokeWidth={2} aria-hidden />
          </div>
          <button
            type="button"
            data-tour="welcome-invite-members"
            className={addButtonClass}
            onClick={onOpenInviteMembers}
          >
            Invite Members
            <Plus className="size-4" strokeWidth={2} />
          </button>
        </div>
        <div className="flex w-full flex-wrap gap-4">
          {welcomeTeamMock.map((m) => (
            <DemoTeamMemberCard
              key={m.id}
              name={m.name}
              initials={m.initials}
              roleLabel={m.roleLabel}
              totalHours={m.totalHours}
              tasksCompleted={m.tasksCompleted}
              bg={memberAvatarBackground(m.userId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
