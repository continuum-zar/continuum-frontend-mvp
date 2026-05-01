"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import { cn } from "@/app/components/ui/utils";
import { useKanbanColumnSearchDismiss } from "./useKanbanColumnSearchDismiss";

export type KanbanColumnSearchControlsProps = {
  /** When true, shows the text field to the left of the search icon. */
  open: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onOpen: () => void;
  /** Called when closing (outside click, Escape, or toggling the icon while open). Parent should clear `query`. */
  onClose: () => void;
  searchIconSrc: string;
  /** Extra controls after the search icon (e.g. kebab, create task). */
  children?: ReactNode;
  /** Narrow columns (board) vs wider list header — adjusts max input width. */
  variant?: "board" | "list";
};

/**
 * Search icon + optional inline input (input sits to the left of the icon).
 * Click outside or Escape dismisses the field; icon toggles open/closed.
 */
export function KanbanColumnSearchControls({
  open,
  query,
  onQueryChange,
  onOpen,
  onClose,
  searchIconSrc,
  children,
  variant = "board",
}: KanbanColumnSearchControlsProps) {
  const containerRef = useKanbanColumnSearchDismiss(open, onClose);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus({ preventScroll: true });
  }, [open]);

  const inputWidth =
    variant === "board"
      ? "w-[min(148px,calc(100vw-200px))] shrink-0"
      : "min-w-[120px] max-w-[min(280px,45vw)] w-[200px] shrink-0";

  return (
    <div
      ref={containerRef}
      className={cn("flex min-w-0 shrink items-center gap-[8px]", variant === "list" && "gap-[12px]")}
    >
      {open ? (
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search tasks…"
          autoComplete="off"
          className={cn(
            "h-8 rounded-[8px] border border-[#e9e9e9] bg-white px-3 font-['Satoshi',sans-serif] text-[14px] text-[#0b191f] outline-none placeholder:text-[#9fa5a8] focus-visible:ring-2 focus-visible:ring-[#0b191f]/10",
            inputWidth,
          )}
          aria-label="Filter tasks in this column"
        />
      ) : null}
      <button
        type="button"
        onClick={() => (open ? onClose() : onOpen())}
        className="inline-flex size-[24px] shrink-0 cursor-pointer items-center justify-center rounded-[4px] border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b191f]/15"
        aria-label={open ? "Close column search" : "Search tasks in this column"}
        aria-expanded={open}
      >
        <img alt="" className="block size-full max-h-full max-w-full object-contain" src={searchIconSrc} />
      </button>
      {children}
    </div>
  );
}
