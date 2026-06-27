"use client";

import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";

const imgGaugeIndicator = mcpAsset("526dd3fc-a323-411f-a999-20f981098020");

/* ================================================================
   Shared arc helpers — pure CSS conic-gradient arcs, no SVG
   ================================================================ */

const BG_GREY = "var(--border)";

function Cap({
  cx,
  cy,
  size,
  color,
}: {
  cx: number;
  cy: number;
  size: number;
  color: string;
}) {
  // Match the arc's solid band: the ring mask fades the outer 0.5px on each
  // edge, so a cap rendered at the full stroke width bulges past the arc.
  const visible = size - 1;
  return (
    <div
      className="pointer-events-none absolute rounded-full"
      style={{
        width: visible,
        height: visible,
        backgroundColor: color,
        left: cx - visible / 2,
        top: cy - visible / 2,
      }}
    />
  );
}

/** Point on a semicircle arc at a given fraction (0 = left, 1 = right) — hero gauge only */
function heroArcPoint(
  centerX: number,
  centerY: number,
  R: number,
  frac: number,
): { x: number; y: number } {
  const angle = Math.PI * (1 - frac);
  return {
    x: centerX + R * Math.cos(angle),
    y: centerY - R * Math.sin(angle),
  };
}

/* ================================================================
   Hero Gauge — large score arc (180° semicircle)
   ================================================================ */

function scoreLabel(score: number): string {
  if (score >= 70) return "Project on track";
  if (score >= 40) return "Needs attention";
  return "At risk";
}

function scoreColor(score: number): string {
  if (score >= 70) return "var(--success)";
  if (score >= 40) return "var(--warning)";
  return "var(--destructive)";
}

const HERO_R = 148;
const HERO_STROKE = 20;
const HERO_OUTER = HERO_R + HERO_STROKE / 2;
const HERO_INNER = HERO_R - HERO_STROKE / 2;
const HERO_DIAM = HERO_OUTER * 2;

