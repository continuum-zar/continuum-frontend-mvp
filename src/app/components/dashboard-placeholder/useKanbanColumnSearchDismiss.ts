"use client";

import { useEffect, useRef } from "react";

/** Attach `ref` to the wrapper that should count as "inside" search (outside closes). */
export function useKanbanColumnSearchDismiss(open: boolean, onClose: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target;
      if (t instanceof Element) {
        if (t.closest('[data-slot="dropdown-menu-content"]')) return;
        if (t.closest('[data-slot="dropdown-menu-sub-content"]')) return;
      }
      if (containerRef.current?.contains(e.target as Node)) return;
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
