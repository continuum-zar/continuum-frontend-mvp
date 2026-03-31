import { useEffect, useMemo, useState } from "react";
import {
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
  ScrollText,
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

export function DashboardPlaceholderGetStartedTimeLogs() {
  const [searchParams] = useSearchParams();
  const populated = searchParams.get("populated") === "1";
  const [logTimeOpen, setLogTimeOpen] = useState(false);
  const [page, setPage] = useState(1);

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

          <section className="z-[1] flex min-h-0 min-w-0 max-w-none flex-1 flex-col overflow-x-auto overflow-y-auto rounded-[8px] border border-[#ebedee] bg-white px-6 py-4 pb-8 shadow-[0px_44px_12px_0px_rgba(15,15,31,0),0px_28px_11px_0px_rgba(15,15,31,0.01),0px_16px_10px_0px_rgba(15,15,31,0.02),0px_7px_7px_0px_rgba(15,15,31,0.03),0px_2px_4px_0px_rgba(15,15,31,0.04)]">
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
                  <span className={tabBtn(true)}>Time logs</span>
                  <button type="button" className={tabBtn(false)}>
                    Activity
                  </button>
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

          {/* Title row */}
          <div className="mt-4 flex items-center gap-2">
            <h1 className="text-[24px] font-medium text-[#0b191f]">Time Logs</h1>
            <button type="button" className="inline-flex size-6 items-center justify-center text-[#0b191f]" aria-label="More options">
              <Ellipsis className="size-4" />
            </button>
          </div>

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
          </section>
        </div>
      </div>
      <LogTimeModal open={logTimeOpen} onOpenChange={setLogTimeOpen} />
    </>
  );
}
