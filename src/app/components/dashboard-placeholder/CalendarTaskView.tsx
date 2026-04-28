"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, endOfMonth, format, getDay, parseISO, startOfDay, startOfMonth, subDays } from "date-fns";
import { enUS } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, Loader2, LogIn, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import type { Task } from "@/types/task";
import {
  clearStoredGoogleAccessToken,
  fetchPrimaryCalendarEvents,
  getStoredGoogleAccessToken,
  requestGoogleCalendarAccessToken,
  type GoogleCalendarListItem,
} from "@/lib/googleCalendarClient";
import { parseTaskDueDate } from "./sprintViewScheduleUtils";

export type CalendarTaskViewProps = {
  tasks: Task[];
  onOpenTask: (taskId: string) => void;
};

type CalEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  kind: "task" | "google";
  taskId?: string;
  htmlLink?: string;
  color: string;
  textColor: string;
};

function googleItemToEvent(item: GoogleCalendarListItem): CalEvent | null {
  const st = item.start;
  const en = item.end;
  if (!st || !en) return null;
  if (st.dateTime && en.dateTime) {
    return { id: `gcal-${item.id}`, title: item.summary || "(No title)", start: new Date(st.dateTime), end: new Date(en.dateTime), allDay: false, kind: "google", htmlLink: item.htmlLink ?? undefined, color: "#1a73e8", textColor: "#fff" };
  }
  if (st.date && en.date) {
    return { id: `gcal-${item.id}`, title: item.summary || "(No title)", start: parseISO(`${st.date}T00:00:00`), end: parseISO(`${en.date}T00:00:00`), allDay: true, kind: "google", htmlLink: item.htmlLink ?? undefined, color: "#1a73e8", textColor: "#fff" };
  }
  return null;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDaysInMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday-based week
  let startWd = (getDay(firstDay) + 6) % 7; // 0=Mon
  const endWd = (getDay(lastDay) + 6) % 7;
  const cells: Date[] = [];
  for (let i = startWd - 1; i >= 0; i--) cells.push(subDays(firstDay, i + 1));
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));
  for (let i = 1; i < 7 - endWd; i++) cells.push(addDays(lastDay, i));
  return cells;
}

