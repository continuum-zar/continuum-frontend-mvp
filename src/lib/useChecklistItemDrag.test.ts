import { describe, expect, it } from "vitest";

import { reorderChecklistItems } from "./useChecklistItemDrag";

describe("reorderChecklistItems", () => {
  it("moves an item forward", () => {
    expect(reorderChecklistItems(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
  });

  it("moves an item backward", () => {
    expect(reorderChecklistItems(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });

  it("returns a copy when from === to (idempotent)", () => {
    const arr = ["a", "b", "c"];
    const next = reorderChecklistItems(arr, 1, 1);
    expect(next).toEqual(arr);
    expect(next).not.toBe(arr);
  });

  it("returns a copy when indices are out of range", () => {
    const arr = ["a", "b", "c"];
    expect(reorderChecklistItems(arr, -1, 1)).toEqual(arr);
    expect(reorderChecklistItems(arr, 1, 5)).toEqual(arr);
    expect(reorderChecklistItems([], 0, 0)).toEqual([]);
  });
});
