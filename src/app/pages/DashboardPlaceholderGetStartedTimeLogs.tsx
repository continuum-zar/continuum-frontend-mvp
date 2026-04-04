import { useEffect, useId, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Ellipsis,
  FolderOpenDot,
  Plus,
  Search,
  Share,
  SquarePen,
  Timer,
  TrendingUp,
  TrendingUpDown,
  ScrollText,
  UsersRound,
} from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { DashboardLeftRail } from "../components/dashboard-placeholder/DashboardLeftRail";
import { LogTimeModal } from "../components/dashboard-placeholder/LogTimeModal";

const tabBtn = (active: boolean) =>
  `rounded-[8px] px-4 py-2 text-[14px] font-medium ${
    active
      ? "border border-[#ebedee] bg-white text-[#0b191f] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
      : "text-[#606d76]"
  }`;

type TimeLogRow = {
  id: string;
  task: string;
  date: string;
  timePeriod: string;
  duration: string;
  billable: string;
};

const PAGE_SIZE = 10;

const TASK_TITLES = [
  "Set up high-fidelity prototypes with conditional logic",
  "Conduct user testing sessions and synthesize findings",
  "Implement accessibility standards in design",
  "Refine design system tokens and component specs",
  "Build interactive prototype flows in Figma",
  "Run stakeholder review and capture action items",
  "Document API contracts for third-party integrations",
  "QA sprint fixes and regression on core flows",
  "Prepare sprint demo deck and release notes",
  "Onboard new designer to team rituals",
  "Sync with engineering on design handoff",
  "Update project timeline and risk register",
  "Review analytics and funnel drop-off points",
  "Draft copy for onboarding and empty states",
  "Security review checklist for vendor tools",
];

const SAMPLE_LOGS: TimeLogRow[] = TASK_TITLES.map((task, i) => ({
  id: String(i + 1),
  task,
  date: `${22 + (i % 8)} December 2025`,
  timePeriod: ["08:00-17:30", "09:00-12:00", "10:00-16:00", "08:30-17:00"][i % 4],
  duration: `${(i % 8) + 1}.${i % 2 === 0 ? "5" : "0"}h`,
  billable: i % 6 === 4 ? "No" : "Yes",
}));

type ActivityMemberRow = {
  id: string;
  name: string;
  role: string;
  commits: number;
  totalHours: number;
  tasksCompleted: number;
  avatar: { kind: "photo"; src: string } | { kind: "initials"; text: string; bg: string };
};

const SAMPLE_ACTIVITY_MEMBERS: ActivityMemberRow[] = [
  {
    id: "1",
    name: "Amukelani Shiringani",
    role: "Product Designer",
    commits: 128,
    totalHours: 160,
    tasksCompleted: 25,
    avatar: { kind: "photo", src: "https://picsum.photos/seed/continuum-a/70/70" },
  },
  {
    id: "2",
    name: "John Doe",
    role: "UX Designer",
    commits: 95,
    totalHours: 140,
    tasksCompleted: 18,
    avatar: { kind: "initials", text: "JD", bg: "#e19c02" },
  },
  {
    id: "3",
    name: "Maria Garcia",
    role: "Visual Designer",
    commits: 120,
    totalHours: 150,
    tasksCompleted: 30,
    avatar: { kind: "initials", text: "MG", bg: "#f17173" },
  },
  {
    id: "4",
    name: "Raj Patel",
    role: "Interaction Designer",
    commits: 88,
    totalHours: 130,
    tasksCompleted: 22,
    avatar: { kind: "initials", text: "RP", bg: "#9da2f7" },
  },
  {
    id: "5",
    name: "Lisa Wong",
    role: "UI Designer",
    commits: 102,
    totalHours: 145,
    tasksCompleted: 19,
    avatar: { kind: "photo", src: "https://picsum.photos/seed/continuum-l/70/70" },
  },
  {
    id: "6",
    name: "Carlos Mejia",
    role: "Product Designer",
    commits: 110,
    totalHours: 155,
    tasksCompleted: 27,
    avatar: { kind: "photo", src: "https://picsum.photos/seed/continuum-c/70/70" },
  },
];

const cardShadow =
  "shadow-[0px_20px_6px_0px_rgba(26,59,84,0),0px_13px_5px_0px_rgba(26,59,84,0),0px_7px_4px_0px_rgba(26,59,84,0.01),0px_3px_3px_0px_rgba(26,59,84,0.03),0px_1px_2px_0px_rgba(26,59,84,0.03)]";

/** Grouped bar data — Figma BarLineChart 4:1636 */
const ACTIVITY_TRENDS_WEEKS = [
  { label: "Week 1", totalHours: 29, tasksCompleted: 45, commits: 59 },
  { label: "Week 2", totalHours: 28, tasksCompleted: 89, commits: 70 },
  { label: "Week 3", totalHours: 96, tasksCompleted: 85, commits: 84 },
  { label: "Week 4", totalHours: 11, tasksCompleted: 18, commits: 88 },
  { label: "Week 5", totalHours: 46, tasksCompleted: 43, commits: 67 },
  { label: "Week 6", totalHours: 38, tasksCompleted: 91, commits: 97 },
] as const;

