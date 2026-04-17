import type { CustomCursorKind } from "./customCursorAssets";

export type ResolvedCustomCursor =
  | { mode: "custom"; kind: CustomCursorKind }
  | { mode: "native" };

const TEXT_INPUT_TYPES = new Set([
  "text",
  "search",
  "email",
  "url",
  "tel",
  "password",
  "number",
]);

let lastCacheKey = "";
let lastResult: ResolvedCustomCursor | undefined;

function cacheKey(clientX: number, clientY: number): string {
  const dragging = document.documentElement.hasAttribute("data-kanban-dragging") ? "1" : "0";
  return `${clientX},${clientY},${dragging}`;
}

function remember(clientX: number, clientY: number, r: ResolvedCustomCursor): ResolvedCustomCursor {
  lastCacheKey = cacheKey(clientX, clientY);
  lastResult = r;
  return r;
}

function overflowAxisScrollable(overflow: string): boolean {
  return overflow === "auto" || overflow === "scroll" || overflow === "overlay";
}

/** Classic (non-overlay) scrollbars reserve gutter space: use layout thickness vs client box. */
function isOverHorizontalScrollbar(el: HTMLElement, x: number, y: number): boolean {
  const style = getComputedStyle(el);
  if (!overflowAxisScrollable(style.overflowX)) return false;
  if (el.scrollWidth <= el.clientWidth + 1) return false;

  const thickness = el.offsetHeight - el.clientHeight;
  if (thickness < 2) return false;

  const rect = el.getBoundingClientRect();
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return false;
  const barTop = rect.bottom - thickness;
  return y >= barTop;
}

function isOverVerticalScrollbar(el: HTMLElement, x: number, y: number): boolean {
  const style = getComputedStyle(el);
  if (!overflowAxisScrollable(style.overflowY)) return false;
  if (el.scrollHeight <= el.clientHeight + 1) return false;

  const thickness = el.offsetWidth - el.clientWidth;
  if (thickness < 2) return false;

  const rect = el.getBoundingClientRect();
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return false;
  const barLeft = rect.right - thickness;
  return x >= barLeft;
}

/**
 * When the pointer is over a real OS scrollbar gutter, `elementsFromPoint` often hits content
 * underneath, so the custom overlay would still show and stack with the native scrollbar cursor.
 */
function isPointerOverNativeScrollbar(clientX: number, clientY: number, stack: Element[]): boolean {
  const seen = new Set<HTMLElement>();
  for (const raw of stack) {
    if (!(raw instanceof HTMLElement)) continue;
    let node: HTMLElement | null = raw;
    while (node) {
      if (!seen.has(node)) {
        seen.add(node);
        if (
          isOverHorizontalScrollbar(node, clientX, clientY) ||
          isOverVerticalScrollbar(node, clientX, clientY)
        ) {
          return true;
        }
      }
      node = node.parentElement;
    }
  }
  return false;
}

/**
 * Decide which cursor to show. Kanban drag (data-kanban-dragging) forces grabbing.
 * Text fields use the text SVG cursor; a few native-heavy cases use the real OS cursor.
 * Caches last hit-test; cache key includes coords + drag state so it invalidates when drag ends.
 */
export function resolveCustomCursor(clientX: number, clientY: number): ResolvedCustomCursor {
  if (typeof document === "undefined") {
    return { mode: "custom", kind: "default" };
  }

  const key = cacheKey(clientX, clientY);
  if (key === lastCacheKey && lastResult) {
    return lastResult;
  }

  if (document.documentElement.hasAttribute("data-kanban-dragging")) {
    return remember(clientX, clientY, { mode: "custom", kind: "grabbing" });
  }

  const stack = document.elementsFromPoint(clientX, clientY);
  if (isPointerOverNativeScrollbar(clientX, clientY, stack)) {
    return remember(clientX, clientY, { mode: "native" });
  }

  for (const el of stack) {
    if (!(el instanceof HTMLElement)) continue;
    if (el.hasAttribute("data-custom-cursor-overlay")) continue;

    if (el.matches("input")) {
      const it = el as HTMLInputElement;
      const t = it.type;
      if (t === "hidden") continue;
      if (t === "" || TEXT_INPUT_TYPES.has(t)) {
        return remember(clientX, clientY, { mode: "custom", kind: "textCursor" });
      }
      return remember(clientX, clientY, { mode: "native" });
    }
    if (el.matches("textarea")) {
      return remember(clientX, clientY, { mode: "custom", kind: "textCursor" });
    }
    if (el.matches("[contenteditable='true']")) {
      return remember(clientX, clientY, { mode: "custom", kind: "textCursor" });
    }
    if (el.matches("select")) {
      return remember(clientX, clientY, { mode: "native" });
    }
  }

  const top = stack.find(
    (e): e is HTMLElement =>
      e instanceof HTMLElement && !e.hasAttribute("data-custom-cursor-overlay"),
  );
  if (!top) {
    return remember(clientX, clientY, { mode: "custom", kind: "default" });
  }

  let node: Element | null = top;
  while (node) {
    if (!(node instanceof HTMLElement)) {
      node = node.parentElement;
      continue;
    }

    const cls = node.classList;

    if (
      cls.contains("cursor-not-allowed") ||
      cls.contains("cursor-wait") ||
      cls.contains("cursor-progress") ||
      cls.contains("cursor-help") ||
      cls.contains("cursor-w-resize") ||
      cls.contains("cursor-e-resize") ||
      cls.contains("cursor-n-resize") ||
      cls.contains("cursor-s-resize") ||
      cls.contains("cursor-ew-resize") ||
      cls.contains("cursor-ns-resize") ||
      cls.contains("cursor-col-resize") ||
      cls.contains("cursor-row-resize") ||
      cls.contains("cursor-move") ||
      cls.contains("cursor-zoom-in") ||
      cls.contains("cursor-zoom-out")
    ) {
      return remember(clientX, clientY, { mode: "native" });
    }

    if (cls.contains("cursor-open-hand") || cls.contains("cursor-grab")) {
      return remember(clientX, clientY, { mode: "custom", kind: "grab" });
    }
    if (cls.contains("cursor-grabbing")) {
      return remember(clientX, clientY, { mode: "custom", kind: "grabbing" });
    }
    if (cls.contains("cursor-pointer") || cls.contains("cursor-alias") || cls.contains("cursor-copy")) {
      return remember(clientX, clientY, { mode: "custom", kind: "pointer" });
    }
    if (cls.contains("cursor-text")) {
      return remember(clientX, clientY, { mode: "custom", kind: "textCursor" });
    }
    if (cls.contains("cursor-default")) {
      return remember(clientX, clientY, { mode: "custom", kind: "default" });
    }

    if (
      node.matches(
        'a[href], button:not(:disabled), [role="button"]:not([aria-disabled="true"]), label[for], summary',
      )
    ) {
      return remember(clientX, clientY, { mode: "custom", kind: "pointer" });
    }

    node = node.parentElement;
  }

  return remember(clientX, clientY, { mode: "custom", kind: "default" });
}
