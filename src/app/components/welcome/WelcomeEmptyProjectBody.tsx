/**
 * New project overview (placeholder data + empty sections) — Figma playground node 35:10701.
 * Milestone empty card: 35:11112; section header: 35:11072.
 */
import { WelcomeMetricsRow } from "./WelcomeMetricsRow";
import { WelcomeProjectHeroGauge } from "./WelcomeProjectHeroGauge";

const imgLucidePlus = "https://www.figma.com/api/mcp/asset/91e46d01-6ae8-4fc9-aa4e-13b1040fb3cf";
const imgLucideCircleCheckBig = "https://www.figma.com/api/mcp/asset/41c88891-51ac-4464-b6eb-547fa8d0e688";
const imgLucideCircleDashed = "https://www.figma.com/api/mcp/asset/f7749471-815b-4202-a0c7-5bc740426265";
const imgLucideTrafficCone = "https://www.figma.com/api/mcp/asset/30a100c4-ae3a-49ae-a09f-8e007edeaa41";
const imgLucideActivity = "https://www.figma.com/api/mcp/asset/8b04e159-5943-4424-a1ff-8259ce5f1905";
const imgLucidePaperclip = "https://www.figma.com/api/mcp/asset/eca27db3-d7a3-4625-8615-00ef276c3530";
const imgLucideGitBranch = "https://www.figma.com/api/mcp/asset/1638b448-769f-4e9f-b1e0-f8bd6e479808";
const imgLucideGoal = "https://www.figma.com/api/mcp/asset/183d0e54-4a33-4803-b12d-d870a190794d";
const imgLucideUsers = "https://www.figma.com/api/mcp/asset/4202e9d8-d2e7-4542-8b8e-eafd6dcf6d0d";

function AddButton({ label = "Add" }: { label?: string }) {
  return (
    <button
      type="button"
      className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-[8px] border border-solid border-[#ebedee] bg-white py-2 pl-4 pr-3 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
    >
      {label}
      <img alt="" className="size-4" src={imgLucidePlus} />
    </button>
  );
}

function EmptyPlaceholderCard({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex min-h-[185px] flex-1 items-center justify-center rounded-[12px] bg-white p-6">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="relative size-12 shrink-0">
          <img alt="" className="absolute block size-full max-w-none" src={icon} />
        </div>
        <p className="font-['Satoshi',sans-serif] text-[16px] font-bold leading-normal text-[#727d83]">{title}</p>
      </div>
    </div>
  );
}

export function WelcomeEmptyProjectBody() {
  return (
    <div className="relative flex w-full min-w-0 flex-col items-center gap-16 pb-8 pt-12">
      <div className="flex w-full max-w-[815px] flex-col items-center gap-16">
        <WelcomeProjectHeroGauge />
        <WelcomeMetricsRow />
      </div>

      <div className="flex w-full max-w-[815px] flex-col gap-4">
        <div className="flex w-full items-center justify-between">
          <p className="font-['Satoshi',sans-serif] text-[24px] font-medium text-[#0b191f]">Sprints</p>
          <AddButton />
        </div>
        <div className="flex flex-col gap-4 shadow-[0px_20px_6px_0px_rgba(26,59,84,0),0px_13px_5px_0px_rgba(26,59,84,0),0px_7px_4px_0px_rgba(26,59,84,0.01),0px_3px_3px_0px_rgba(26,59,84,0.03),0px_1px_2px_0px_rgba(26,59,84,0.03)]">
          <div className="flex items-stretch overflow-hidden rounded-[12px] border border-solid border-[#ebedee]">
            <div className="flex flex-1 flex-col gap-6 bg-white p-6">
              <div className="flex size-8 items-center justify-center rounded-[8px] border border-solid border-[#ededed] bg-white">
                <img alt="" className="size-4" src={imgLucideCircleCheckBig} />
              </div>
              <div className="flex flex-col gap-2">
                <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">Done</p>
                <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#727d83]">Short message goes here</p>
                <div className="relative h-1.5 w-full overflow-hidden rounded-[26px] bg-[#e4eaec]">
                  <div className="absolute left-0 top-0 size-1.5 rounded-full bg-[#0b191f]" />
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-6 border-l border-solid border-[#ebedee] bg-white p-6">
              <div className="flex size-8 items-center justify-center rounded-[8px] border border-solid border-[#ededed] bg-white">
                <img alt="" className="size-4" src={imgLucideCircleDashed} />
              </div>
              <div className="flex flex-col gap-2">
                <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">In progress</p>
                <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#727d83]">Short message goes here</p>
                <div className="relative h-1.5 w-full overflow-hidden rounded-[26px] bg-[#e4eaec]">
                  <div className="absolute left-[0.33px] top-0 size-1.5 rounded-full bg-[#0b191f]" />
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-6 border-l border-solid border-[#ebedee] bg-white p-6">
              <div className="flex size-8 items-center justify-center rounded-[8px] border border-solid border-[#ededed] bg-white">
                <img alt="" className="size-4" src={imgLucideTrafficCone} />
              </div>
              <div className="flex flex-col gap-2">
                <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">Blocked</p>
                <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#727d83]">Short message goes here</p>
                <div className="relative h-1.5 w-full overflow-hidden rounded-[26px] bg-[#e4eaec]">
                  <div className="absolute -left-px top-0 size-1.5 rounded-full bg-[#0b191f]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full max-w-[815px] flex-col gap-4">
        <p className="font-['Satoshi',sans-serif] text-[24px] font-medium text-[#0b191f]">Recent activity</p>
        <EmptyPlaceholderCard icon={imgLucideActivity} title="No recent activity" />
      </div>

      <div className="flex w-full max-w-[815px] flex-col gap-4">
        <div className="flex w-full items-center justify-between">
          <p className="font-['Satoshi',sans-serif] text-[24px] font-medium text-[#0b191f]">Resources</p>
          <AddButton />
        </div>
        <EmptyPlaceholderCard icon={imgLucidePaperclip} title="No resources attached" />
      </div>

      <div className="flex w-full max-w-[815px] flex-col gap-4">
        <div className="flex w-full items-center justify-between">
          <p className="font-['Satoshi',sans-serif] text-[24px] font-medium text-[#0b191f]">Repository</p>
          <AddButton />
        </div>
        <EmptyPlaceholderCard icon={imgLucideGitBranch} title="No repositories connected" />
      </div>

      <div className="flex w-full max-w-[815px] flex-col gap-4">
        <div className="flex w-full items-center justify-between">
          <p className="font-['Satoshi',sans-serif] text-[24px] font-medium text-[#0b191f]">Milestone timelines</p>
          <AddButton />
        </div>
        <EmptyPlaceholderCard icon={imgLucideGoal} title="No milestone connected" />
      </div>

      <div className="flex w-full max-w-[815px] flex-col gap-4">
        <div className="flex w-full items-center justify-between">
          <p className="font-['Satoshi',sans-serif] text-[24px] font-medium text-[#0b191f]">Team</p>
          <AddButton />
        </div>
        <EmptyPlaceholderCard icon={imgLucideUsers} title="No members assigned" />
      </div>
    </div>
  );
}