const TREND_BAR_HOURS = "#7086fd";
const TREND_BAR_TASKS = "#6fd195";
const TREND_BAR_COMMITS = "#ffae4c";

/** Figma 4:1636 — BarArea height 672px; plot MainChart 685px; yAxis 29px; label tops 0,134,268,402,536,670 */
const TREND_CHART_MAIN_H = 685;
const TREND_BAR_AREA_TOP = 6;
const TREND_BAR_AREA_BOTTOM = 7;
const TREND_BAR_AREA_H = TREND_CHART_MAIN_H - TREND_BAR_AREA_TOP - TREND_BAR_AREA_BOTTOM; // 672
const Y_AXIS_W = 29;
/** Horizontal grid lines (xLines) — y from top of Graphi&Grid 685px frame */
const TREND_GRID_LINE_TOPS = [6, 140.6, 275.2, 409.8, 544.4, 679] as const;
const Y_LABEL_TOPS = [0, 134, 268, 402, 536, 670] as const;

/** Figma Graphi&Grid width (4:1638) — plot area scrolls horizontally when the column is narrower. */
const TREND_PLOT_W = 1179;
const TREND_CHART_MIN_W = Y_AXIS_W + TREND_PLOT_W;

/** Figma 4:1978 — Task Completion Rate area chart (smooth line + fill) */
const PERF_LINE = "#24B5F8";
const ACTIVITY_PERF_WEEKS = [
  { label: "Week 1", value: 56 },
  { label: "Week 2", value: 64 },
  { label: "Week 3", value: 76 },
  { label: "Week 4", value: 78 },
  { label: "Week 5", value: 70 },
  { label: "Week 6", value: 37 },
] as const;
/** Plot viewBox width; matches Graphi&Grid width in MainChart (4:1638) */
const PERF_PLOT_VB_W = 1179;
const PERF_PLOT_VB_H = TREND_BAR_AREA_H;
/** Figma singleLineArea inset-[22%_8.33%_0_8.33%] → x inset 8.33% of plot */
const PERF_X_INSET_FR = 0.0833;

function perfChartPoints(): { x: number; y: number; value: number }[] {
  const innerW = PERF_PLOT_VB_W * (1 - 2 * PERF_X_INSET_FR);
  const left = PERF_PLOT_VB_W * PERF_X_INSET_FR;
  return ACTIVITY_PERF_WEEKS.map((w, i) => {
    const x = left + ((i + 0.5) / 6) * innerW;
    const y = PERF_PLOT_VB_H * (1 - w.value / 100);
    return { x, y, value: w.value };
  });
}

/** Cubic Bezier chain through points (Catmull-Rom–style smooth curve). */
function smoothLinePathD(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }
  return d;
}

function perfAreaPathD(points: { x: number; y: number }[], yBottom: number): string {
  if (points.length === 0) return "";
  const p0 = points[0];
  const pL = points[points.length - 1];
  const line = smoothLinePathD(points);
  const afterMove = line.replace(/^M\s+[\d.-]+\s+[\d.-]+/, "");
  return `M ${p0.x} ${yBottom} L ${p0.x} ${p0.y}${afterMove} L ${pL.x} ${yBottom} Z`;
}

/** Figma 4:2052 Legends / 4:2054 Legend — LegendNode 16×16 + label */
function ActivityPerformanceLegendItem() {
  return (
    <div className="flex items-center gap-1">
      <div className="relative size-4 shrink-0">
        <div
          className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow-[0_0_0_1px_rgba(36,181,248,0.35)]"
          style={{ backgroundColor: PERF_LINE }}
        />
      </div>
      <span className="whitespace-nowrap text-[12px] font-normal leading-[15px] text-[rgba(0,0,0,0.7)]">
        Task Completion Rate
      </span>
    </div>
  );
}