export function CalendarTaskView({ tasks, onOpenTask }: CalendarTaskViewProps) {
  const hasClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const [tokenVersion, setTokenVersion] = useState(0);
  const connected = Boolean(getStoredGoogleAccessToken());
  const [connecting, setConnecting] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<CalEvent[]>([]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [current, setCurrent] = useState(new Date());


  const year = current.getFullYear();
  const month = current.getMonth();
  const today = startOfDay(new Date());
  const gridDays = useMemo(() => getDaysInMonthGrid(year, month), [year, month]);

  const taskEvents: CalEvent[] = useMemo(() => {
    const out: CalEvent[] = [];
    for (const t of tasks) {
      const d = parseTaskDueDate(t.dueDate);
      if (!d) continue;
      out.push({ id: `task-${t.id}`, title: t.title, start: startOfDay(d), end: addDays(startOfDay(d), 1), allDay: true, kind: "task", taskId: t.id, color: "#0b191f", textColor: "#cfecff" });
    }
    return out;
  }, [tasks]);

  const allEvents = useMemo(() => [...googleEvents, ...taskEvents], [googleEvents, taskEvents]);

  const eventsForDay = useCallback((day: Date) => {
    const dayMs = day.getTime();
    return allEvents.filter(e => startOfDay(e.start).getTime() === dayMs || (e.allDay && e.start.getTime() <= dayMs && e.end.getTime() > dayMs));
  }, [allEvents]);


  useEffect(() => {
    const token = getStoredGoogleAccessToken();
    if (!token) { setGoogleEvents([]); return; }
    let cancelled = false;
    setGoogleLoading(true);
    const m0 = startOfMonth(current);
    const m1 = endOfMonth(current);
    fetchPrimaryCalendarEvents(token, subDays(m0, 7), addDays(m1, 7))
      .then(items => { if (!cancelled) setGoogleEvents(items.map(googleItemToEvent).filter((e): e is CalEvent => e != null)); })
      .catch(() => { if (!cancelled) setGoogleEvents([]); })
      .finally(() => { if (!cancelled) setGoogleLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, tokenVersion]);

  const handleConnect = useCallback(() => {
    if (!hasClientId) { toast.error("Set VITE_GOOGLE_CLIENT_ID in .env.local"); return; }
    setConnecting(true);
    requestGoogleCalendarAccessToken()
      .then(() => { setTokenVersion(n => n + 1); toast.success("Google Calendar connected"); })
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Sign-in failed"))
      .finally(() => setConnecting(false));
  }, [hasClientId]);

  const handleDisconnect = useCallback(() => {
    clearStoredGoogleAccessToken();
    setGoogleEvents([]);
    setTokenVersion(n => n + 1);
  }, []);

  const prevMonth = () => setCurrent(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1));
  const goToday = () => setCurrent(new Date());



  return (
    <div className="flex w-full min-w-0 flex-1 flex-col gap-0 overflow-hidden rounded-[8px] border border-[#dadce0] bg-white font-['Satoshi',sans-serif] shadow-sm" role="region" aria-label="Calendar">
      {/* Google Calendar-style header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dadce0] px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={goToday} className="rounded-[4px] border border-[#dadce0] bg-white px-3 py-[5px] text-[13px] font-medium text-[#3c4043] hover:bg-[#f6f8fc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]/40">
            Today
          </button>
          <div className="flex items-center">
            <button onClick={prevMonth} className="flex size-8 items-center justify-center rounded-full text-[#3c4043] hover:bg-[#f1f3f4] focus-visible:outline-none" aria-label="Previous month">
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button onClick={nextMonth} className="flex size-8 items-center justify-center rounded-full text-[#3c4043] hover:bg-[#f1f3f4] focus-visible:outline-none" aria-label="Next month">
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
          <h2 className="text-[18px] font-normal text-[#3c4043]">
            {format(current, "MMMM yyyy", { locale: enUS })}
          </h2>
          {googleLoading && <Loader2 className="size-4 animate-spin text-[#1a73e8]" aria-hidden />}
        </div>

        <div className="flex items-center gap-2">

          {/* Legend */}
          <div className="flex items-center gap-3 text-[12px] text-[#5f6368]">
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-[#1a73e8]" />Google</span>
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-[#0b191f]" />Tasks</span>
          </div>
          {connected ? (
            <>
              <button onClick={handleConnect} disabled={connecting} className="inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-[#dadce0] bg-white px-3 text-[12px] font-medium text-[#3c4043] hover:bg-[#f6f8fc] disabled:opacity-50">
                <RefreshCw className="size-3.5" aria-hidden />Reconnect
              </button>
              <button onClick={handleDisconnect} className="inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-[#dadce0] bg-white px-3 text-[12px] font-medium text-[#d93025] hover:bg-[#fce8e6]">
                Disconnect
              </button>
            </>
          ) : (
            <button onClick={handleConnect} disabled={!hasClientId || connecting} className="inline-flex h-8 items-center gap-1.5 rounded-[4px] bg-[#1a73e8] px-3 text-[12px] font-medium text-white hover:bg-[#1557b0] disabled:opacity-50 focus-visible:outline-none">
              <LogIn className="size-3.5" aria-hidden />
              {connecting ? "Connecting…" : "Connect Google"}
            </button>
          )}
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-[#dadce0]">
        {WEEKDAYS.map(d => (
          <div key={d} className="py-2 text-center text-[11px] font-medium uppercase tracking-wide text-[#70757a]">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid flex-1 grid-cols-7" style={{ gridTemplateRows: `repeat(${Math.ceil(gridDays.length / 7)}, 1fr)` }}>
        {gridDays.map((day, i) => {
          const isCurrentMonth = day.getMonth() === month;
          const isToday = day.getTime() === today.getTime();
          const dayEvents = eventsForDay(day);
          const isSat = (i % 7) === 5;
          const isSun = (i % 7) === 6;

          return (
            <div
              key={day.toISOString()}
              className={[
                "flex min-h-[100px] flex-col border-b border-r border-[#dadce0] p-1",
                !isCurrentMonth && "bg-[#f8f9fa]",
                (isSat || isSun) && isCurrentMonth && "bg-[#fafafa]",
              ].filter(Boolean).join(" ")}
            >
              {/* Day number */}
              <div className="mb-1 flex justify-center">
                <span className={[
                  "flex size-7 items-center justify-center rounded-full text-[13px]",
                  isToday ? "bg-[#1a73e8] font-semibold text-white" : isCurrentMonth ? "font-medium text-[#3c4043]" : "text-[#b0b8c1]",
                ].join(" ")}>
                  {day.getDate()}
                </span>
              </div>

              {/* Events */}
              <div className="flex flex-col gap-[2px] overflow-hidden">
                {dayEvents.slice(0, 3).map(ev => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => {
                      if (ev.kind === "task" && ev.taskId) { onOpenTask(ev.taskId); }
                      else if (ev.kind === "google" && ev.htmlLink) { window.open(ev.htmlLink, "_blank", "noopener,noreferrer"); }
                    }}
                    className="group flex w-full items-center gap-1 truncate rounded-[4px] px-1 py-[1px] text-left text-[11px] font-medium transition-opacity hover:opacity-80"
                    style={{ backgroundColor: ev.color, color: ev.textColor }}
                    title={ev.title}
                  >
                    {ev.kind === "google" && <ExternalLink className="size-2.5 shrink-0 opacity-70" aria-hidden />}
                    <span className="truncate">{ev.title}</span>
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <span className="px-1 text-[11px] text-[#70757a]">+{dayEvents.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom: not-connected prompt */}
      {!connected && !hasClientId && (
        <div className="border-t border-[#dadce0] px-4 py-2 text-[12px] text-[#5f6368]">
          Add <code className="rounded bg-[#f1f3f4] px-1">VITE_GOOGLE_CLIENT_ID</code> to <code className="rounded bg-[#f1f3f4] px-1">.env.local</code> to enable Google Calendar sync.
        </div>
      )}

      {!connected && hasClientId && (
        <div className="flex items-center gap-2 border-t border-[#dadce0] px-4 py-2">
          <CalendarDays className="size-4 shrink-0 text-[#1a73e8]" aria-hidden />
          <span className="text-[12px] text-[#5f6368]">Connect Google Calendar to see your events overlaid on this grid.</span>
        </div>
      )}
    </div>
  );
}
