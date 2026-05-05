import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { ActiveWorkSessionItem } from "@/api/dashboard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Skeleton } from "@/app/components/ui/skeleton";
import { memberAvatarBackground } from "@/lib/memberAvatar";
import type { Member } from "@/types/member";
import { ActiveWorkSessionDetailDialog, initialsFromActiveSession } from "./ActiveWorkSessionDetailDialog";

function getHeatmapColor(value: number) {
  if (value > 45) return "bg-primary";
  if (value > 30) return "bg-primary/80";
  if (value > 15) return "bg-primary/50";
  if (value > 0) return "bg-primary/20";
  return "bg-muted/30";
}

/** Live overlay for “who is tracking time now”; aligns with local calendar day / hour. */
export type LiveRhythmOverlayState = {
  dayLabel: string | null;
  hour: number | null;
  sessions: ActiveWorkSessionItem[];
  loading: boolean;
  error: boolean;
  /** Explains why the live chip may be hidden (e.g. wrong project, weekend). */
  infoBanner?: string | null;
};

const LIVE_AVATAR_MAX = 3;
const HOURS_PER_PAGE = 11;
const MIN_HOUR = 0;
const MAX_HOUR = 23;

function isPausedSession(status: string | null | undefined): boolean {
  return String(status ?? "").toUpperCase() === "PAUSED";
}

export type ProductivityRhythmHeatmapCardProps = {
  reduceMotion: boolean;
  effectiveRole: string;
  isProjectPM: boolean;
  hasProjectSelected: boolean;
  user: { id?: number | string } | null | undefined;
  rhythmMember: string;
  onRhythmMemberChange: (value: string) => void;
  rhythmProjectMembers: Member[];
  rhythmLoading: boolean;
  rhythmError: boolean;
  rhythmChartData: Record<string, string | number>[];
  /** When set, shows active-session avatars on today’s hour cell (PM: team; developer: own session via GET /work-sessions/active). */
  liveRhythmOverlay?: LiveRhythmOverlayState;
};

