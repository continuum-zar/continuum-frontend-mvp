/**
 * Midpoint-based insert **index** for vertical card reorder within a column: `0..n` where `k`
 * means "before card k" and `n` means "after the last card". Mirrors the horizontal column
 * version in {@link ./kanbanColumnReorder} but compares the pointer Y against card midpoints.
 */
export function getKanbanCardInsertIndex(
  clientY: number,
  rects: ReadonlyArray<Pick<DOMRect, "top" | "bottom">>,
): number {
  const n = rects.length;
  if (n === 0) return 0;
  let index = n;
  for (let i = 0; i < n; i++) {
    const mid = (rects[i].top + rects[i].bottom) / 2;
    if (clientY < mid) {
      index = i;
      break;
    }
  }
  return index;
}
