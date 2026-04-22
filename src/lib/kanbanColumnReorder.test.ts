import { describe, expect, it } from "vitest";
import {
  getKanbanColumnInsertSlot,
  insertSlotToReorderIndex,
  reorderKanbanColumns,
} from "./kanbanColumnReorder";

function rect(left: number, width: number): Pick<DOMRect, "left" | "right"> {
  return { left, right: left + width };
}

describe("getKanbanColumnInsertSlot", () => {
  it("returns 0 when pointer is left of first midpoint", () => {
    const rects = [rect(0, 100), rect(100, 100), rect(200, 100)];
    expect(getKanbanColumnInsertSlot(40, rects)).toBe(0);
  });

  it("returns n when pointer is right of all midpoints (after last column)", () => {
    const rects = [rect(0, 100), rect(100, 100), rect(200, 100)];
    expect(getKanbanColumnInsertSlot(280, rects)).toBe(3);
  });

  it("returns 1 when pointer is between first and second midpoints", () => {
    const rects = [rect(0, 100), rect(100, 100), rect(200, 100)];
    expect(getKanbanColumnInsertSlot(120, rects)).toBe(1);
  });

  it("handles empty rects", () => {
    expect(getKanbanColumnInsertSlot(0, [])).toBe(0);
  });
});

describe("insertSlotToReorderIndex", () => {
  it("maps after-last slot to end index", () => {
    expect(insertSlotToReorderIndex(0, 3, 3)).toBe(2);
  });

  it("maps before-first slot for last column", () => {
    expect(insertSlotToReorderIndex(2, 0, 3)).toBe(0);
  });
});

describe("reorderKanbanColumns", () => {
  it("moves first to last", () => {
    expect(reorderKanbanColumns(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
  });

  it("moves last to first", () => {
    expect(reorderKanbanColumns(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  it("is a no-op when from equals to", () => {
    const cols = ["a", "b", "c"];
    expect(reorderKanbanColumns(cols, 1, 1)).toEqual(cols);
  });

  it("returns a copy when indices are out of range", () => {
    expect(reorderKanbanColumns(["a", "b"], -1, 1)).toEqual(["a", "b"]);
    expect(reorderKanbanColumns(["a", "b"], 0, 5)).toEqual(["a", "b"]);
  });
});

describe("insert slot round-trip", () => {
  it("matches reorder for drag to end", () => {
    const cols = ["a", "b", "c"];
    const from = 0;
    const slot = 3;
    const to = insertSlotToReorderIndex(from, slot, cols.length);
    expect(reorderKanbanColumns(cols, from, to)).toEqual(["b", "c", "a"]);
  });
});
