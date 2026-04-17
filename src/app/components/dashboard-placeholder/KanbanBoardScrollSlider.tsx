"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";

/** Same knob asset used by the task-card checklist progress slider — keeps visual parity. */
const imgFrame308 = mcpAsset("5b22b8e9-bd31-437e-a559-232247be56a0");

type Props = {
  /** Scroll container whose horizontal position this slider controls. */
  scrollRef: RefObject<HTMLDivElement | null>;
  className?: string;
};

/**
 * Horizontal scroll slider for the Kanban board.
 * Hides itself when there is no horizontal overflow, mirrors the board's scroll position,
 * and writes `scrollLeft` on pointer/keyboard interaction.
 */
export function KanbanBoardScrollSlider({ scrollRef, className }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const innerTrackRef = useRef<HTMLDivElement | null>(null);

  const [fraction, setFraction] = useState(0);
  const [overflows, setOverflows] = useState(false);

  const readScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 1) {
      setOverflows(false);
      setFraction(0);
      return;
    }
    setOverflows(true);
    setFraction(Math.max(0, Math.min(1, el.scrollLeft / max)));
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    readScroll();

    const onScroll = () => readScroll();
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(readScroll);
    ro.observe(el);

    const mo = new MutationObserver(readScroll);
    mo.observe(el, { childList: true, subtree: true });

    window.addEventListener("resize", readScroll);

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", readScroll);
    };
  }, [readScroll, scrollRef]);

  const applyFractionToScroll = useCallback(
    (f: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      const clamped = Math.max(0, Math.min(1, f));
      el.scrollLeft = clamped * max;
    },
    [scrollRef],
  );

  const fractionFromClientX = useCallback((clientX: number) => {
    const inner = innerTrackRef.current;
    if (!inner) return 0;
    const rect = inner.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    return (clientX - rect.left) / rect.width;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const target = e.currentTarget;
      applyFractionToScroll(fractionFromClientX(e.clientX));
      target.setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        applyFractionToScroll(fractionFromClientX(ev.clientX));
      };
      const onUp = (ev: PointerEvent) => {
        if (target.hasPointerCapture?.(ev.pointerId)) {
          target.releasePointerCapture(ev.pointerId);
        }
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [applyFractionToScroll, fractionFromClientX],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const step = 0.1;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        applyFractionToScroll(fraction - step);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        applyFractionToScroll(fraction + step);
      } else if (e.key === "Home") {
        e.preventDefault();
        applyFractionToScroll(0);
      } else if (e.key === "End") {
        e.preventDefault();
        applyFractionToScroll(1);
      }
    },
    [applyFractionToScroll, fraction],
  );

  const pct = Math.round(fraction * 100);
  const disabled = !overflows;

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label="Scroll board horizontally"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onPointerDown={disabled ? undefined : onPointerDown}
      onKeyDown={disabled ? undefined : onKeyDown}
      className={`relative w-full select-none py-[6px] outline-none focus-visible:ring-2 focus-visible:ring-[#24b5f8]/40 ${
        disabled ? "cursor-default opacity-40" : "cursor-pointer"
      } ${className ?? ""}`}
    >
      <div
        ref={innerTrackRef}
        className="relative mx-[6px] h-2 overflow-hidden rounded-[4px] bg-[#e4e8eb]"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-[4px] bg-[#0b191f]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div
        className="pointer-events-none absolute top-1/2 z-[1] size-[12px] -translate-x-1/2 -translate-y-1/2"
        style={{ left: `calc(6px + (100% - 12px) * ${fraction})` }}
        aria-hidden
      >
        <div className="absolute inset-[-33.33%]">
          <img alt="" className="block max-w-none size-full" src={imgFrame308} />
        </div>
      </div>
    </div>
  );
}
