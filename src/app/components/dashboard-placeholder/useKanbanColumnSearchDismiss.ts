"use client";

import { useEffect, useRef } from "react";

/**
 * Decide whether a pointerdown should dismiss the column search.
 *
 * Returns false (do not dismiss) when the target is:
 * - inside the search container,
 * - inside a Radix dropdown menu (kebab menu, column move menu, etc.),
 * - inside any element marked `data-no-kanban-search-dismiss` (e.g. task cards
 *   that navigate on click — without this, clearing the query would reflow the
 *   list and the click would land on the wrong row).
 */
export function shouldDismissKanbanColumnSearchOnPointerDown(
  target: EventTarget | null,
  containerEl: Element | null,
): boolean {
  if (target instanceof Element) {
    if (target.closest('[data-slot="dropdown-menu-content"]')) return false;
    if (target.closest('[data-slot="dropdown-menu-sub-content"]')) return false;
    if (target.closest("[data-no-kanban-search-dismiss]")) return false;
  }
  if (containerEl?.contains(target as Node)) return false;
  return true;
}

/** Attach `ref` to the wrapper that should count as "inside" search (outside closes). */
export function useKanbanColumnSearchDismiss(open: boolean, onClose: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!shouldDismissKanbanColumnSearchOnPointerDown(e.target, containerRef.current)) return;
      onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return containerRef;
}
