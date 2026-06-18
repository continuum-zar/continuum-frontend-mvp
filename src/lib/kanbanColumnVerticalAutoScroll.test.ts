import { describe, expect, it } from "vitest";

import {
  isPointerInKanbanColumnVerticalScrollZone,
  stepKanbanColumnVerticalAutoScrollFromPointer,
  KANBAN_COLUMN_VERTICAL_AUTO_SCROLL_EDGE_PX as EDGE,
} from "./kanbanColumnVerticalAutoScroll";

/**
 * Minimal scroll-container stub: a 400px-tall viewport at y=[100,500] over 1000px of content.
 * jsdom does no layout, so we feed the geometry directly.
 */
function container(opts: { scrollTop?: number; scrollHeight?: number; clientHeight?: number }) {
  const clientHeight = opts.clientHeight ?? 400;
  const scrollHeight = opts.scrollHeight ?? 1000;
  const el = {
    scrollTop: opts.scrollTop ?? 0,
    scrollHeight,
    clientHeight,
    getBoundingClientRect: () => ({ top: 100, bottom: 100 + clientHeight }) as DOMRect,
  };
  return el as unknown as HTMLElement;
}

describe("kanbanColumnVerticalAutoScroll", () => {
  it("is not in zone when content does not overflow", () => {
    const el = container({ scrollHeight: 300, clientHeight: 400, scrollTop: 0 });
    expect(isPointerInKanbanColumnVerticalScrollZone(el, 110)).toBe(false);
  });

  it("detects the top band only when already scrolled down", () => {
    const atTop = container({ scrollTop: 0 });
    expect(isPointerInKanbanColumnVerticalScrollZone(atTop, 100 + EDGE - 5)).toBe(false);
    const scrolled = container({ scrollTop: 200 });
    expect(isPointerInKanbanColumnVerticalScrollZone(scrolled, 100 + EDGE - 5)).toBe(true);
  });

  it("detects the bottom band only when not yet at the end", () => {
    const middle = container({ scrollTop: 200 }); // maxScroll = 600
    expect(isPointerInKanbanColumnVerticalScrollZone(middle, 500 - (EDGE - 5))).toBe(true);
    const atEnd = container({ scrollTop: 600 });
    expect(isPointerInKanbanColumnVerticalScrollZone(atEnd, 500 - (EDGE - 5))).toBe(false);
  });

  it("scrolls up toward the top edge and clamps at 0", () => {
    const el = container({ scrollTop: 5 });
    const inZone = stepKanbanColumnVerticalAutoScrollFromPointer(el, 100); // at the very top edge
    expect(inZone).toBe(true);
    expect(el.scrollTop).toBe(0); // clamped, never negative
  });

  it("scrolls down toward the bottom edge without exceeding maxScroll", () => {
    const el = container({ scrollTop: 200 }); // maxScroll = 600
    const before = el.scrollTop;
    const inZone = stepKanbanColumnVerticalAutoScrollFromPointer(el, 500); // at the very bottom edge
    expect(inZone).toBe(true);
    expect(el.scrollTop).toBeGreaterThan(before);
    expect(el.scrollTop).toBeLessThanOrEqual(600);
  });
});
