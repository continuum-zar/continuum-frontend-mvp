import { useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, RotateCw, TriangleAlert } from "lucide-react";
import { getUserErrorMessage } from "@/lib/errorMessages";
import { DashboardLeftRail } from "../components/dashboard-placeholder/DashboardLeftRail";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Skeleton } from "../components/ui/skeleton";
import { CumulativeFlowDiagram } from "../components/dashboard-charts/CumulativeFlowDiagram";
import { HpsTrendChart } from "../components/dashboard-charts/HpsTrendChart";
import { ProjectHistoryChart } from "../components/dashboard-charts/ProjectHistoryChart";
import {
  fetchProjectCumulativeFlow,
  fetchProjectHpsVelocity,
  fetchProjectHistory,
} from "@/api";
import { useProjects } from "@/api/hooks";
import { STALE_MODERATE_MS } from "@/lib/queryDefaults";
import { WORKSPACE_BASE, type WorkspaceChartId } from "@/lib/workspacePaths";

/** Rolling-window presets. `days` drives the API window; `null` means all history. */
const RANGE_OPTIONS: { value: string; label: string; days: number | null }[] = [
  { value: "30", label: "Last 30 days", days: 30 },
  { value: "90", label: "Last 90 days", days: 90 },
  { value: "180", label: "Last 180 days", days: 180 },
  { value: "365", label: "Last 12 months", days: 365 },
  { value: "all", label: "All time", days: null },
];

const DEFAULT_RANGE = "90";
/**
 * The windowed endpoints (cumulative-flow `days`, velocity `weeks`) validate the
 * range and reject anything past ~1 year, so "All time" requests the largest
 * window they accept. Project history ignores this and filters client-side.
 */
const MAX_WINDOW_DAYS = 365;
const MAX_WINDOW_WEEKS = 52;

const CHART_META: Record<WorkspaceChartId, { title: string; description: string }> = {
  "cumulative-flow": {
    title: "Cumulative flow",
    description: "Tasks in To do, In progress, and Done over the selected range",
  },
  "hps-trend": {
    title: "HPS trend",
    description: "Hours per scope point by completion week",
  },
  "project-history": {
    title: "Project history",
    description: "Progress % and total hours from snapshots",
  },
};

const CHART_HEIGHT = 560;

function isChartId(value: string | undefined): value is WorkspaceChartId {
  return value === "cumulative-flow" || value === "hps-trend" || value === "project-history";
}

function CumulativeFlowFullscreen({ projectId, days }: { projectId: string; days: number }) {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["project-cumulative-flow", projectId, days],
    queryFn: () => fetchProjectCumulativeFlow(projectId, days),
    staleTime: STALE_MODERATE_MS,
    retry: false,
  });
  if (isLoading) return <Skeleton className="w-full" style={{ height: CHART_HEIGHT }} />;
  if (isError) return <ChartLoadError error={error} onRetry={() => void refetch()} retrying={isFetching} />;
  return <CumulativeFlowDiagram data={data?.series ?? []} height={CHART_HEIGHT} />;
}

function HpsTrendFullscreen({ projectId, days }: { projectId: string; days: number }) {
  const weeks = Math.min(MAX_WINDOW_WEEKS, Math.max(1, Math.ceil(days / 7)));
  const { data = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["project-hps-velocity", projectId, weeks],
    queryFn: () => fetchProjectHpsVelocity(projectId, weeks),
    staleTime: STALE_MODERATE_MS,
    retry: false,
  });
  if (isLoading) return <Skeleton className="w-full" style={{ height: CHART_HEIGHT }} />;
  if (isError) return <ChartLoadError error={error} onRetry={() => void refetch()} retrying={isFetching} />;
  return <HpsTrendChart points={data} height={CHART_HEIGHT} emptyLabel="No weekly HPS points yet" />;
}

function ProjectHistoryFullscreen({ projectId, days }: { projectId: string; days: number | null }) {
  // The history endpoint has no range param, so fetch all and filter client-side.
  const { data = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["project-history", projectId],
    queryFn: () => fetchProjectHistory(projectId),
    staleTime: STALE_MODERATE_MS,
    retry: false,
  });
  const filtered = useMemo(() => {
    if (days == null) return data;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return data.filter((point) => {
      const t = new Date(point.date).getTime();
      return Number.isNaN(t) || t >= cutoff;
    });
  }, [data, days]);
  if (isLoading) return <Skeleton className="w-full" style={{ height: CHART_HEIGHT }} />;
  if (isError) return <ChartLoadError error={error} onRetry={() => void refetch()} retrying={isFetching} />;
  return <ProjectHistoryChart history={filtered} height={CHART_HEIGHT} />;
}

