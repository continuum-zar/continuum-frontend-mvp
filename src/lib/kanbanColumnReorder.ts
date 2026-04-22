/**
 * Midpoint-based insert **slot** for horizontal column reorder: `0..n` where `k` means
 * “before column k” and `n` means “after the last column” (so the right edge has a distinct target).
 */
export function getKanbanColumnInsertSlot(
  clientX: number,
  rects: ReadonlyArray<Pick<DOMRect, "left" | "right">>,
): number {
  const n = rects.length;
  if (n === 0) return 0;
  let slot = n;
  for (let i = 0; i < n; i++) {
    const mid = (rects[i].left + rects[i].right) / 2;
    if (clientX < mid) {
      slot = i;
      break;
    }
  }
  return slot;
}

/** Map insert slot (after {@link getKanbanColumnInsertSlot}) to `reorderKanbanColumns` `to` index. */
export function insertSlotToReorderIndex(from: number, insertSlot: number, n: number): number {
  if (n <= 0 || insertSlot < 0 || insertSlot > n) return from;
  if (insertSlot > from) return insertSlot - 1;
  return insertSlot;
}

export function reorderKanbanColumns<T>(columns: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= columns.length || to >= columns.length) {
    return [...columns];
  }
  const next = [...columns];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
