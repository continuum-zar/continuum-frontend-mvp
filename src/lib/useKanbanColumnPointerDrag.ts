import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getKanbanColumnInsertSlot, insertSlotToReorderIndex } from "./kanbanColumnReorder";
import { setKanbanDragActive } from "./kanbanCursor";
import {
  isPointerInKanbanBoardHorizontalScrollZone,
  stepKanbanBoardHorizontalAutoScrollFromPointer,
} from "./kanbanBoardHorizontalAutoScroll";

const DRAG_THRESHOLD_PX = 6;

type BoardEl = HTMLDivElement | null;

function readColumnRects(board: BoardEl): DOMRect[] {
  if (!board) return [];
  const nodes = board.querySelectorAll<HTMLElement>("[data-kanban-col]");
  return Array.from(nodes).map((el) => el.getBoundingClientRect());
}

interface Options {
  boardRef: React.RefObject<HTMLDivElement | null>;
  /** Column ids in board order (same as `columns.map((c) => c.id)`). */
  columnIds: string[];
  onReorder: (fromIndex: number, toIndex: number) => void;
}

interface DragRef {
  fromIndex: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  /** Latest pointer X (viewport) for auto-scroll + drop index while pointer is still. */
  lastClientX: number;
  active: boolean;
  ghost: HTMLElement | null;
  sourceEl: HTMLElement | null;
}

export function useKanbanColumnPointerDrag({ boardRef, columnIds, onReorder }: Options) {
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
  /** Insert slot 0..columnCount (inclusive end = after last column). */
  const [dropInsertSlot, setDropInsertSlot] = useState<number | null>(null);

  const drag = useRef<DragRef | null>(null);
  const autoScrollRafRef = useRef<number | null>(null);
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;
  const columnIdsRef = useRef(columnIds);
  columnIdsRef.current = columnIds;

  const cancelAutoScroll = useCallback(() => {
    if (autoScrollRafRef.current != null) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    cancelAutoScroll();
    const d = drag.current;
    if (d?.ghost) d.ghost.remove();
    drag.current = null;
    setDraggingColumnId(null);
    setDropInsertSlot(null);
    setKanbanDragActive(false);
    document.body.style.removeProperty("user-select");
  }, [cancelAutoScroll]);

  const swallowNextClick = useCallback(() => {
    const handler = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      document.removeEventListener("click", handler, true);
    };
    document.addEventListener("click", handler, true);
    setTimeout(() => document.removeEventListener("click", handler, true), 200);
  }, []);

  const handlersRef = useRef<{
    onMove: (e: PointerEvent) => void;
    onUp: (e: PointerEvent) => void;
  } | null>(null);

  useEffect(() => {
    const scheduleAutoScroll = () => {
      if (autoScrollRafRef.current != null) return;
      const tick = () => {
        autoScrollRafRef.current = null;
        const board = boardRef.current;
        const d = drag.current;
        if (!board || !d?.active) return;

        const x = d.lastClientX;
        const inZone = stepKanbanBoardHorizontalAutoScrollFromPointer(board, x);

        const rects = readColumnRects(board);
        if (rects.length === columnIdsRef.current.length) {
          setDropInsertSlot(getKanbanColumnInsertSlot(d.lastClientX, rects));
        }

        if (drag.current?.active && inZone) {
          autoScrollRafRef.current = requestAnimationFrame(tick);
        }
      };
      autoScrollRafRef.current = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;

      d.lastClientX = e.clientX;

      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;

      if (!d.active) {
        if (Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD_PX) return;
        d.active = true;
        const id = columnIdsRef.current[d.fromIndex];
        if (id) setDraggingColumnId(id);
        setKanbanDragActive(true);
        document.body.style.setProperty("user-select", "none");

        if (d.sourceEl) {
          const ghost = d.sourceEl.cloneNode(true) as HTMLElement;
          const w = d.sourceEl.offsetWidth;
          const h = d.sourceEl.offsetHeight;
          const maxH = typeof window !== "undefined" ? Math.min(h, window.innerHeight * 0.88) : h;
          const reduceMotion =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
          ghost.style.cssText = [
            "position:fixed",
            "z-index:9999",
            "pointer-events:none",
            `width:${w}px`,
            `max-height:${maxH}px`,
            "overflow:hidden",
            reduceMotion ? "" : "transform:rotate(2deg)",
            "opacity:0.94",
            "transition:none",
            "box-sizing:border-box",
            "border-radius:16px",
            "border:2px solid #24B5F8",
            "box-shadow:0px 20px 6px 0px rgba(26,59,84,0),0px 13px 5px 0px rgba(26,59,84,0.02),0px 7px 4px 0px rgba(26,59,84,0.04),0px 3px 3px 0px rgba(26,59,84,0.06),0px 1px 2px 0px rgba(26,59,84,0.08)",
          ]
            .filter(Boolean)
            .join(";");
          document.body.appendChild(ghost);
          d.ghost = ghost;
        }
      }

      if (d.ghost) {
        d.ghost.style.left = `${e.clientX - d.offsetX}px`;
        d.ghost.style.top = `${e.clientY - d.offsetY}px`;
      }

      const rects = readColumnRects(boardRef.current);
      if (rects.length !== columnIdsRef.current.length) return;
      const insertSlot = getKanbanColumnInsertSlot(e.clientX, rects);
      setDropInsertSlot(insertSlot);

      if (d.active) {
        const board = boardRef.current;
        if (board && isPointerInKanbanBoardHorizontalScrollZone(board, e.clientX)) {
          if (autoScrollRafRef.current == null) {
            scheduleAutoScroll();
          }
        }
      }
    };

    const onUp = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;

      cancelAutoScroll();

      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);

      if (d.active) {
        const rects = readColumnRects(boardRef.current);
        if (rects.length === columnIdsRef.current.length) {
          const insertSlot = getKanbanColumnInsertSlot(e.clientX, rects);
          const to = insertSlotToReorderIndex(d.fromIndex, insertSlot, rects.length);
          if (to !== d.fromIndex) {
            onReorderRef.current(d.fromIndex, to);
          }
        }
        swallowNextClick();
      }

      cleanup();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && drag.current?.active) {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
        swallowNextClick();
        cleanup();
      }
    };

    handlersRef.current = { onMove, onUp };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      if (drag.current) {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
      }
      cleanup();
    };
  }, [boardRef, cancelAutoScroll, cleanup, swallowNextClick]);

  const columnDragHandlePointerDown = useCallback(
    (columnId: string) => (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      if (drag.current) return;

      const fromIndex = columnIdsRef.current.indexOf(columnId);
      if (fromIndex < 0) return;

      const handle = e.currentTarget as HTMLElement;
      const sourceEl = handle.closest<HTMLElement>("[data-kanban-col]");
      if (!sourceEl || sourceEl.dataset.kanbanCol !== columnId) return;

      const rect = sourceEl.getBoundingClientRect();

      drag.current = {
        fromIndex,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        lastClientX: e.clientX,
        active: false,
        ghost: null,
        sourceEl,
      };

      const h = handlersRef.current;
      if (h) {
        document.addEventListener("pointermove", h.onMove);
        document.addEventListener("pointerup", h.onUp);
        document.addEventListener("pointercancel", h.onUp);
      }
    },
    [],
  );

  return { draggingColumnId, dropInsertSlot, columnDragHandlePointerDown };
}