function ChartLoadError({
  error,
  onRetry,
  retrying,
}: {
  error: unknown;
  onRetry: () => void;
  retrying: boolean;
}) {
  const message = getUserErrorMessage(error, "We couldn't load this chart's data.");
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 text-center"
      style={{ height: CHART_HEIGHT }}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-[#fdecec] text-[#d64545]">
        <TriangleAlert className="size-6" />
      </div>
      <div className="flex max-w-[340px] flex-col gap-1">
        <p className="text-[16px] font-medium text-[#0b191f]">Couldn't load chart</p>
        <p className="text-[14px] text-[#727d83]">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="inline-flex items-center gap-2 rounded-[8px] border border-[#ebedee] bg-white px-4 py-2 text-[14px] font-medium text-[#0b191f] transition-colors hover:bg-[#f0f3f5] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24B5F8]"
      >
        <RotateCw className={`size-4 ${retrying ? "animate-spin" : ""}`} />
        {retrying ? "Retrying…" : "Retry"}
      </button>
    </div>
  );
}

export function DashboardChartFullscreen() {
  const { chartId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const projectId = searchParams.get("project") ?? "";
  const rawRange = searchParams.get("range");
  const range = RANGE_OPTIONS.some((o) => o.value === rawRange) ? (rawRange as string) : DEFAULT_RANGE;
  const rangeOption = RANGE_OPTIONS.find((o) => o.value === range) ?? RANGE_OPTIONS[1];

  const { data: projects = [] } = useProjects();
  const projectName = useMemo(
    () => projects.find((p) => String(p.id) === projectId)?.title,
    [projects, projectId]
  );

  const setRange = (next: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("range", next);
    setSearchParams(params, { replace: true });
  };

  const meta = isChartId(chartId) ? CHART_META[chartId] : null;
  // Windowed endpoints cap at ~1 year, so "All time" (null) clamps to the max they accept.
  // Project history ignores this and filters the full snapshot set client-side.
  const apiDays = Math.min(rangeOption.days ?? MAX_WINDOW_DAYS, MAX_WINDOW_DAYS);

  return (
    <div
      className="box-border flex h-screen min-h-0 w-full min-w-0 flex-col overflow-hidden gap-[10px] pb-[8px] pl-[12px] pr-[8px] pt-[12px] font-['Satoshi',sans-serif]"
      style={{
        backgroundImage:
          "linear-gradient(0deg, rgba(178, 230, 247, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(90deg, rgb(249, 250, 251) 0%, rgb(249, 250, 251) 100%)",
      }}
    >
      <div className="isolate flex min-h-0 w-full min-w-0 flex-1 flex-row items-stretch gap-[10px]">
        <DashboardLeftRail />

        <section className="z-[1] flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[8px] border border-[#ebedee] bg-white">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#ebedee] px-6 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(WORKSPACE_BASE)}
                aria-label="Back to dashboard"
                className="shrink-0 rounded-md p-1.5 text-[#606d76] transition-colors hover:bg-[#f0f3f5] hover:text-[#0b191f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24B5F8]"
              >
                <ArrowLeft className="size-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-[20px] font-medium text-[#0b191f]">
                  {meta?.title ?? "Chart"}
                </p>
                <p className="truncate text-[13px] text-[#606d76]">
                  {meta?.description ?? "Unknown chart"}
                  {projectName ? ` · ${projectName}` : ""}
                </p>
              </div>
            </div>

            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-[180px] border-[#ebedee] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {!meta ? (
              <div className="flex h-full items-center justify-center text-sm text-[#727d83]">
                Unknown chart.
              </div>
            ) : !projectId ? (
              <div className="flex h-full items-center justify-center text-sm text-[#727d83]">
                No project selected.
              </div>
            ) : chartId === "cumulative-flow" ? (
              <CumulativeFlowFullscreen projectId={projectId} days={apiDays} />
            ) : chartId === "hps-trend" ? (
              <HpsTrendFullscreen projectId={projectId} days={apiDays} />
            ) : (
              <ProjectHistoryFullscreen projectId={projectId} days={rangeOption.days} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
