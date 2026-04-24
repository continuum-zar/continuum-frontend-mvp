/**
 * Horizontal edge auto-scroll for Kanban board rows (`overflow-x: auto`).
 * Used by column reorder drag and task card drag so behavior stays consistent.
 */

/** Distance from the board viewport edge (px) where auto-scroll ramps in. */
export const KANBAN_BOARD_HORIZONTAL_AUTO_SCROLL_EDGE_PX = 56;

/** Max horizontal scroll delta per frame at full intensity (px). */
export const KANBAN_BOARD_HORIZONTAL_AUTO_SCROLL_MAX_STEP_PX = 18;

/**
 * Whether the pointer sits in a horizontal edge band where scrolling is possible
 * (pointer inside band and scroll position is not already at that limit).
 */
export function isPointerInKanbanBoardHorizontalScrollZone(
  board: HTMLDivElement,
  pointerClientX: number,
): boolean {
  const br = board.getBoundingClientRect();
  const maxScroll = Math.max(0, board.scrollWidth - board.clientWidth);
  const edge = KANBAN_BOARD_HORIZONTAL_AUTO_SCROLL_EDGE_PX;
  const inLeft = pointerClientX < br.left + edge && board.scrollLeft > 0.5;
  const inRight = pointerClientX > br.right - edge && board.scrollLeft < maxScroll - 0.5;
  return inLeft || inRight;
}

/**
 * Applies one frame of scroll toward the pointer when it is in an edge band.
 *
 * @returns `true` while the pointer remains in an active scroll zone so callers
 *          can keep a `requestAnimationFrame` loop running.
 */
export function stepKanbanBoardHorizontalAutoScrollFromPointer(
  board: HTMLDivElement,
  pointerClientX: number,
): boolean {
  const br = board.getBoundingClientRect();
  const maxScroll = Math.max(0, board.scrollWidth - board.clientWidth);
  const edge = KANBAN_BOARD_HORIZONTAL_AUTO_SCROLL_EDGE_PX;
  const step = KANBAN_BOARD_HORIZONTAL_AUTO_SCROLL_MAX_STEP_PX;
  let inZone = false;

  if (pointerClientX < br.left + edge && board.scrollLeft > 0.5) {
    inZone = true;
    const t = Math.min(1, (br.left + edge - pointerClientX) / edge);
    board.scrollLeft = Math.max(0, board.scrollLeft - step * t);
  } else if (pointerClientX > br.right - edge && board.scrollLeft < maxScroll - 0.5) {
    inZone = true;
    const t = Math.min(1, (pointerClientX - (br.right - edge)) / edge);
    board.scrollLeft = Math.min(maxScroll, board.scrollLeft + step * t);
  }

  return inZone;
}
