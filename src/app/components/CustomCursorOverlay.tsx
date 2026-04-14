"use client";

import { useEffect, useRef, useState } from "react";
import {
  CURSOR_ASSET_INTRINSIC_PX,
  CURSOR_HOTSPOTS,
  CURSOR_OVERLAY_DISPLAY_PX,
  type CustomCursorKind,
  cursorAssetUrl,
} from "@/lib/customCursorAssets";
import { resolveCustomCursor, type ResolvedCustomCursor } from "@/lib/resolveCustomCursor";

let srcCache: Record<CustomCursorKind, string> | null = null;

function getSrc(kind: CustomCursorKind): string {
  if (!srcCache) {
    srcCache = {
      default: cursorAssetUrl("default"),
      pointer: cursorAssetUrl("pointer"),
      grab: cursorAssetUrl("grab"),
      grabbing: cursorAssetUrl("grabbing"),
      textCursor: cursorAssetUrl("textCursor"),
    };
  }
  return srcCache[kind];
}

function applyTransform(el: HTMLElement, clientX: number, clientY: number, kind: CustomCursorKind) {
  const scale = CURSOR_OVERLAY_DISPLAY_PX / CURSOR_ASSET_INTRINSIC_PX;
  const { x: hx56, y: hy56 } = CURSOR_HOTSPOTS[kind];
  const hx = hx56 * scale;
  const hy = hy56 * scale;
  el.style.transform = `translate3d(${clientX - hx}px, ${clientY - hy}px, 0)`;
}

/**
 * Renders SVG cursors in a fixed layer. Position updates are imperative (no per-frame React state)
 * to avoid jank; React only re-renders when visibility or cursor image changes.
 */
export function CustomCursorOverlay() {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [engineOn, setEngineOn] = useState(false);
  const [active, setActive] = useState(false);
  const [kind, setKind] = useState<CustomCursorKind>("default");

  const activeRef = useRef(false);
  const kindRef = useRef<CustomCursorKind>("default");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    getSrc("default");
    setEngineOn(true);

    const setActiveState = (next: boolean) => {
      if (activeRef.current === next) return;
      activeRef.current = next;
      setActive(next);
    };

    const setKindState = (next: CustomCursorKind) => {
      if (kindRef.current === next) return;
      kindRef.current = next;
      setKind(next);
    };

    const apply = (clientX: number, clientY: number) => {
      let resolved: ResolvedCustomCursor;
      try {
        resolved = resolveCustomCursor(clientX, clientY);
      } catch {
        document.documentElement.removeAttribute("data-custom-cursor-active");
        setActiveState(false);
        return;
      }

      const el = imgRef.current;

      if (resolved.mode === "custom") {
        const k = resolved.kind;
        setKindState(k);
        document.documentElement.setAttribute("data-custom-cursor-active", "");
        setActiveState(true);
        if (el) {
          applyTransform(el, clientX, clientY, k);
        } else {
          requestAnimationFrame(() => {
            const img = imgRef.current;
            if (img) applyTransform(img, clientX, clientY, k);
          });
        }
      } else {
        document.documentElement.removeAttribute("data-custom-cursor-active");
        setActiveState(false);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        document.documentElement.removeAttribute("data-custom-cursor-active");
        setActiveState(false);
        return;
      }
      apply(e.clientX, e.clientY);
    };

    const onLeave = () => {
      document.documentElement.removeAttribute("data-custom-cursor-active");
      setActiveState(false);
    };

    window.addEventListener("pointermove", onPointerMove, { capture: true, passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onPointerMove, { capture: true });
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeAttribute("data-custom-cursor-active");
    };
  }, []);

  if (!engineOn) {
    return null;
  }

  return (
    <img
      ref={imgRef}
      data-custom-cursor-overlay
      src={getSrc(kind)}
      alt=""
      width={CURSOR_OVERLAY_DISPLAY_PX}
      height={CURSOR_OVERLAY_DISPLAY_PX}
      draggable={false}
      className="pointer-events-none fixed left-0 top-0 z-[2147483647] select-none will-change-transform"
      style={{
        opacity: active ? 1 : 0,
        visibility: active ? "visible" : "hidden",
      }}
      aria-hidden
    />
  );
}