function ActivityPerformanceAreaChart() {
  const areaGradientId = useId().replace(/:/g, "");
  const pts = perfChartPoints();
  const yBottom = PERF_PLOT_VB_H;
  const areaD = perfAreaPathD(pts, yBottom);
  const lineD = smoothLinePathD(pts);

  return (
    <div className="flex w-full min-w-0 flex-col p-2">
      <div className="min-w-0 overflow-x-hidden">
        <div className="flex w-full min-w-0" style={{ height: TREND_CHART_MAIN_H }}>
        <div
          className="relative shrink-0 text-[12px] font-normal leading-[15px] text-[rgba(0,0,0,0.7)]"
          style={{ width: Y_AXIS_W, height: TREND_CHART_MAIN_H, fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
        >
          {[100, 80, 60, 40, 20, 0].map((t, i) => (
            <span key={t} className="absolute right-0 whitespace-nowrap" style={{ top: Y_LABEL_TOPS[i] }}>
              {t}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1" style={{ height: TREND_CHART_MAIN_H }}>
          <div className="pointer-events-none absolute inset-0">
            {TREND_GRID_LINE_TOPS.map((top, i) => (
              <div
                key={top}
                className={`absolute left-0 right-0 h-0 ${
                  i === TREND_GRID_LINE_TOPS.length - 1 ? "border-t border-solid border-[#d4d4d8]" : "border-t border-dashed border-[#e4e4e7]"
                }`}
                style={{ top }}
              />
            ))}
          </div>
          <div className="pointer-events-none absolute inset-0">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-0 border-l border-dashed border-[#e4e4e7]"
                style={{ left: `${(i / 6) * 100}%` }}
              />
            ))}
          </div>
          {/* Figma 4:2004 LineArea — align plot with BarArea insets for grid match */}
          <div
            className="absolute left-0 right-0"
            style={{ top: TREND_BAR_AREA_TOP, bottom: TREND_BAR_AREA_BOTTOM }}
          >
            <svg
              className="block h-full w-full"
              viewBox={`0 0 ${PERF_PLOT_VB_W} ${PERF_PLOT_VB_H}`}
              preserveAspectRatio="xMidYMid meet"
              aria-hidden
            >
              <defs>
                <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
                  <stop offset="0%" stopColor="rgb(45, 154, 249)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="rgb(45, 154, 249)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <path d={areaD} fill={`url(#${areaGradientId})`} />
              <path d={lineD} fill="none" stroke={PERF_LINE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p) => (
                <g key={`${p.x}-${p.y}`}>
                  <circle cx={p.x} cy={p.y} r={6} fill={PERF_LINE} opacity={0.2} />
                  <circle cx={p.x} cy={p.y} r={4} fill={PERF_LINE} stroke="#fff" strokeWidth={2} />
                  <text
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    fill="rgba(0,0,0,0.7)"
                    style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: 12 }}
                  >
                    {p.value}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
        </div>
        <div
          className="flex h-[23px] w-full shrink-0 items-start pl-[29px] pt-0"
          style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
        >
          {ACTIVITY_PERF_WEEKS.map((w) => (
            <div key={w.label} className="flex min-h-0 min-w-0 flex-1 flex-col items-stretch">
              <p className="w-full text-center text-[12px] font-normal leading-[15px] text-[rgba(0,0,0,0.7)]">{w.label}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Legends — Figma 4:2052 h 24, full width below Chart&Axis */}
      <div
        className="flex h-6 w-full shrink-0 items-center justify-center px-2 pt-0"
        role="group"
        aria-label="Chart legend"
      >
        <ActivityPerformanceLegendItem />
      </div>
    </div>
  );
}

function ActivityTrendsLegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1 overflow-hidden p-1">
      <div className="relative size-4 shrink-0">
        <div
          className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 border border-white"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="whitespace-nowrap text-[12px] font-normal leading-normal text-[rgba(0,0,0,0.7)]">{label}</span>
    </div>
  );
}

function ActivityTrendBar({
  value,
  color,
  plotHeightPx,
}: {
  value: number;
  color: string;
  plotHeightPx: number;
}) {
  const barH = (value / 100) * plotHeightPx;
  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col items-center justify-end">
      <span
        className="absolute left-1/2 z-[1] -translate-x-1/2 whitespace-nowrap text-[10px] font-normal leading-[12px] text-[rgba(0,0,0,0.7)]"
        style={{ bottom: `calc(${barH}px + 2px)`, fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
      >
        {value}
      </span>
      <div
        className="w-full opacity-80"
        style={{
          height: barH,
          minHeight: value > 0 ? 1 : 0,
          backgroundColor: color,
        }}
      />
    </div>
  );
}

/** Figma 4:1636 BarLineChart — horizontal scroll is scoped to the chart block only (like Performance’s chart card), not the whole middle panel. */
function ActivityTrendsBarChart() {
  const yTicks = [100, 80, 60, 40, 20, 0] as const;

  return (
    <div className="flex w-full min-w-0 flex-col p-2">
      <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain scrollbar-hide [-webkit-overflow-scrolling:touch]">
        <div className="min-w-0" style={{ minWidth: TREND_CHART_MIN_W }}>
          {/* MainChart row: yAxisLeft 29×685 + Graphi&Grid 1179×685 (Figma 4:1638) */}
          <div className="flex w-full min-w-0" style={{ height: TREND_CHART_MAIN_H }}>
          <div
            className="relative shrink-0 text-[12px] font-normal leading-[15px] text-[rgba(0,0,0,0.7)]"
            style={{ width: Y_AXIS_W, height: TREND_CHART_MAIN_H, fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
          >
            {yTicks.map((t, i) => (
              <span key={t} className="absolute right-0 whitespace-nowrap" style={{ top: Y_LABEL_TOPS[i] }}>
                {t}
              </span>
            ))}
          </div>
          <div className="relative min-w-0 flex-1" style={{ height: TREND_CHART_MAIN_H }}>
            {/* xLines — dashed; bottom line solid (Figma uses img for last line) */}
            <div className="pointer-events-none absolute inset-0">
              {TREND_GRID_LINE_TOPS.map((top, i) => (
                <div
                  key={top}
                  className={`absolute left-0 right-0 h-0 ${
                    i === TREND_GRID_LINE_TOPS.length - 1 ? "border-t border-solid border-[#d4d4d8]" : "border-t border-dashed border-[#e4e4e7]"
                  }`}
                  style={{ top }}
                />
              ))}
            </div>
            {/* yLines — 7 vertical lines at 0, 1/6 … 1 of plot width (4:1654) */}
            <div className="pointer-events-none absolute inset-0">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-0 border-l border-dashed border-[#e4e4e7]"
                  style={{ left: `${(i / 6) * 100}%` }}
                />
              ))}
            </div>
            {/* BarArea inset-[6px_0_7px_0] — 4:1662 */}
            <div
              className="absolute flex items-stretch"
              style={{
                left: 0,
                right: 0,
                top: TREND_BAR_AREA_TOP,
                bottom: TREND_BAR_AREA_BOTTOM,
              }}
            >
              {ACTIVITY_TRENDS_WEEKS.map((week) => (
                <div
                  key={week.label}
                  className="flex h-full min-h-0 min-w-0 flex-1 items-stretch gap-0.5 px-[15px]"
                >
                  <ActivityTrendBar value={week.totalHours} color={TREND_BAR_HOURS} plotHeightPx={TREND_BAR_AREA_H} />
                  <ActivityTrendBar
                    value={week.tasksCompleted}
                    color={TREND_BAR_TASKS}
                    plotHeightPx={TREND_BAR_AREA_H}
                  />
                  <ActivityTrendBar value={week.commits} color={TREND_BAR_COMMITS} plotHeightPx={TREND_BAR_AREA_H} />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* xAxis — 4:1759 h 23, labels align with BarGroup columns (pl 29 matches y-axis) */}
        <div
          className="flex h-[23px] w-full shrink-0 items-start pl-[29px] pt-0"
          style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
        >
          {ACTIVITY_TRENDS_WEEKS.map((w) => (
            <div key={w.label} className="flex min-h-0 min-w-0 flex-1 flex-col items-stretch">
              <p className="w-full text-center text-[12px] font-normal leading-[15px] text-[rgba(0,0,0,0.7)]">{w.label}</p>
            </div>
          ))}
        </div>
        </div>
      </div>
      {/* Legends — 4:1772 h 24 */}
      <div className="flex h-6 w-full shrink-0 items-start justify-center overflow-hidden pt-0">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0 px-2">
          <ActivityTrendsLegendItem color={TREND_BAR_HOURS} label="Total Hours" />
          <ActivityTrendsLegendItem color={TREND_BAR_TASKS} label="Tasks Completed" />
          <ActivityTrendsLegendItem color={TREND_BAR_COMMITS} label="Commits" />
        </div>
      </div>
    </div>
  );
}

/** Welcome / Get started demo: populated + Activity tab unless URL overrides (`populated=0` = empty mock). */
function buildGetStartedSearchParams(populated: boolean, tab: "time-logs" | "activity"): string {
  const p = new URLSearchParams();
  p.set("populated", populated ? "1" : "0");
  p.set("tab", tab);
  return `?${p.toString()}`;
}

export function DashboardPlaceholderGetStartedTimeLogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  /** Default: show sample data (opt out with `?populated=0`). */
  const populated = searchParams.get("populated") !== "0";
  /** Default: Activity tab (`?tab=time-logs` for time log table). */
  const mainTab: "time-logs" | "activity" =
    searchParams.get("tab") === "time-logs" ? "time-logs" : "activity";
  const [logTimeOpen, setLogTimeOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [activityView, setActivityView] = useState<"members" | "trends" | "performance">("members");

  const qsTimeLogs = buildGetStartedSearchParams(populated, "time-logs");
  const qsActivity = buildGetStartedSearchParams(populated, "activity");

  useEffect(() => {
    if (searchParams.toString() === "") {
      setSearchParams({ populated: "1", tab: "activity" }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const logs = useMemo(() => (populated ? SAMPLE_LOGS : []), [populated]);

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));

  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return logs.slice(start, start + PAGE_SIZE);
  }, [logs, page]);

  useEffect(() => {
    setPage(1);
  }, [populated]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  return (
    <>
      <div
        className="box-border flex h-screen min-h-0 w-full min-w-0 flex-col overflow-hidden gap-[10px] pb-[8px] pl-[12px] pr-[8px] pt-[12px] font-['Satoshi',sans-serif]"
        style={{
          backgroundImage:
            "linear-gradient(0deg, rgba(178, 230, 247, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%)",
        }}
      >
        <div className="isolate flex min-h-0 w-full min-w-0 flex-1 flex-row items-stretch gap-4">
          <DashboardLeftRail />

          <section className="scrollbar-hide z-[1] flex min-h-0 min-w-0 max-w-none flex-1 flex-col overflow-x-auto overflow-y-auto rounded-[8px] border border-[#ebedee] bg-white px-6 py-4 pb-8 shadow-[0px_44px_12px_0px_rgba(15,15,31,0),0px_28px_11px_0px_rgba(15,15,31,0.01),0px_16px_10px_0px_rgba(15,15,31,0.02),0px_7px_7px_0px_rgba(15,15,31,0.03),0px_2px_4px_0px_rgba(15,15,31,0.04)]">
          {/* Top bar — matches Figma 40:7745 / 40:8001 */}
          <div className="flex w-full flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#606d76]">
                <FolderOpenDot className="size-4 shrink-0" strokeWidth={1.5} />
                <span className="text-[16px] font-medium">Continuum</span>
                <span className="inline-flex size-4 items-center justify-center">
                  <span className="text-[14px]">›</span>
                </span>
                <span className="text-[16px] font-medium">UX Strategy</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex h-8 items-center gap-2 rounded-[999px] bg-[#d7fede] px-4 py-2">
                  <Timer className="size-4 shrink-0 text-[#108e27]" />
                  <span className="text-[14px] font-bold text-[#108e27]">Project on track</span>
                </div>
                <div className="flex h-8 items-center gap-0.5 rounded-[8px] bg-[#f0f3f5] p-0.5">
                  <Link
                    to="/dashboard-placeholder/get-started"
                    className={`inline-flex h-9 items-center justify-center rounded-[8px] px-4 no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring ${tabBtn(false)}`}
                  >
                    Sprint
                  </Link>
                  <Link
                    to={`/dashboard-placeholder/get-started/time-logs${qsTimeLogs}`}
                    className={`inline-flex h-9 items-center justify-center rounded-[8px] px-4 no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring ${tabBtn(mainTab === "time-logs")}`}
                  >
                    Time logs
                  </Link>
                  <Link
                    to={`/dashboard-placeholder/get-started/time-logs${qsActivity}`}
                    className={`inline-flex h-9 items-center justify-center rounded-[8px] px-4 no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring ${tabBtn(mainTab === "activity")}`}
                  >
                    Activity
                  </Link>
                </div>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#ededed] bg-white shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                  aria-label="Notifications"
                >
                  <Bell className="size-4" />
                </button>
                <button
                  type="button"
                  className="flex h-8 items-center gap-2 rounded-[8px] border border-[#ededed] bg-white px-4 text-[14px] text-[#0b191f] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                >
                  <Share className="size-4" />
                  Share
                </button>
                <button
                  type="button"
                  className="flex h-8 items-center gap-1.5 rounded-[8px] bg-[#24B5F8] px-4 py-2 text-[14px] font-bold text-white"
                >
                  Export
                  <ChevronDown className="size-4" />
                </button>
              </div>
            </div>
            <div className="h-px w-full bg-[#ebedee]" />
          </div>

          {/* Title row — Activity + populated: title lives in toolbar column (Figma 4:1256) */}
          {(mainTab === "time-logs" || (mainTab === "activity" && !populated)) && (
            <div className="mt-4 flex items-center gap-2">
              <h1 className="text-[24px] font-medium text-[#0b191f]">
                {mainTab === "activity" ? "Activity" : "Time Logs"}
              </h1>
              <button type="button" className="inline-flex size-6 items-center justify-center text-[#0b191f]" aria-label="More options">
                <Ellipsis className="size-4" />
              </button>
            </div>
          )}

          {mainTab === "activity" && (
            <>
              {/* Activity toolbar — Figma 4:1255 (populated only); empty state is title + center only */}
              {populated && (
                <div className="mt-4 flex w-full flex-wrap items-end justify-center gap-4">
                  <div className="flex min-w-0 flex-1 flex-col gap-4">
                    <div className="flex w-full items-center gap-2">
                      <h2 className="text-[24px] font-medium text-[#0b191f]">Activity</h2>
                      <button type="button" className="inline-flex size-6 items-center justify-center text-[#0b191f]" aria-label="More options">
                        <Ellipsis className="size-4" />
                      </button>
                    </div>
                    <div className="flex w-full flex-wrap items-center gap-2">
                      {activityView === "trends" ? (
                        /* Figma 4:1611 — Trends toolbar */
                        <div className="flex h-10 items-center gap-2 rounded-[10px]">
                          <button
                            type="button"
                            onClick={() => setActivityView("members")}
                            className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#edf0f3] px-4 py-2 text-[#606d76]"
                            aria-label="Members"
                          >
                            <UsersRound className="size-4 shrink-0" strokeWidth={1.5} />
                          </button>
                          <div className="flex h-10 items-center gap-2 overflow-hidden rounded-[8px] bg-[#cfecff] px-4 py-2 text-[#043e59]">
                            <Activity className="size-4 shrink-0" strokeWidth={1.5} />
                            <span className="text-[14px] font-medium">Trends</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActivityView("performance")}
                            className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#edf0f3] px-4 py-2 text-[#606d76]"
                            aria-label="Performance"
                          >
                            <TrendingUpDown className="size-4 shrink-0" strokeWidth={1.5} />
                          </button>
                        </div>
                      ) : activityView === "performance" ? (
                        /* Figma 4:1953 — Performance toolbar */
                        <div className="flex h-10 items-center gap-2 rounded-[10px]">
                          <button
                            type="button"
                            onClick={() => setActivityView("members")}
                            className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#edf0f3] px-4 py-2 text-[#606d76]"
                            aria-label="Members"
                          >
                            <UsersRound className="size-4 shrink-0" strokeWidth={1.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setActivityView("trends")}
                            className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#edf0f3] px-4 py-2 text-[#606d76]"
                            aria-label="Trends"
                          >
                            <Activity className="size-4 shrink-0" strokeWidth={1.5} />
                          </button>
                          <div className="flex h-10 items-center gap-2 overflow-hidden rounded-[8px] bg-[#cfecff] px-4 py-2 text-[#043e59]">
                            <TrendingUpDown className="size-4 shrink-0" strokeWidth={1.5} />
                            <span className="text-[14px] font-medium">Performance</span>
                          </div>
                        </div>
                      ) : (
                        /* Figma 4:1269 — Members toolbar */
                        <div className="flex h-10 items-center gap-2 rounded-[10px]">
                          <button
                            type="button"
                            onClick={() => setActivityView("members")}
                            className={`flex h-10 items-center gap-2 rounded-[8px] px-4 py-2 ${
                              activityView === "members" ? "bg-[#cfecff] text-[#043e59]" : "bg-[#edf0f3] text-[#606d76]"
                            }`}
                          >
                            <UsersRound className="size-4 shrink-0" strokeWidth={1.5} />
                            <span className="text-[14px] font-medium">Members</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActivityView("trends")}
                            className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-[#edf0f3] text-[#606d76]"
                            aria-label="Trends chart"
                          >
                            <Activity className="size-4" strokeWidth={1.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setActivityView("performance")}
                            className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-[#edf0f3] text-[#606d76]"
                            aria-label="Performance"
                          >
                            <TrendingUpDown className="size-4" strokeWidth={1.5} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex w-[220px] shrink-0 flex-col gap-1">
                    <label className="text-[14px] font-medium text-[#606d76]">Date Range</label>
                    <div className="flex h-10 items-center justify-between rounded-[8px] border border-[#e9e9e9] bg-white px-4">
                      <span
                        className={`text-[14px] font-medium ${activityView === "trends" || activityView === "performance" ? "text-[#0b191f]" : "text-[#606d76]"}`}
                      >
                        {activityView === "trends" || activityView === "performance"
                          ? "01/01/2026 - 01/03/2026"
                          : "Start Date-End Date"}
                      </span>
                      <Calendar className="size-4 shrink-0 text-[#606d76]" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="flex h-10 w-[212px] shrink-0 items-center gap-2 rounded-[999px] bg-[#edf0f3] px-4">
                    <Search className="size-4 shrink-0 text-[#606d76]" strokeWidth={1.5} />
                    <span className="text-[14px] font-medium text-[#606d76]">Search members</span>
                  </div>
                </div>
              )}

              {!populated && (
                <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center py-12">
                  <div className="flex h-[114px] w-[286px] flex-col items-center justify-between text-[#727d83]">
                    <Timer className="size-12 stroke-[1.25]" strokeWidth={1.25} />
                    <div className="flex w-full flex-col items-center gap-1 text-center leading-normal">
                      <p className="text-[20px] font-bold">No Activity</p>
                      <p className="text-[14px] font-medium">Overtime team contributions will appear here</p>
                    </div>
                  </div>
                </div>
              )}

              {populated && activityView === "members" && (
                <div className="mt-4 flex w-full flex-wrap content-start gap-4">
                  {SAMPLE_ACTIVITY_MEMBERS.map((m) => (
                    <div
                      key={m.id}
                      className={`flex w-[260px] shrink-0 flex-col items-start rounded-[12px] border border-[#ebedee] bg-white p-6 ${cardShadow}`}
                    >
                      <div className="flex w-full flex-col gap-6">
                        <div className="flex h-10 w-full items-center rounded-[8px]">
                          <div className="flex items-center gap-2">
                            {m.avatar.kind === "photo" ? (
                              <img
                                src={m.avatar.src}
                                alt=""
                                className="size-[35px] shrink-0 rounded-full object-cover"
                                width={35}
                                height={35}
                              />
                            ) : (
                              <div
                                className="flex size-[35px] shrink-0 items-center justify-center rounded-full text-[13.13px] font-medium text-white"
                                style={{ backgroundColor: m.avatar.bg }}
                              >
                                {m.avatar.text}
                              </div>
                            )}
                            <div className="flex flex-col items-start justify-center whitespace-nowrap">
                              <p className="text-[14px] font-medium text-[#0b191f]">{m.name}</p>
                              <p className="text-[12px] font-medium text-[#727d83]">{m.role}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex w-full flex-col gap-2 text-[14px] font-medium whitespace-nowrap">
                          <div className="flex w-full items-center justify-between">
                            <span className="text-[#727d83]">Commits</span>
                            <span className="w-[34px] overflow-hidden text-ellipsis text-right text-[#0b191f]">{m.commits}</span>
                          </div>
                          <div className="flex w-full items-center justify-between">
                            <span className="text-[#727d83]">Total hours</span>
                            <span className="w-[34px] overflow-hidden text-ellipsis text-right text-[#0b191f]">{m.totalHours}</span>
                          </div>
                          <div className="flex w-full items-center justify-between">
                            <span className="text-[#727d83]">Task completed</span>
                            <span className="w-[34px] overflow-hidden text-ellipsis text-right text-[#0b191f]">{m.tasksCompleted}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {populated && activityView === "trends" && (
                <div className="mt-4 w-full min-w-0 overflow-x-hidden rounded-[8px] border border-[#ebedee] bg-white">
                  <ActivityTrendsBarChart />
                </div>
              )}

              {populated && activityView === "performance" && (
                <div className="mt-4 w-full min-w-0 overflow-x-hidden rounded-[8px] border border-[#ebedee] bg-white">
                  <ActivityPerformanceAreaChart />
                </div>
              )}
            </>
          )}

          {mainTab === "time-logs" && (
            <>
          {/* KPI cards — Figma 40:7972 / 40:8052 / 40:8053 + 40:8077: h-[149px], p-[24px], gap-[16px] between cards */}
          {populated && (
            <div className="mt-6 flex w-full min-w-0 flex-wrap gap-4">
              {/* Total Hours — 40:8053 */}
              <div className="flex h-[149px] w-[375px] shrink-0 flex-col justify-between rounded-[12px] border border-[#ebedee] bg-white p-6">
                <div className="flex items-start gap-1">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="text-[16px] font-medium leading-normal text-[#727d83]">Total Hours</p>
                    <p className="h-[38px] max-w-[291px] text-[24px] font-medium leading-none text-[#0b191f]">
                      102.5 hours
                    </p>
                  </div>
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-[#ededed] bg-white">
                    <Timer className="size-4" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <TrendingUp className="size-4 shrink-0 text-[#108e27]" strokeWidth={1.5} />
                  <span className="text-[16px] font-normal leading-normal text-[#108e27]">5.5hrs</span>
                  <span className="text-[16px] font-normal leading-normal text-[#727d83]">up from last week</span>
                </div>
              </div>
              {/* Total Rate Due — 40:8077 */}
              <div className="flex h-[149px] w-[375px] shrink-0 flex-col items-end justify-between rounded-[12px] border border-[#ebedee] bg-white p-6">
                <div className="flex items-start gap-1">
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-[16px] font-medium leading-normal text-[#727d83]">Total Rate Due</p>
                    <p className="h-[38px] max-w-[291px] text-right text-[24px] font-medium leading-none text-[#0b191f]">
                      R20,500
                    </p>
                  </div>
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-[#ededed] bg-white">
                    <ScrollText className="size-4" strokeWidth={1.5} />
                  </div>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-[16px] font-medium leading-normal text-[#606d76]"
                >
                  Generate invoice
                  <ChevronRight className="size-4 shrink-0" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          )}

          {/* Filters + search — Figma 40:7850 / 40:8103 */}
          <div className="mt-6 flex w-full flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex w-[158px] flex-col gap-1">
                <label className="text-[14px] font-medium text-[#606d76]">Time Range</label>
                <div className="flex h-10 items-center justify-between rounded-[8px] border border-[#e9e9e9] bg-white px-4">
                  <span className="text-[14px] text-[#252014]">Daily</span>
                  <ChevronDown className="size-4 text-[#252014]" />
                </div>
              </div>
              <div className="flex w-[136px] flex-col gap-1">
                <label className="text-[14px] font-medium text-[#606d76]">Billable</label>
                <div className="flex h-10 items-center justify-between rounded-[8px] border border-[#e9e9e9] bg-white px-4">
                  <span className="text-[14px] text-[#252014]">Yes</span>
                  <ChevronDown className="size-4 text-[#252014]" />
                </div>
              </div>
              <div className="flex w-[220px] flex-col gap-1">
                <label className="text-[14px] font-medium text-[#606d76]">Date Range</label>
                <div className="flex h-10 items-center justify-between rounded-[8px] border border-[#e9e9e9] bg-white px-4">
                  <span className="text-[14px] text-[#606d76]">Start Date-End Date</span>
                  <Calendar className="size-4 text-[#606d76]" />
                </div>
              </div>
            </div>
            <div className="flex h-10 items-center gap-2">
              <div className="flex h-10 w-[212px] items-center gap-2 rounded-[999px] bg-[#edf0f3] px-4">
                <Search className="size-4 shrink-0 text-[#606d76]" />
                <span className="text-[14px] text-[#606d76]">Search Projects</span>
              </div>
              <button
                type="button"
                onClick={() => setLogTimeOpen(true)}
                className="flex h-10 items-center gap-2 rounded-[8px] bg-[#24B5F8] px-4 text-[14px] font-bold text-white"
              >
                <Plus className="size-4" />
                Add Time Log
              </button>
            </div>
          </div>

          {/* Empty state — Figma 40:7879 */}
          {logs.length === 0 && (
            <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center py-12">
              <div className="flex w-[286px] flex-col items-center gap-4 text-[#727d83]">
                <Timer className="size-12 stroke-[1.25]" />
                <p className="text-center text-[20px] font-bold">No time Logs</p>
                <p className="text-center text-[14px] font-medium">Add time logs to existing tasks as you work</p>
              </div>
            </div>
          )}

          {/* Table + pagination — pagination below table, centered (Figma 40:7972, 40:8395, 40:7998) */}
          {logs.length > 0 && (
            <div className="mt-6 flex w-full min-w-0 flex-col gap-6">
              <div className="w-full min-w-0 overflow-hidden rounded-t-[8px]">
                {/* Table header + rows — list row Figma 40:8154; horizontal rules only (no vertical row borders) */}
                <div className="flex items-center gap-6 rounded-t-[8px] border-b border-t border-[#ebedee] bg-[#f0f3f5] px-4 py-3 text-[16px] font-medium text-[#606d76]">
                  <span className="min-w-0 flex-1">Task</span>
                  <span className="w-[180px] shrink-0">Date</span>
                  <span className="w-[124px] shrink-0">Time Period</span>
                  <span className="w-[124px] shrink-0">Duration</span>
                  <span className="w-[52px] shrink-0">Billable</span>
                  <div className="flex w-[56px] shrink-0 justify-end" aria-hidden>
                    <span className="sr-only">Actions</span>
                  </div>
                </div>
                {paginatedLogs.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center gap-6 border-b border-[#ebedee] bg-white px-4 py-[6px]"
                  >
                    <div className="flex min-h-px min-w-0 flex-1 items-center gap-2">
                      <p className="min-w-0 flex-1 truncate text-[16px] font-medium leading-normal text-[#131617]">
                        {row.task}
                      </p>
                    </div>
                    <p className="w-[180px] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-medium leading-normal text-[#697378]">
                      {row.date}
                    </p>
                    <p className="w-[124px] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-medium leading-normal text-[#697378]">
                      {row.timePeriod}
                    </p>
                    <p className="w-[124px] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-medium leading-normal text-[#697378]">
                      {row.duration}
                    </p>
                    <p className="w-[52px] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-medium leading-normal text-[#697378]">
                      {row.billable}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        className="flex size-6 shrink-0 items-center justify-center text-[#697378]"
                        aria-label="Edit"
                      >
                        <SquarePen className="size-4" strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        className="flex size-6 shrink-0 items-center justify-center text-[#697378]"
                        aria-label="More"
                      >
                        <Ellipsis className="size-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex w-full shrink-0 flex-wrap items-center justify-center gap-6 px-2 pb-2 pt-1">
                <button
                  type="button"
                  className={`flex size-10 items-center justify-center rounded-[8px] bg-white disabled:opacity-50 ${
                    page <= 1 ? "text-[#a1a1aa]" : "text-[#52525b]"
                  }`}
                  aria-label="First page"
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                >
                  <ChevronsLeft className="size-4" />
                </button>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    className={`flex size-10 items-center justify-center rounded-[8px] bg-white disabled:opacity-50 ${
                      page <= 1 ? "text-[#a1a1aa]" : "text-[#52525b]"
                    }`}
                    aria-label="Previous page"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <div className="flex items-center gap-0">
                    {totalPages <= 10 ? (
                      Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setPage(n)}
                          className={`flex size-10 items-center justify-center rounded-[8px] text-[14px] font-medium text-[#252014] ${
                            page === n ? "bg-[#ebedee]" : "bg-transparent hover:bg-[#f4f4f5]"
                          }`}
                        >
                          {n}
                        </button>
                      ))
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setPage(1)}
                          className={`flex size-10 items-center justify-center rounded-[8px] text-[14px] font-medium text-[#252014] ${
                            page === 1 ? "bg-[#ebedee]" : ""
                          }`}
                        >
                          1
                        </button>
                        <span className="flex size-10 items-center justify-center rounded-[8px] border border-[#e9e9e9] text-[14px] font-medium text-[#252014]">
                          ...
                        </span>
                        <button
                          type="button"
                          onClick={() => setPage(totalPages)}
                          className={`flex size-10 items-center justify-center rounded-[8px] text-[14px] font-medium text-[#252014] ${
                            page === totalPages ? "bg-[#ebedee]" : ""
                          }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    className={`flex size-10 items-center justify-center rounded-[8px] bg-white disabled:opacity-50 ${
                      page >= totalPages ? "text-[#a1a1aa]" : "text-[#52525b]"
                    }`}
                    aria-label="Next page"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
                <button
                  type="button"
                  className={`flex size-10 items-center justify-center rounded-[8px] bg-white disabled:opacity-50 ${
                    page >= totalPages ? "text-[#a1a1aa]" : "text-[#52525b]"
                  }`}
                  aria-label="Last page"
                  disabled={page >= totalPages}
                  onClick={() => setPage(totalPages)}
                >
                  <ChevronsRight className="size-4" />
                </button>
              </div>
            </div>
          )}
            </>
          )}
          </section>
        </div>
      </div>
      <LogTimeModal open={logTimeOpen} onOpenChange={setLogTimeOpen} />
    </>
  );
}
