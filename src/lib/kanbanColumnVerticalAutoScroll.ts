/**
 * Vertical edge auto-scroll for a Kanban column's task list (`overflow-y: auto`).
 * Mirrors {@link ./kanbanBoardHorizontalAutoScroll} so dragging a card toward the top/bottom of a
 * tall column scrolls that column — the vertical counterpart to the board's horizontal auto-scroll.
 */

/** Distance from the column viewport edge (px) where auto-scroll ramps in. */
export const KANBAN_COLUMN_VERTICAL_AUTO_SCROLL_EDGE_PX = 48;

/** Max vertical scroll delta per frame at full intensity (px). */
export const KANBAN_COLUMN_VERTICAL_AUTO_SCROLL_MAX_STEP_PX = 16;

/**
 * Whether the pointer sits in a vertical edge band where scrolling is possible
 * (pointer inside band and scroll position is not already at that limit).
 */
export function isPointerInKanbanColumnVerticalScrollZone(
  container: HTMLElement,
  pointerClientY: number,
): boolean {
  const r = container.getBoundingClientRect();
  const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
  if (maxScroll <= 0.5) return false;
  const edge = KANBAN_COLUMN_VERTICAL_AUTO_SCROLL_EDGE_PX;
  const inTop = pointerClientY < r.top + edge && container.scrollTop > 0.5;
  const inBottom = pointerClientY > r.bottom - edge && container.scrollTop < maxScroll - 0.5;
  return inTop || inBottom;
}

/**
 * Applies one frame of scroll toward the pointer when it is in a vertical edge band.
 *
 * @returns `true` while the pointer remains in an active scroll zone so callers
 *          can keep a `requestAnimationFrame` loop running.
 */
export function stepKanbanColumnVerticalAutoScrollFromPointer(
  container: HTMLElement,
  pointerClientY: number,
): boolean {
  const r = container.getBoundingClientRect();
  const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
  if (maxScroll <= 0.5) return false;
  const edge = KANBAN_COLUMN_VERTICAL_AUTO_SCROLL_EDGE_PX;
  const step = KANBAN_COLUMN_VERTICAL_AUTO_SCROLL_MAX_STEP_PX;
  let inZone = false;

  if (pointerClientY < r.top + edge && container.scrollTop > 0.5) {
    inZone = true;
    const t = Math.min(1, (r.top + edge - pointerClientY) / edge);
    container.scrollTop = Math.max(0, container.scrollTop - step * t);
  } else if (pointerClientY > r.bottom - edge && container.scrollTop < maxScroll - 0.5) {
    inZone = true;
    const t = Math.min(1, (pointerClientY - (r.bottom - edge)) / edge);
    container.scrollTop = Math.min(maxScroll, container.scrollTop + step * t);
  }

  return inZone;
}
