import type React from "react";
import { useCallback, useRef, useState } from "react";

/**
 * Vertical pointer-drag reordering for a single checklist of rows.
 *
 * Usage:
 * - Wrap each row in an element marked `data-checklist-row` inside a single parent container.
 * - Attach `onHandlePointerDown(idx)` to the row's drag handle (e.g. a GripVertical button).
 * - On drop, the hook fires `onReorder(from, to)` with the source and target indices.
 *
 * The hook tracks one drag session per instance; mount it once per visible list.
 */
export function useChecklistItemDrag(onReorder: (from: number, to: number) => void) {
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const overIdxRef = useRef<number | null>(null);

  const onHandlePointerDown = useCallback(
    (idx: number) => (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      const handle = e.currentTarget;
      const row = handle.closest<HTMLElement>("[data-checklist-row]");
      const container = row?.parentElement ?? null;
      if (!container) return;

      setDraggingIdx(idx);
      setOverIdx(idx);
      overIdxRef.current = idx;
      document.body.style.setProperty("user-select", "none");

      const onMove = (ev: PointerEvent) => {
        const rows = Array.from(
          container.querySelectorAll<HTMLElement>("[data-checklist-row]"),
        );
        if (rows.length === 0) return;
        let target = rows.length - 1;
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i]!.getBoundingClientRect();
          const mid = r.top + r.height / 2;
          if (ev.clientY < mid) {
            target = i;
            break;
          }
        }
        if (overIdxRef.current !== target) {
          overIdxRef.current = target;
          setOverIdx(target);
        }
      };

      const finish = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", finish);
        document.removeEventListener("pointercancel", finish);
        document.body.style.removeProperty("user-select");
        const to = overIdxRef.current;
        setDraggingIdx(null);
        setOverIdx(null);
        overIdxRef.current = null;
        if (to != null && to !== idx) onReorder(idx, to);
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", finish);
      document.addEventListener("pointercancel", finish);
    },
    [onReorder],
  );

  return { draggingIdx, overIdx, onHandlePointerDown };
}

/** Pure helper: move `from` to `to` in an immutable copy of `arr`. */
export function reorderChecklistItems<T>(arr: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) {
    return [...arr];
  }
  const next = [...arr];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  return next;
}
