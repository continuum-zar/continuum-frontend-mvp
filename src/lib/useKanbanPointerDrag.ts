import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  isPointerInKanbanBoardHorizontalScrollZone,
  stepKanbanBoardHorizontalAutoScrollFromPointer,
} from "./kanbanBoardHorizontalAutoScroll";
import {
  isPointerInKanbanColumnVerticalScrollZone,
  stepKanbanColumnVerticalAutoScrollFromPointer,
} from "./kanbanColumnVerticalAutoScroll";
import { getKanbanCardInsertIndex } from "./kanbanCardReorder";
import { setKanbanDragActive } from "./kanbanCursor";

const DRAG_THRESHOLD_PX = 5;

export interface UseKanbanPointerDragOptions {
  /**
   * Called on drop. `columnId` is the target column; `beforeTaskId` is the id of the card the
   * dragged task should be inserted *before* (null = append to the end of the column). The same
   * column id as the source means a within-column reorder.
   */
  onDrop: (taskId: string, columnId: string, beforeTaskId: string | null) => void;
  getTaskColumn: (taskId: string) => string | null;
  /** Horizontal scroll container for the board row; enables edge auto-scroll while dragging a card. */
  boardScrollRef?: React.RefObject<HTMLDivElement | null>;
}

/** Resolved drop target under the pointer: column id plus the insertion slot within it. */
interface CardDropTarget {
  colId: string | null;
  /** Insertion index 0..n among the column's non-dragged cards. */
  index: number;
  /** Id of the card at `index` (the one we'd insert before), or null when appending at the end. */
  beforeId: string | null;
  /** The hovered column's vertical scroll container, for edge auto-scroll while dragging. */
  scroller: HTMLElement | null;
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
  /** Hovered column that differs from the source column (kept for cross-column drop affordances). */
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  /** Hovered column regardless of source — drives the within-column insertion line. */
  const [activeCol, setActiveCol] = useState<string | null>(null);
  /** Insertion index within {@link activeCol} (0..n), or null when not over a column. */
  const [dropIndex, setDropIndex] = useState<number | null>(null);

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

  /**
   * Hit-test the pointer to the column under it and the insertion slot within that column.
   * Cards carry `data-kanban-card="<taskId>"`; the dragged card is excluded from the measurement so
   * indices line up with the list rendered while dragging (which also hides the dragged card).
   */
  const findDropTarget = useCallback(
    (x: number, y: number, ghost: HTMLElement | null, draggedId: string): CardDropTarget => {
      if (ghost) ghost.style.display = "none";
      const els = document.elementsFromPoint(x, y);
      if (ghost) ghost.style.display = "";

      let colEl: HTMLElement | null = null;
      for (const el of els) {
        const c = (el as HTMLElement).closest<HTMLElement>("[data-kanban-col]");
        if (c) {
          colEl = c;
          break;
        }
      }
      if (!colEl) return { colId: null, index: 0, beforeId: null, scroller: null };

      const colId = colEl.dataset.kanbanCol ?? null;
      const cardEls = Array.from(
        colEl.querySelectorAll<HTMLElement>("[data-kanban-card]"),
      ).filter((el) => el.dataset.kanbanCard !== draggedId);
      const rects = cardEls.map((el) => el.getBoundingClientRect());
      const index = getKanbanCardInsertIndex(y, rects);
      const beforeId = cardEls[index]?.dataset.kanbanCard ?? null;
      const scroller = colEl.querySelector<HTMLElement>("[data-kanban-col-scroll]");
      return { colId, index, beforeId, scroller };
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
    setActiveCol(null);
    setDropIndex(null);
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
    const applyHover = (target: CardDropTarget, draggedId: string) => {
      const current = getTaskColumnRef.current(draggedId);
      setActiveCol(target.colId);
      setDropIndex(target.colId ? target.index : null);
      setDragOverCol(target.colId && target.colId !== current ? target.colId : null);
    };

    const scheduleAutoScroll = () => {
      if (autoScrollRafRef.current != null) return;
      const tick = () => {
        autoScrollRafRef.current = null;
        const d = drag.current;
        if (!d?.active) return;

        const target = findDropTarget(d.lastClientX, d.lastClientY, d.ghost, d.taskId);

        const board = boardScrollRefStable.current?.current ?? null;
        const horizInZone = board
          ? stepKanbanBoardHorizontalAutoScrollFromPointer(board, d.lastClientX)
          : false;
        const vertInZone = target.scroller
          ? stepKanbanColumnVerticalAutoScrollFromPointer(target.scroller, d.lastClientY)
          : false;

        applyHover(target, d.taskId);

        if (drag.current?.active && (horizInZone || vertInZone)) {
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

      const target = findDropTarget(e.clientX, e.clientY, d.ghost, d.taskId);
      applyHover(target, d.taskId);

      const board = boardScrollRefStable.current?.current ?? null;
      const inHorizZone =
        !!board && isPointerInKanbanBoardHorizontalScrollZone(board, e.clientX);
      const inVertZone =
        !!target.scroller &&
        isPointerInKanbanColumnVerticalScrollZone(target.scroller, e.clientY);
      if (d.active && (inHorizZone || inVertZone) && autoScrollRafRef.current == null) {
        scheduleAutoScroll();
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
        const target = findDropTarget(e.clientX, e.clientY, d.ghost, d.taskId);
        if (target.colId) {
          onDropRef.current(d.taskId, target.colId, target.beforeId);
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
  }, [findDropTarget, cleanup, swallowNextClick, cancelAutoScroll]);

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

  return { draggingId, dragOverCol, activeCol, dropIndex, cardPointerDown };
}