export function ProductivityRhythmHeatmapCard({
  reduceMotion,
  effectiveRole,
  isProjectPM,
  hasProjectSelected,
  user,
  rhythmMember,
  onRhythmMemberChange,
  rhythmProjectMembers,
  rhythmLoading,
  rhythmError,
  rhythmChartData,
  liveRhythmOverlay,
}: ProductivityRhythmHeatmapCardProps) {
  const [detailSession, setDetailSession] = useState<ActiveWorkSessionItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [hourPageStart, setHourPageStart] = useState(8);
  const visibleHours = Array.from({ length: HOURS_PER_PAGE }, (_, i) => hourPageStart + i).filter(
    (h) => h >= MIN_HOUR && h <= MAX_HOUR,
  );
  const canShiftLeft = hourPageStart > MIN_HOUR;
  const canShiftRight = hourPageStart + HOURS_PER_PAGE - 1 < MAX_HOUR;

  /** Keep the hour strip scrolled so "now" is visible when showing live session avatars. */
  useEffect(() => {
    const h = liveRhythmOverlay?.hour;
    if (h == null) return;
    setHourPageStart((start) => {
      const windowEnd = start + HOURS_PER_PAGE - 1;
      if (h >= start && h <= windowEnd) return start;
      const centered = h - Math.floor(HOURS_PER_PAGE / 2);
      return Math.max(MIN_HOUR, Math.min(MAX_HOUR - HOURS_PER_PAGE + 1, centered));
    });
  }, [liveRhythmOverlay?.hour]);

  const openDetail = (s: ActiveWorkSessionItem) => {
    setDetailSession(s);
    setDetailOpen(true);
  };

  const onDetailOpenChange = (open: boolean) => {
    setDetailOpen(open);
    if (!open) setDetailSession(null);
  };

  return (
    <div className="grid grid-cols-1 gap-6 mb-6" data-tour="productivity-rhythm-heatmap">
      <ActiveWorkSessionDetailDialog open={detailOpen} onOpenChange={onDetailOpenChange} session={detailSession} />
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.25, delay: reduceMotion ? 0 : 0.2 }}
        className="bg-card border border-border rounded-lg p-6"
      >
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="mb-1">
              {effectiveRole === "Developer" ? "My Productivity Rhythm" : "Team Productivity Rhythm"}
            </h3>
            <p className="text-sm text-muted-foreground">Active minutes by hour block</p>
            {liveRhythmOverlay?.infoBanner ? (
              <p
                className="mt-2 max-w-xl rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
                role="status"
              >
                {liveRhythmOverlay.infoBanner}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-4">
            {isProjectPM && (
              <Select value={rhythmMember} onValueChange={onRhythmMemberChange}>
                <SelectTrigger className="w-[180px] h-8 text-xs border-border bg-card">
                  <SelectValue placeholder="Filter member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members (Collective)</SelectItem>
                  {rhythmProjectMembers.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center text-xs space-x-2 text-muted-foreground">
              <button
                type="button"
                className="rounded px-1 py-0.5 border border-border disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setHourPageStart((x) => Math.max(MIN_HOUR, x - HOURS_PER_PAGE))}
                disabled={!canShiftLeft}
                aria-label="Show earlier hour blocks"
              >
                Less
              </button>
              <div className="w-3 h-3 rounded-sm bg-muted/30" />
              <div className="w-3 h-3 rounded-sm bg-primary/20" />
              <div className="w-3 h-3 rounded-sm bg-primary/50" />
              <div className="w-3 h-3 rounded-sm bg-primary/80" />
              <div className="w-3 h-3 rounded-sm bg-primary" />
              <button
                type="button"
                className="rounded px-1 py-0.5 border border-border disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setHourPageStart((x) => Math.min(MAX_HOUR - HOURS_PER_PAGE + 1, x + HOURS_PER_PAGE))}
                disabled={!canShiftRight}
                aria-label="Show later hour blocks"
              >
                More
              </button>
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="flex mb-2 ml-[40px]">
              {visibleHours.map((hour) => (
                <div key={hour} className="flex-1 text-center text-xs text-muted-foreground">
                  {hour}:00
                </div>
              ))}
            </div>

            {(effectiveRole === "Developer" && !user?.id) || (isProjectPM && !hasProjectSelected) ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                {isProjectPM ? "Select a project to view rhythm" : "Sign in to view your rhythm"}
              </div>
            ) : rhythmLoading ? (
              <div className="h-[200px] flex flex-col gap-1 ml-[40px]">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-1 h-6">
                    {visibleHours.map((h) => (
                      <Skeleton key={h} className="flex-1 rounded-sm" />
                    ))}
                  </div>
                ))}
              </div>
            ) : rhythmError ? (
              <div className="h-[200px] flex items-center justify-center text-destructive text-sm">
                Failed to load rhythm
              </div>
            ) : isProjectPM && rhythmMember === "all" && rhythmProjectMembers.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No members in this project
              </div>
            ) : rhythmChartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No rhythm data yet
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {rhythmChartData.map((dayRow, idx) => (
                  <div key={idx} className="flex items-center">
                    <div className="w-[40px] text-xs font-medium text-muted-foreground">{dayRow.day}</div>
                    <div className="flex-1 flex gap-1">
                      {visibleHours.map((hour) => {
                        const isLiveSlot =
                          liveRhythmOverlay != null &&
                          liveRhythmOverlay.dayLabel === dayRow.day &&
                          liveRhythmOverlay.hour === hour;
                        const liveSessions = isLiveSlot ? liveRhythmOverlay.sessions : [];
                        const mins = Number(dayRow[`hour${hour}`] ?? 0);
                        const displayMins = liveSessions.length > 0 ? Math.max(mins, 15) : mins;
                        const liveLoading =
                          isLiveSlot && liveRhythmOverlay.loading && liveSessions.length === 0;
                        const liveError = isLiveSlot && liveRhythmOverlay.error && !liveRhythmOverlay.loading;
                        const overflow = Math.max(0, liveSessions.length - LIVE_AVATAR_MAX);
                        const visible = liveSessions.slice(0, LIVE_AVATAR_MAX);

                        return (
                          <div
                            key={hour}
                            className="relative flex min-w-0 flex-1 aspect-square"
                            title={`${dayRow.day} ${hour}:00 — ${displayMins} mins logged${liveSessions.length > 0 ? " (includes live presence)" : " (historical)"}`}
                          >
                            <div
                              className={`absolute inset-0 rounded-sm ${getHeatmapColor(displayMins)}`}
                              aria-hidden
                            />
                            {liveLoading ? (
                              <div
                                className="absolute inset-0 flex items-end justify-center pb-0.5"
                                aria-busy="true"
                                aria-label="Loading active team sessions"
                              >
                                <Skeleton className="h-4 w-9 rounded-full" />
                              </div>
                            ) : null}
                            {liveError && liveSessions.length === 0 ? (
                              <div
                                className="text-destructive absolute inset-0 flex items-end justify-center pb-0.5 text-[9px] leading-none"
                                role="status"
                              >
                                !
                              </div>
                            ) : null}
                            {visible.length > 0 ? (
                              <div
                                className="absolute inset-0 flex items-end justify-end gap-0.5 pb-0.5 pr-0.5"
                                role="group"
                                aria-label={`${liveSessions.length} active in this hour`}
                              >
                                {visible.map((s) => {
                                  const initials = initialsFromActiveSession(s);
                                  const name =
                                    [s.first_name, s.last_name].filter(Boolean).join(" ").trim() ||
                                    s.display_name;
                                  const paused = isPausedSession(s.status);
                                  return (
                                    <button
                                      key={s.session_id}
                                      type="button"
                                      className={`flex h-5 min-w-[1.25rem] max-w-[1.25rem] cursor-pointer items-center justify-center rounded-full text-[8px] font-semibold text-white shadow-sm ring-1 ring-black/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${paused ? "opacity-70 ring-amber-400/70" : "hover:opacity-90"}`}
                                      style={{ backgroundColor: memberAvatarBackground(s.user_id) }}
                                      aria-label={`Open session details for ${name} (${paused ? "paused" : "active"})`}
                                      onClick={() => openDetail(s)}
                                    >
                                      <span className="leading-none">{initials}</span>
                                    </button>
                                  );
                                })}
                                {overflow > 0 ? (
                                  <span
                                    className="bg-muted text-muted-foreground flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-0.5 text-[8px] font-semibold ring-1 ring-border"
                                    title={`${overflow} more`}
                                    aria-label={`${overflow} more active users`}
                                  >
                                    +{overflow}
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
