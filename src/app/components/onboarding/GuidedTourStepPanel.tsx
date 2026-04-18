import { forwardRef } from "react";
import type { CSSProperties } from "react";

import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";

export const GUIDED_TOUR_ARROW_SIZE_PX = 8;

type GuidedTourStepPanelProps = {
  title: string;
  children: React.ReactNode;
  stepLabel: string;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  canGoBack: boolean;
  isLast: boolean;
  /** Panel position (fixed); arrow points toward the highlighted element */
  style: CSSProperties;
  reduceMotion: boolean;
  /** below: arrow on top (points up). above: arrow on bottom (points down). left: arrow on right (points right). right: arrow on left (points left). */
  placement?: "below" | "above" | "left" | "right";
};

function TourCardBody({
  title,
  children,
  stepLabel,
  onBack,
  onNext,
  onSkip,
  canGoBack,
  isLast,
}: Omit<GuidedTourStepPanelProps, "style" | "reduceMotion" | "placement">) {
  return (
    <div className="rounded-[8px] bg-black px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
      <p id="guided-tour-title" className="mb-2 font-['Satoshi',sans-serif] text-[15px] font-semibold text-white">
        {title}
      </p>
      <div className="mb-4 text-white/95">{children}</div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
        <span className="font-['Satoshi',sans-serif] text-[11px] font-medium text-white/50">{stepLabel}</span>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-white/80 hover:bg-white/10 hover:text-white"
            onClick={onSkip}
          >
            Skip tour
          </Button>
          {canGoBack ? (
            <Button type="button" variant="outline" size="sm" className="h-8 border-white/25 bg-white/5 text-white hover:bg-white/10" onClick={onBack}>
              Back
            </Button>
          ) : null}
          <Button type="button" size="sm" className="h-8 bg-white text-[#0b191f] hover:bg-white/90" onClick={onNext}>
            {isLast ? "Done" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export const GuidedTourStepPanel = forwardRef<HTMLDivElement, GuidedTourStepPanelProps>(function GuidedTourStepPanel(
  {
    title,
    children,
    stepLabel,
    onBack,
    onNext,
    onSkip,
    canGoBack,
    isLast,
    style,
    reduceMotion,
    placement = "below",
  },
  ref,
) {
  const cardProps = { title, children, stepLabel, onBack, onNext, onSkip, canGoBack, isLast };

  if (placement === "left") {
    return (
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guided-tour-title"
        className={cn(
          "pointer-events-auto fixed z-[120] flex max-w-[min(100vw-1.5rem,calc(380px+10px))] flex-row items-center",
          !reduceMotion && "animate-in fade-in-0 zoom-in-95 duration-150",
        )}
        style={style}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="min-w-0 max-w-[min(100vw-1.5rem,380px)] flex-1">
          <TourCardBody {...cardProps} />
        </div>
        <div className="pointer-events-none flex shrink-0 flex-col justify-center py-1" aria-hidden>
          <div
            className="size-0 border-y-[8px] border-l-[8px] border-y-transparent border-l-black"
            style={{ filter: "drop-shadow(1px 0 0 rgba(255,255,255,0.06))" }}
          />
        </div>
      </div>
    );
  }

  if (placement === "right") {
    return (
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guided-tour-title"
        className={cn(
          "pointer-events-auto fixed z-[120] flex max-w-[min(100vw-1.5rem,calc(380px+10px))] flex-row items-center",
          !reduceMotion && "animate-in fade-in-0 zoom-in-95 duration-150",
        )}
        style={style}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none flex shrink-0 flex-col justify-center py-1" aria-hidden>
          <div
            className="size-0 border-y-[8px] border-r-[8px] border-y-transparent border-r-black"
            style={{ filter: "drop-shadow(-1px 0 0 rgba(255,255,255,0.06))" }}
          />
        </div>
        <div className="min-w-0 max-w-[min(100vw-1.5rem,380px)] flex-1">
          <TourCardBody {...cardProps} />
        </div>
      </div>
    );
  }

  const arrowAboveTarget = placement === "below";

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guided-tour-title"
      className={cn(
        "pointer-events-auto fixed z-[120] flex max-w-[min(100vw-1.5rem,380px)] flex-col",
        !reduceMotion && "animate-in fade-in-0 zoom-in-95 duration-150",
      )}
      style={style}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {arrowAboveTarget ? (
        <div
          className="pointer-events-none absolute left-1/2 z-[1] -translate-x-1/2"
          style={{ top: -GUIDED_TOUR_ARROW_SIZE_PX, width: GUIDED_TOUR_ARROW_SIZE_PX * 2, height: GUIDED_TOUR_ARROW_SIZE_PX }}
          aria-hidden
        >
          <div
            className="mx-auto size-0 border-x-[8px] border-b-[8px] border-x-transparent border-b-black"
            style={{ filter: "drop-shadow(0 -1px 0 rgba(255,255,255,0.06))" }}
          />
        </div>
      ) : null}
      <div className="flex min-w-0 flex-col">
        <TourCardBody {...cardProps} />
        {!arrowAboveTarget ? (
          <div
            className="pointer-events-none flex h-[8px] shrink-0 items-start justify-center"
            aria-hidden
          >
            <div
              className="size-0 border-x-[8px] border-t-[8px] border-x-transparent border-t-black"
              style={{ filter: "drop-shadow(0 1px 0 rgba(255,255,255,0.06))" }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
});
