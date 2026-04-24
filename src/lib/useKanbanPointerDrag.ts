import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  isPointerInKanbanBoardHorizontalScrollZone,
  stepKanbanBoardHorizontalAutoScrollFromPointer,
} from "./kanbanBoardHorizontalAutoScroll";
import { setKanbanDragActive } from "./kanbanCursor";

const DRAG_THRESHOLD_PX = 5;

export interface UseKanbanPointerDragOptions {
  onDrop: (taskId: string, columnId: string) => void;
  getTaskColumn: (taskId: string) => string | null;
  /** Horizontal scroll container for the board row; enables edge auto-scroll while dragging a card. */
  boardScrollRef?: React.RefObject<HTMLDivElement | null>;
}

/** In-flight pointer drag state for a task card (ghost, thresholds, latest pointer for scroll). */
interface CardDragSession {
  taskId: string;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  active: boolean;
  ghost: HTMLElement | null;
  sourceEl: HTMLElement | null;
  /** Latest pointer position (viewport) — drives auto-scroll RAF and hit-testing after scroll. */
  lastClientX: number;
  lastClientY: number;
}

export function useKanbanPointerDrag({
  onDrop,
  getTaskColumn,
  boardScrollRef,
}: UseKanbanPointerDragOptions) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const drag = useRef<CardDragSession | null>(null);
  const autoScrollRafRef = useRef<number | null>(null);

  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;
  const getTaskColumnRef = useRef(getTaskColumn);
  getTaskColumnRef.current = getTaskColumn;
  const boardScrollRefStable = useRef(boardScrollRef);
  boardScrollRefStable.current = boardScrollRef;

  const cancelAutoScroll = useCallback(() => {
    if (autoScrollRafRef.current != null) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
  }, []);

  const findColumn = useCallback(
    (x: number, y: number, ghost: HTMLElement | null): string | null => {
      if (ghost) ghost.style.display = "none";
      const els = document.elementsFromPoint(x, y);
      if (ghost) ghost.style.display = "";
      for (const el of els) {
        const col = (el as HTMLElement).closest<HTMLElement>("[data-kanban-col]");
        const id = col?.dataset.kanbanCol;
        if (id) return id;
      }
      return null;
    },
    [],
  );

  const cleanup = useCallback(() => {
    cancelAutoScroll();
    const d = drag.current;
    if (d?.ghost) d.ghost.remove();
    drag.current = null;
    setDraggingId(null);
    setDragOverCol(null);
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
        const board = boardScrollRefStable.current?.current ?? null;
        const d = drag.current;
        if (!board || !d?.active) return;

        const inZone = stepKanbanBoardHorizontalAutoScrollFromPointer(board, d.lastClientX);

        const col = findColumn(d.lastClientX, d.lastClientY, d.ghost);
        const current = getTaskColumnRef.current(d.taskId);
        setDragOverCol(col && col !== current ? col : null);

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
      d.lastClientY = e.clientY;

      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;

      if (!d.active) {
        if (Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD_PX) return;
        d.active = true;
        setDraggingId(d.taskId);
        setKanbanDragActive(true);
        document.body.style.setProperty("user-select", "none");

        if (d.sourceEl) {
          const ghost = d.sourceEl.cloneNode(true) as HTMLElement;
          ghost.style.cssText = [
            "position:fixed",
            "z-index:9999",
            "pointer-events:none",
            `width:${d.sourceEl.offsetWidth}px`,
            "transform:rotate(3deg)",
            "opacity:0.92",
            "transition:none",
          ].join(";");
          const card = ghost.querySelector(".bg-white") as HTMLElement | null;
          if (card) {
            card.style.border = "2px solid #24B5F8";
            if (card.classList.contains("list-kanban-drag-surface")) {
              card.style.borderRadius = "8px";
            }
            card.style.boxShadow =
              "0px 20px 6px 0px rgba(26,59,84,0),0px 13px 5px 0px rgba(26,59,84,0.02),0px 7px 4px 0px rgba(26,59,84,0.04),0px 3px 3px 0px rgba(26,59,84,0.06),0px 1px 2px 0px rgba(26,59,84,0.08)";
          }
          document.body.appendChild(ghost);
          d.ghost = ghost;
        }
      }

      if (d.ghost) {
        d.ghost.style.left = `${e.clientX - d.offsetX}px`;
        d.ghost.style.top = `${e.clientY - d.offsetY}px`;
      }

      const col = findColumn(e.clientX, e.clientY, d.ghost);
      const current = getTaskColumnRef.current(d.taskId);
      setDragOverCol(col && col !== current ? col : null);

      const board = boardScrollRefStable.current?.current ?? null;
      if (d.active && board && isPointerInKanbanBoardHorizontalScrollZone(board, e.clientX)) {
        if (autoScrollRafRef.current == null) {
          scheduleAutoScroll();
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
        const col = findColumn(e.clientX, e.clientY, d.ghost);
        const current = getTaskColumnRef.current(d.taskId);
        if (col && col !== current) {
          onDropRef.current(d.taskId, col);
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
  }, [findColumn, cleanup, swallowNextClick, cancelAutoScroll]);

  const cardPointerDown = useCallback(
    (taskId: string) => (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      if (
        (e.target as HTMLElement).closest(
          "button, a, [role='button'], input, select, textarea",
        )
      )
        return;
      if (drag.current) return;

      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();

      drag.current = {
        taskId,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        active: false,
        ghost: null,
        sourceEl: el,
        lastClientX: e.clientX,
        lastClientY: e.clientY,
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

  return { draggingId, dragOverCol, cardPointerDown };
}
