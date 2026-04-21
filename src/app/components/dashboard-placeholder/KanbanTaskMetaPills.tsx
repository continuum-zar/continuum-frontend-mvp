"use client";

import { GitBranch } from "lucide-react";

import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";

const imgLucidePaperclip = mcpAsset("c4929b2e-a9fc-4fce-913e-ecf4dafe6944");
const imgLucideMessageCircle = mcpAsset("ff8c6057-7f55-46be-8899-4cb59d2eda1a");

const pillShell =
  "bg-[#f0f3f5] content-stretch flex gap-[4px] items-center justify-center px-[12px] py-[4px] relative rounded-[16px] self-stretch shrink-0";

type KanbanTaskMetaPillsProps = {
  attachments: number;
  comments: number;
  /** Number of linked repo/branch pairs on the task. */
  branchCount: number;
};

/**
 * Footer-style stats: attachments, comments, linked branches — same pill treatment as the
 * original two-badge row, with branch count using the Git branch icon.
 */
export function KanbanTaskMetaPills({ attachments, comments, branchCount }: KanbanTaskMetaPillsProps) {
  const showRow = attachments > 0 || comments > 0 || branchCount > 0;
  const faded = showRow ? "" : " opacity-0";

  return (
    <div className="content-stretch flex gap-[8px] h-[24px] items-start relative shrink-0">
      <div className={`${pillShell}${faded}`} title="Attachments">
        <div className="relative shrink-0 size-[16px]">
          <img alt="" className="absolute block max-w-none size-full" src={imgLucidePaperclip} />
        </div>
        <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[11px] whitespace-nowrap">
          {attachments}
        </p>
      </div>
      <div className={`${pillShell}${faded}`} title="Comments">
        <div className="content-stretch flex items-center justify-center relative shrink-0 size-[15.333px]">
          <div className="relative shrink-0 size-[13.33px]">
            <img alt="" className="absolute block max-w-none size-full" src={imgLucideMessageCircle} />
          </div>
        </div>
        <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[11px] whitespace-nowrap">
          {comments}
        </p>
      </div>
      <div className={`${pillShell}${faded}`} title="Linked branches">
        <GitBranch size={14} className="shrink-0 text-[#606d76]" aria-hidden />
        <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[11px] whitespace-nowrap">
          {branchCount}
        </p>
      </div>
    </div>
  );
}
