"use client";

import { ArrowUpDown } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { cn } from "@/app/components/ui/utils";
import type { KanbanColumnAutoSortInfo } from "./kanbanBoardTypes";

export type KanbanColumnAutoSortHintProps = {
  info: KanbanColumnAutoSortInfo;
  className?: string;
};

/**
 * Up/down sort affordance for auto-ordered columns; stroke weight and gray match MCP header icons (e.g. search).
 */
export function KanbanColumnAutoSortHint({ info, className }: KanbanColumnAutoSortHintProps) {
  return (
    <Tooltip delayDuration={250}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex size-[24px] shrink-0 cursor-help items-center justify-center rounded-[4px] border-0 bg-transparent p-0",
            "text-[#606d76] hover:text-[#0b191f] motion-reduce:transition-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b191f]/15",
            className,
          )}
          aria-label={info.description}
          onClick={(e) => e.stopPropagation()}
        >
          <ArrowUpDown className="size-[16px]" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={4} className="max-w-[240px] text-balance">
        {info.description}
      </TooltipContent>
    </Tooltip>
  );
}
