"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/app/components/ui/utils";
import { useKanbanColumnSearchDismiss } from "./useKanbanColumnSearchDismiss";

export type LeftRailProjectSearchControlsProps = {
  open: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onOpen: () => void;
  /** Parent should clear `query` when closing. */
  onClose: () => void;
  searchIconSrc: string;
};

const pillClassName =
  "bg-[#edf0f3] content-stretch flex gap-[8px] h-[40px] items-center px-[16px] py-[8px] relative rounded-[999px] shrink-0 w-full";

/**
 * Full-width pill search for the workspace left rail.
 * Closed: button with icon + label. Open: inline input with dismiss on outside click / Escape.
 */
export function LeftRailProjectSearchControls({
  open,
  query,
  onQueryChange,
  onOpen,
  onClose,
  searchIconSrc,
}: LeftRailProjectSearchControlsProps) {
  const containerRef = useKanbanColumnSearchDismiss(open, onClose);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus({ preventScroll: true });
  }, [open]);

  return (
    <div ref={containerRef} className="w-full shrink-0">
      {open ? (
        <div className={pillClassName} data-name="Component 6">
          <div className="relative shrink-0 size-[16px]" aria-hidden>
            <img alt="" className="absolute block max-w-none size-full" src={searchIconSrc} />
          </div>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search projects…"
            autoComplete="off"
            className="min-w-0 flex-1 border-0 bg-transparent font-['Satoshi:Medium',sans-serif] text-[14px] text-[#0b191f] outline-none placeholder:text-[#606d76] focus-visible:ring-0"
            aria-label="Search projects"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            pillClassName,
            "cursor-pointer border-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b191f]/15",
          )}
          aria-label="Search projects"
          aria-expanded={false}
          data-name="Component 6"
        >
          <div className="relative shrink-0 size-[16px]" aria-hidden>
            <img alt="" className="absolute block max-w-none size-full" src={searchIconSrc} />
          </div>
          <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#606d76] text-[14px] text-center whitespace-nowrap">
            Search Projects
          </p>
        </button>
      )}
    </div>
  );
}
