"use client";

import { GitBranch } from "lucide-react";
import { Link2 } from "lucide-react";

import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";

const imgLucidePaperclip = mcpAsset("c4929b2e-a9fc-4fce-913e-ecf4dafe6944");
const imgLucideMessageCircle = mcpAsset("ff8c6057-7f55-46be-8899-4cb59d2eda1a");

const pillShell =
  "content-stretch flex gap-[4px] items-center justify-center px-[4px] py-[2px] relative rounded-[16px] shrink-0";
const pillText =
  "font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[11px] whitespace-nowrap";

type KanbanTaskMetaPillsProps = {
  attachments: number;
  comments: number;
  /** Number of linked repo/branch pairs on the task. */
  branchCount: number;
  dependencyCount?: number;
  /** Allow pills to wrap when parent width is constrained (task cards). */
  wrap?: boolean;
};

/**
 * Footer-style stats: attachments, comments, linked branches — plain icon + count,
 * no pill background, per refined task-card design.
 */
export function KanbanTaskMetaPills({
  attachments,
  comments,
  branchCount,
  dependencyCount = 0,
  wrap = false,
}: KanbanTaskMetaPillsProps) {
  const showRow = attachments > 0 || comments > 0 || branchCount > 0 || dependencyCount > 0;
  const faded = showRow ? "" : " opacity-0";
  const rowClass = wrap
    ? "content-stretch flex max-w-full flex-wrap justify-end gap-[4px] items-center relative shrink min-w-0"
    : "content-stretch flex gap-[4px] items-center relative shrink-0";

  return (
    <div className={rowClass}>
      <div className={`${pillShell}${faded}`} title="Attachments">
        <div className="relative shrink-0 size-[14px]">
          <img alt="" className="absolute block max-w-none size-full" src={imgLucidePaperclip} />
        </div>
        <p className={pillText}>{attachments}</p>
      </div>
      <div className={`${pillShell}${faded}`} title="Comments">
        <div className="relative shrink-0 size-[14px]">
          <img alt="" className="absolute block max-w-none size-full" src={imgLucideMessageCircle} />
        </div>
        <p className={pillText}>{comments}</p>
      </div>
      <div className={`${pillShell}${faded}`} title="Linked branches">
        <GitBranch size={14} className="shrink-0 text-[#606d76]" aria-hidden />
        <p className={pillText}>{branchCount}</p>
      </div>
      <div className={`${pillShell}${faded}`} title="Dependencies">
        <Link2 size={14} className="shrink-0 text-[#606d76]" aria-hidden />
        <p className={pillText}>{dependencyCount}</p>
      </div>
    </div>
  );
}