export function LiveHeroGauge({ score }: { score: number }) {
  const displayScore = Math.round(Math.max(0, Math.min(100, score)));
  const label = scoreLabel(score);
  const color = scoreColor(score);
  const fillDeg = (displayScore / 100) * 180;

  const W = 350.302;
  const H = 175.151;
  const cx = W / 2;
  const cy = H;
  const circleLeft = (W - HERO_DIAM) / 2;
  const circleTop = H - HERO_OUTER;

  const ring = `radial-gradient(circle at 50% 50%, transparent ${HERO_INNER}px, black ${HERO_INNER + 0.5}px, black ${HERO_OUTER - 0.5}px, transparent ${HERO_OUTER}px)`;
  const bgGrad = `conic-gradient(from 270deg at 50% 50%, ${BG_GREY} 0deg 180deg, transparent 180deg 360deg)`;
  const fillGrad = `conic-gradient(from 270deg at 50% 50%, ${color} 0deg ${fillDeg}deg, transparent ${fillDeg}deg 360deg)`;

  const start = heroArcPoint(cx, cy, HERO_R, 0);
  const end = heroArcPoint(cx, cy, HERO_R, 1);
  const tip = heroArcPoint(cx, cy, HERO_R, displayScore / 100);

  return (
    <div className="relative h-[191px] w-full max-w-[815px] shrink-0">
      <div className="absolute top-0 left-1/2 h-[175.151px] w-[350.302px] -translate-x-1/2">
        <div className="absolute inset-0">
          <div
            style={{
              position: "absolute",
              width: HERO_DIAM,
              height: HERO_DIAM,
              left: circleLeft,
              top: circleTop,
              borderRadius: "50%",
              background: bgGrad,
              WebkitMaskImage: ring,
              maskImage: ring,
              clipPath: "inset(0 0 50% 0)",
            }}
          />
          {displayScore > 0 && (
            <div
              style={{
                position: "absolute",
                width: HERO_DIAM,
                height: HERO_DIAM,
                left: circleLeft,
                top: circleTop,
                borderRadius: "50%",
                background: fillGrad,
                WebkitMaskImage: ring,
                maskImage: ring,
                clipPath: "inset(0 0 50% 0)",
              }}
            />
          )}
          <Cap cx={start.x} cy={start.y} size={HERO_STROKE} color={displayScore > 0 ? color : BG_GREY} />
          <Cap cx={end.x} cy={end.y} size={HERO_STROKE} color={BG_GREY} />
          {displayScore > 0 && displayScore < 100 && (
            <Cap cx={tip.x} cy={tip.y} size={HERO_STROKE} color={color} />
          )}
        </div>
      </div>
      <p className="pointer-events-none absolute top-[49px] left-1/2 z-[1] -translate-x-1/2 font-['Satoshi',sans-serif] text-[70.704px] font-normal leading-normal text-foreground">
        {displayScore}
      </p>
      <p className="pointer-events-none absolute top-[159px] left-1/2 z-[1] -translate-x-1/2 whitespace-nowrap font-['Satoshi',sans-serif] text-[24px] font-medium leading-normal text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

/* ================================================================
   Small gauge arc configuration — horseshoe shape matching Figma
   250° sweep (the endpoints curve inward at the bottom).
   Figma commits segments use a 90px circle offset by -4px,
   confirming the 90px diameter.
   ================================================================ */

const SM_SWEEP = 250;
const SM_HALF_GAP = (360 - SM_SWEEP) / 2; // 55°
const SM_CSS_START = 180 + SM_HALF_GAP; // 235° — bottom-left start

const SM_R = 40;
const SM_STROKE = 10;
const SM_OUTER = SM_R + SM_STROKE / 2; // 45
const SM_INNER = SM_R - SM_STROKE / 2; // 35
const SM_DIAM = SM_OUTER * 2; // 90

const SM_W = 82.864;
const SM_CX = SM_W / 2; // 41.432
const SM_CY = SM_OUTER; // 45 — circle center y (circle top at y=0)

const SM_CIRCLE_LEFT = (SM_W - SM_DIAM) / 2; // -3.568 (overflows like Figma's inset)

const SM_RING = `radial-gradient(circle at 50% 50%, transparent ${SM_INNER}px, black ${SM_INNER + 0.5}px, black ${SM_OUTER - 0.5}px, transparent ${SM_OUTER}px)`;

const _EP_Y = SM_OUTER + SM_R * Math.cos((SM_HALF_GAP * Math.PI) / 180);
const SM_CLIP = `inset(0 0 ${(((SM_DIAM - _EP_Y - SM_STROKE / 2) / SM_DIAM) * 100).toFixed(1)}% 0)`;

const smCircleBase: React.CSSProperties = {
  position: "absolute",
  width: SM_DIAM,
  height: SM_DIAM,
  left: SM_CIRCLE_LEFT,
  top: 0,
  borderRadius: "50%",
  WebkitMaskImage: SM_RING,
  maskImage: SM_RING,
  clipPath: SM_CLIP,
};

/**
 * Point on the small gauge arc at fraction frac (0 = start/left, 1 = end/right).
 * Uses CSS angle convention: 0° = top, clockwise.
 */
function smArcPoint(frac: number): { x: number; y: number } {
  const rad = ((SM_CSS_START + frac * SM_SWEEP) * Math.PI) / 180;
  return {
    x: SM_CX + SM_R * Math.sin(rad),
    y: SM_CY - SM_R * Math.cos(rad),
  };
}

/* ================================================================
   Efficiency Rate gauge
   ================================================================ */

function efficiencyZoneLabel(hps: number): string {
  if (hps < 1) return "Safe Zone";
  if (hps < 2) return "Caution Zone";
  return "Danger Zone";
}

export function EfficiencyGauge({ hps }: { hps: number }) {
  const effGrad = `conic-gradient(from ${SM_CSS_START}deg at 50% 50%, var(--success) 0deg, var(--warning) ${SM_SWEEP / 2}deg, var(--destructive) ${SM_SWEEP}deg, transparent ${SM_SWEEP}deg 360deg)`;
  const frac = Math.max(0, Math.min(1, hps / 3));
  const dot = smArcPoint(frac);
  const startPt = smArcPoint(0);
  const endPt = smArcPoint(1);

  return (
    <div className="relative h-[90px] w-[82.864px] shrink-0">
      <div className="absolute top-0 left-0 h-[66.484px] w-[82.864px]">
        <div style={{ ...smCircleBase, background: effGrad }} />
        <Cap cx={startPt.x} cy={startPt.y} size={SM_STROKE} color="var(--success)" />
        <Cap cx={endPt.x} cy={endPt.y} size={SM_STROKE} color="var(--destructive)" />
      </div>
      <p className="absolute top-[28px] left-1/2 z-[1] -translate-x-1/2 overflow-hidden text-center font-['Satoshi',sans-serif] text-[24px] font-medium leading-[normal] whitespace-nowrap text-foreground text-ellipsis">
        {Number(hps.toFixed(2))}
      </p>
      <div
        className="absolute z-[2] size-[8.672px]"
        style={{ left: dot.x - 4.336, top: dot.y - 4.336 }}
      >
        <div className="absolute inset-[-44.44%]">
          <img alt="" className="block size-full max-w-none" src={imgGaugeIndicator} />
        </div>
      </div>
      <div className="pointer-events-none absolute top-[74px] left-[11.86px] right-[13px] z-[1] flex justify-between font-['Satoshi',sans-serif] text-[12px] font-medium leading-[normal] text-foreground opacity-50">
        <span>0</span>
        <span>3</span>
      </div>
    </div>
  );
}

/* ================================================================
   Tasks Completed gauge
   ================================================================ */

export function TasksGauge({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (completed / total) * 100)) : 0;
  const fillDeg = (pct / 100) * SM_SWEEP;
  const fillColor = "var(--success)";

  const bgGrad = `conic-gradient(from ${SM_CSS_START}deg at 50% 50%, ${BG_GREY} 0deg ${SM_SWEEP}deg, transparent ${SM_SWEEP}deg 360deg)`;
  const fGrad = `conic-gradient(from ${SM_CSS_START}deg at 50% 50%, ${fillColor} 0deg ${fillDeg}deg, transparent ${fillDeg}deg 360deg)`;

  const startPt = smArcPoint(0);
  const endPt = smArcPoint(1);
  const tipPt = smArcPoint(pct / 100);

  return (
    <div className="relative h-[81.592px] w-[82.864px] shrink-0">
      <div className="absolute top-0 left-0 h-[66.484px] w-[82.864px]">
        <div style={{ ...smCircleBase, background: bgGrad }} />
        {pct > 0 && <div style={{ ...smCircleBase, background: fGrad }} />}
        <Cap cx={startPt.x} cy={startPt.y} size={SM_STROKE} color={pct > 0 ? fillColor : BG_GREY} />
        <Cap cx={endPt.x} cy={endPt.y} size={SM_STROKE} color={BG_GREY} />
        {pct > 0 && pct < 100 && <Cap cx={tipPt.x} cy={tipPt.y} size={SM_STROKE} color={fillColor} />}
      </div>
      <p className="absolute top-[28px] left-[calc(50%+0.07px)] z-[1] -translate-x-1/2 overflow-hidden text-center font-['Satoshi',sans-serif] text-[24px] font-medium leading-[normal] whitespace-nowrap text-foreground text-ellipsis">
        {Math.round(completed)}
      </p>
      <div
        className="absolute z-[2] size-[8.672px]"
        style={{ left: tipPt.x - 4.336, top: tipPt.y - 4.336 }}
      >
        <div className="absolute inset-[-44.44%]">
          <img alt="" className="block size-full max-w-none" src={imgGaugeIndicator} />
        </div>
      </div>
    </div>
  );
}

/** Horseshoe arc confidence gauge (same geometry as {@link TasksGauge}) — fill tracks 0–100%. */
export function PlannerConfidenceGauge({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const fillDeg = (pct / 100) * SM_SWEEP;
  const fillColor =
    pct >= 70 ? "var(--success)" : pct >= 40 ? "var(--warning)" : pct > 0 ? "var(--info)" : BG_GREY;

  const bgGrad = `conic-gradient(from ${SM_CSS_START}deg at 50% 50%, ${BG_GREY} 0deg ${SM_SWEEP}deg, transparent ${SM_SWEEP}deg 360deg)`;
  const fGrad = `conic-gradient(from ${SM_CSS_START}deg at 50% 50%, ${fillColor} 0deg ${fillDeg}deg, transparent ${fillDeg}deg 360deg)`;

  const startPt = smArcPoint(0);
  const endPt = smArcPoint(1);
  const tipPt = smArcPoint(pct / 100);

  return (
    <div className="relative h-[81.592px] w-[82.864px] shrink-0">
      <div className="absolute top-0 left-0 h-[66.484px] w-[82.864px]">
        <div style={{ ...smCircleBase, background: bgGrad }} />
        {pct > 0 && <div style={{ ...smCircleBase, background: fGrad }} />}
        <Cap
          cx={startPt.x}
          cy={startPt.y}
          size={SM_STROKE}
          color={pct > 0 ? fillColor : BG_GREY}
        />
        <Cap cx={endPt.x} cy={endPt.y} size={SM_STROKE} color={BG_GREY} />
        {pct > 0 && pct < 100 && (
          <Cap cx={tipPt.x} cy={tipPt.y} size={SM_STROKE} color={fillColor} />
        )}
      </div>
      <p className="absolute top-[18px] left-[calc(50%+0.07px)] z-[1] -translate-x-1/2 overflow-hidden text-center font-['Satoshi',sans-serif] text-[26px] font-medium leading-[normal] whitespace-nowrap text-foreground text-ellipsis">
        {Math.round(pct)}%
      </p>
      {pct > 0 && pct < 100 && (
        <div
          className="absolute z-[2] size-[8.672px]"
          style={{ left: tipPt.x - 4.336, top: tipPt.y - 4.336 }}
        >
          <div className="absolute inset-[-44.44%]">
            <img alt="" className="block size-full max-w-none" src={imgGaugeIndicator} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   Commits gauge — segmented arc
   ================================================================ */

/** Segments in {@link CommitsGauge} — reuse for commit-type pills (e.g. recent activity). */
export const COMMIT_GAUGE_SHIPPED = "var(--success)";
export const COMMIT_GAUGE_IN_PROGRESS = "var(--warning)";
export const COMMIT_GAUGE_TRIVIAL = "var(--muted-foreground)";

const COMMIT_GREEN = COMMIT_GAUGE_SHIPPED;
const COMMIT_YELLOW = COMMIT_GAUGE_IN_PROGRESS;
const COMMIT_GREY = COMMIT_GAUGE_TRIVIAL;

export function CommitsGauge({
  structural,
  incremental,
  trivial,
}: {
  structural: number;
  incremental: number;
  trivial: number;
}) {
  const total = structural + incremental + trivial;

  const bgGrad = `conic-gradient(from ${SM_CSS_START}deg at 50% 50%, ${BG_GREY} 0deg ${SM_SWEEP}deg, transparent ${SM_SWEEP}deg 360deg)`;

  const segments = [
    { count: structural, color: COMMIT_GREEN },
    { count: incremental, color: COMMIT_YELLOW },
    { count: trivial, color: COMMIT_GREY },
  ];

  const GAP_DEG = 3;
  const nonZero = segments.filter((s) => s.count > 0);
  const totalGapDeg = nonZero.length > 1 ? GAP_DEG * nonZero.length : 0;
  const usableDeg = SM_SWEEP - totalGapDeg;

  let cumDeg = 0;
  const arcs = nonZero.map((s) => {
    const sweep = (s.count / total) * usableDeg;
    const startDeg = cumDeg;
    cumDeg += sweep + (nonZero.length > 1 ? GAP_DEG : 0);
    return { startDeg, sweep, color: s.color };
  });

  const startPt = smArcPoint(0);
  const endPt = smArcPoint(1);

  return (
    <div className="relative h-[81.592px] w-[82.864px] shrink-0">
      <div className="absolute top-0 left-0 h-[66.484px] w-[82.864px]">
        <div style={{ ...smCircleBase, background: bgGrad }} />
        {total > 0 &&
          arcs.map((a) => {
            const grad = `conic-gradient(from ${SM_CSS_START + a.startDeg}deg at 50% 50%, ${a.color} 0deg ${a.sweep}deg, transparent ${a.sweep}deg 360deg)`;
            const startFrac = a.startDeg / SM_SWEEP;
            const endFrac = (a.startDeg + a.sweep) / SM_SWEEP;
            const s = smArcPoint(startFrac);
            const e = smArcPoint(endFrac);
            return (
              <div key={a.color}>
                <div style={{ ...smCircleBase, background: grad }} />
                <Cap cx={s.x} cy={s.y} size={SM_STROKE} color={a.color} />
                <Cap cx={e.x} cy={e.y} size={SM_STROKE} color={a.color} />
              </div>
            );
          })}
        {total <= 0 && (
          <>
            <Cap cx={startPt.x} cy={startPt.y} size={SM_STROKE} color={BG_GREY} />
            <Cap cx={endPt.x} cy={endPt.y} size={SM_STROKE} color={BG_GREY} />
          </>
        )}
      </div>
      <p className="absolute top-[28px] left-[calc(50%+0.07px)] z-[1] -translate-x-1/2 overflow-hidden text-center font-['Satoshi',sans-serif] text-[24px] font-medium leading-[normal] whitespace-nowrap text-foreground text-ellipsis">
        {total}
      </p>
    </div>
  );
}

/* ================================================================
   Live Metrics Row — combines all three small gauges
   ================================================================ */

export type LiveMetricsRowProps = {
  hpsRatio: number;
  completedWeight: number;
  totalWeight: number;
  trivialCommits: number;
  incrementalCommits: number;
  structuralCommits: number;
};

export function LiveMetricsRow({
  hpsRatio,
  completedWeight,
  totalWeight,
  trivialCommits,
  incrementalCommits,
  structuralCommits,
}: LiveMetricsRowProps) {
  const effLabel = efficiencyZoneLabel(hpsRatio);

  return (
    <div
      className="relative mx-auto flex w-full max-w-[815px] shrink-0 flex-wrap items-center justify-center gap-x-8 gap-y-6 rounded-[12px] bg-card sm:gap-x-10"
      data-name="Live metrics"
    >
      {/* Efficiency Rate */}
      <div className="relative flex shrink-0 items-center gap-6">
        <EfficiencyGauge hps={hpsRatio} />
        <div className="flex w-[122px] shrink-0 flex-col items-start gap-1">
          <p className="w-[122px] font-['Satoshi',sans-serif] text-[16px] font-medium leading-[normal] text-foreground">
            Efficiency Rate
          </p>
          <p className="font-['Satoshi',sans-serif] text-[14px] font-medium leading-[normal] tracking-[-0.14px] text-muted-foreground">
            {effLabel}
          </p>
        </div>
      </div>

      {/* Tasks Completed */}
      <div className="relative flex shrink-0 items-center gap-6">
        <TasksGauge completed={completedWeight} total={totalWeight} />
        <div className="flex w-[124px] shrink-0 flex-col items-start gap-1">
          <p className="font-['Satoshi',sans-serif] text-[16px] font-medium leading-[normal] text-foreground">
            Tasks Completed
          </p>
          <p className="whitespace-nowrap font-['Satoshi',sans-serif] text-[14px] font-medium leading-[normal] tracking-[-0.14px] text-muted-foreground">
            of {Math.round(totalWeight)} Total Points
          </p>
        </div>
      </div>

      {/* Commits */}
      <div className="relative flex shrink-0 items-center gap-6">
        <CommitsGauge structural={structuralCommits} incremental={incrementalCommits} trivial={trivialCommits} />
        <div className="flex shrink-0 flex-col items-start gap-1">
          <p className="font-['Satoshi',sans-serif] text-[16px] font-medium leading-[normal] text-foreground">
            Commits
          </p>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5">
              <div className="size-1 rounded-full" style={{ backgroundColor: COMMIT_GREEN }} />
              <p className="font-['Satoshi',sans-serif] text-[14px] font-medium leading-[normal] text-muted-foreground">
                Shipped {structuralCommits}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-1 rounded-full" style={{ backgroundColor: COMMIT_YELLOW }} />
              <p className="font-['Satoshi',sans-serif] text-[14px] font-medium leading-[normal] text-muted-foreground">
                In Progress {incrementalCommits}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-1 rounded-full" style={{ backgroundColor: COMMIT_GREY }} />
              <p className="font-['Satoshi',sans-serif] text-[14px] font-medium leading-[normal] text-muted-foreground">
                Trivial {trivialCommits}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
