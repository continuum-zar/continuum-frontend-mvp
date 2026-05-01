import { useEffect, useMemo, useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { useProjectRecentActivity, useProjectTasks } from "@/api/hooks";
import { useAuthStore } from "@/store/authStore";
import {
  countUnread,
  filterByMilestoneTaskIds,
  latestCreatedAt,
} from "@/lib/notificationActivity";
import {
  type NotificationScope,
  useLastSeenAt,
  writeLastSeenAt,
} from "@/lib/notificationsStorage";
import { projectMainHref } from "@/app/data/dashboardPlaceholderProjects";
import { cn } from "@/app/components/ui/utils";

import { NotificationsPanel } from "./NotificationsPanel";

export type NotificationBellScope =
  | { kind: "project"; projectId: number }
  | { kind: "milestone"; projectId: number; milestoneId: string };

type Props = {
  scope: NotificationBellScope;
  /** Outer button classes — keep parity with the existing header bell styling. */
  className?: string;
  /** Bell glyph (passed in to avoid coupling this component to page-level asset maps). */
  iconSrc: string;
  /** Optional onboarding-tour anchor. */
  "data-tour"?: string;
};

const UNREAD_CAP = 9;

export function NotificationBell({
  scope,
  className,
  iconSrc,
  "data-tour": dataTour,
}: Props) {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const [open, setOpen] = useState(false);

  const scopeKind = scope.kind;
  const scopeProjectId = scope.projectId;
  const scopeMilestoneId = scope.kind === "milestone" ? scope.milestoneId : null;

  const storageScope = useMemo<NotificationScope | null>(() => {
    if (userId == null || userId === "") return null;
    if (scopeKind === "project") {
      return { kind: "project", userId, projectId: scopeProjectId };
    }
    if (scopeMilestoneId == null) return null;
    return {
      kind: "milestone",
      userId,
      projectId: scopeProjectId,
      milestoneId: scopeMilestoneId,
    };
  }, [scopeKind, scopeProjectId, scopeMilestoneId, userId]);

  const lastSeenAt = useLastSeenAt(storageScope);

  const activityQuery = useProjectRecentActivity(scopeProjectId, { limit: 50 });
  // Project-scoped tasks for milestone filtering. Skipped entirely for project scope.
  const tasksQuery = useProjectTasks(
    scopeKind === "milestone" ? scopeProjectId : undefined,
  );

  const milestoneTaskIds = useMemo<Set<number>>(() => {
    if (scopeKind !== "milestone" || scopeMilestoneId == null) return new Set();
    const tasks = tasksQuery.data ?? [];
    const ids = new Set<number>();
    for (const t of tasks) {
      if (t.milestoneId === scopeMilestoneId) {
        const num = Number(t.id);
        if (Number.isFinite(num)) ids.add(num);
      }
    }
    return ids;
  }, [scopeKind, scopeMilestoneId, tasksQuery.data]);

  const filteredItems = useMemo(() => {
    const items = activityQuery.data?.items ?? [];
    if (scopeKind !== "milestone") return items;
    if (tasksQuery.isLoading) return [];
    return filterByMilestoneTaskIds(items, milestoneTaskIds);
  }, [activityQuery.data, scopeKind, tasksQuery.isLoading, milestoneTaskIds]);

  const isLoading =
    activityQuery.isLoading || (scopeKind === "milestone" && tasksQuery.isLoading);
  const isError =
    activityQuery.isError || (scopeKind === "milestone" && tasksQuery.isError);

  const unreadCount = useMemo(() => {
    if (isLoading) return 0;
    return countUnread(filteredItems, lastSeenAt);
  }, [filteredItems, lastSeenAt, isLoading]);

  const unreadLabel =
    unreadCount > UNREAD_CAP ? `${UNREAD_CAP}+` : String(unreadCount);

  // Mark as seen when the popover opens and the data is available. Doing this
  // on open (rather than during typing/hover) avoids prematurely clearing the
  // badge while the user is still triaging a different surface.
  useEffect(() => {
    if (!open) return;
    if (storageScope == null) return;
    const newest = latestCreatedAt(filteredItems);
    if (newest == null) return;
    writeLastSeenAt(storageScope, newest);
  }, [open, filteredItems, storageScope]);

  const viewAllHref = useMemo(
    () => `${projectMainHref(String(scopeProjectId))}#recent-activity`,
    [scopeProjectId],
  );

  const triggerLabel =
    unreadCount === 0
      ? "Notifications"
      : unreadCount === 1
        ? "Notifications, 1 new"
        : `Notifications, ${unreadCount} new`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative outline-none ring-offset-2 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          aria-label={triggerLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
          data-tour={dataTour}
        >
          <div className="relative shrink-0 size-[16px]" data-name="lucide/bell">
            <img alt="" className="absolute block max-w-none size-full" src={iconSrc} />
          </div>
          {unreadCount > 0 && !isLoading ? (
            <span
              className={cn(
                "pointer-events-none absolute -right-1 -top-1 flex min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none text-white shadow-[0_1px_1px_rgba(15,15,31,0.06)]",
                unreadLabel.length > 1 ? "h-[14px]" : "h-4",
              )}
              style={{
                backgroundImage:
                  "linear-gradient(141.68deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%), linear-gradient(90deg, rgb(85, 33, 254) 0%, rgb(85, 33, 254) 100%)",
              }}
              aria-hidden
            >
              {unreadLabel}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="z-[60] w-auto overflow-hidden rounded-[12px] border border-[#ebedee] bg-white p-0 text-[#0b191f] shadow-[0px_44px_12px_0px_rgba(15,15,31,0),0px_28px_11px_0px_rgba(15,15,31,0.01),0px_16px_10px_0px_rgba(15,15,31,0.04),0px_7px_7px_0px_rgba(15,15,31,0.06),0px_2px_4px_0px_rgba(15,15,31,0.08)]"
      >
        <NotificationsPanel
          scope={
            scopeKind === "project" || scopeMilestoneId == null
              ? { kind: "project", projectId: scopeProjectId, viewAllHref }
              : {
                  kind: "milestone",
                  projectId: scopeProjectId,
                  milestoneId: scopeMilestoneId,
                  viewAllHref,
                }
          }
          items={filteredItems}
          isLoading={isLoading}
          isError={isError}
          lastSeenAt={lastSeenAt}
          onViewAllClick={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
