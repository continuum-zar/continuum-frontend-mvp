"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";

import { cn } from "@/app/components/ui/utils";
import { kanbanColumnAutoSortInfo, type KanbanColumnConfig } from "./kanbanBoardTypes";
import { KanbanColumnAutoSortHint } from "./KanbanColumnAutoSortHint";
import { useKanbanColumnSearchDismiss } from "./useKanbanColumnSearchDismiss";

export type KanbanBoardColumnHeaderProps = {
  col: KanbanColumnConfig;
  /** Optional control shown before the column icon (e.g. reorder grip). */
  reorderHandle?: ReactNode;
  columnIconSrc: string;
  searchOpen: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onSearchOpen: () => void;
  onSearchClose: () => void;
  searchIconSrc: string;
  showCreateTask: boolean;
  onCreateTask: () => void;
  /** Kebab menu (column options). */
  kebabMenu: ReactNode;
};

/**
 * Board column header: title row keeps kebab + create aligned; search expands on a second row
 * so the field does not squeeze icons to the column edge.
 */
export function KanbanBoardColumnHeader({
  col,
  reorderHandle,
  columnIconSrc,
  searchOpen,
  query,
  onQueryChange,
  onSearchOpen,
  onSearchClose,
  searchIconSrc,
  showCreateTask,
  onCreateTask,
  kebabMenu,
}: KanbanBoardColumnHeaderProps) {
  const containerRef = useKanbanColumnSearchDismiss(searchOpen, onSearchClose);
  const inputRef = useRef<HTMLInputElement>(null);
  const sortInfo = kanbanColumnAutoSortInfo(col);

  useEffect(() => {
    if (!searchOpen) return;
    inputRef.current?.focus({ preventScroll: true });
  }, [searchOpen]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "content-stretch flex w-full min-w-0 flex-col gap-2 relative",
        showCreateTask && "isolate z-[2]",
      )}
    >
      <div className="content-stretch flex min-w-0 items-center justify-between gap-2">
        <div className="content-stretch flex min-w-0 flex-1 gap-[8px] items-center">
          {reorderHandle != null ? (
            <span className="flex shrink-0 items-center">{reorderHandle}</span>
          ) : null}
          <div className="relative shrink-0 size-[16px]">
            <img alt="" className="absolute block max-w-none size-full" src={columnIconSrc} />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
            <p className="font-['Satoshi:Medium',sans-serif] leading-[normal] not-italic relative min-w-0 shrink truncate text-[#606d76] text-[14px]">
              {col.title}
            </p>
            {sortInfo != null ? <KanbanColumnAutoSortHint info={sortInfo} /> : null}
          </div>
        </div>
        <div className="content-stretch flex shrink-0 items-center gap-[6px] sm:gap-[8px]">
          {!searchOpen ? (
            <button
              type="button"
              onClick={onSearchOpen}
              className="inline-flex size-[24px] shrink-0 cursor-pointer items-center justify-center rounded-[4px] border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b191f]/15"
              aria-label="Search tasks in this column"
              aria-expanded={false}
            >
              <img alt="" className="block size-full max-h-full max-w-full object-contain" src={searchIconSrc} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSearchClose}
              className="inline-flex size-[24px] shrink-0 cursor-pointer items-center justify-center rounded-[4px] border-0 bg-transparent p-0 text-[#606d76] transition-colors hover:text-[#0b191f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b191f]/15"
              aria-label="Close column search"
            >
              <X className="size-[18px]" strokeWidth={2} aria-hidden />
            </button>
          )}
          {kebabMenu}
        </div>
      </div>
      {searchOpen ? (
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search tasks…"
          autoComplete="off"
          className="h-8 w-full min-w-0 rounded-[8px] border border-[#e9e9e9] bg-white px-3 font-['Satoshi',sans-serif] text-[14px] text-[#0b191f] outline-none placeholder:text-[#9fa5a8] focus-visible:ring-2 focus-visible:ring-[#0b191f]/10"
          aria-label="Filter tasks in this column"
        />
      ) : null}
      {showCreateTask ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCreateTask();
          }}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-[8px] border border-dashed border-[#cdd2d5] bg-white/60 px-3 font-['Satoshi:Medium',sans-serif] text-[13px] text-[#606d76] transition-colors hover:border-[#0b191f]/25 hover:bg-white hover:text-[#0b191f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b191f]/15"
          aria-label={`Create task in ${col.title}`}
        >
          <Plus className="size-[14px]" strokeWidth={2} aria-hidden />
          <span>Create task</span>
        </button>
      ) : null}
    </div>
  );
}
