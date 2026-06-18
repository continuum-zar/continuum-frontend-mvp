import { describe, expect, it } from "vitest";

import { getKanbanCardInsertIndex } from "./kanbanCardReorder";

/** Build a vertical stack of 50px-tall card rects starting at y=0. */
function stack(count: number): Array<Pick<DOMRect, "top" | "bottom">> {
  return Array.from({ length: count }, (_, i) => ({ top: i * 50, bottom: i * 50 + 50 }));
}

describe("getKanbanCardInsertIndex", () => {
  it("returns 0 for an empty column", () => {
    expect(getKanbanCardInsertIndex(123, [])).toBe(0);
  });

  it("inserts before a card when above its midpoint", () => {
    const rects = stack(3); // mids at 25, 75, 125
    expect(getKanbanCardInsertIndex(10, rects)).toBe(0);
    expect(getKanbanCardInsertIndex(40, rects)).toBe(1);
    expect(getKanbanCardInsertIndex(90, rects)).toBe(2);
  });

  it("appends past the last card's midpoint", () => {
    const rects = stack(2); // mids at 25, 75
    expect(getKanbanCardInsertIndex(80, rects)).toBe(2);
    expect(getKanbanCardInsertIndex(1000, rects)).toBe(2);
  });
});
