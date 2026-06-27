import { useMemo } from "react";
import { Link } from "react-router";
import {
  ArrowRightLeft,
  AtSign,
  BellOff,
  ExternalLink,
  GitCommit,
  Loader2,
} from "lucide-react";

import {
  formatActivityRow,
  formatRelativeShort,
} from "@/lib/notificationActivity";
import type { WelcomeRecentActivityFeedItem } from "@/lib/welcomeRecentActivityFeed";
import { cn } from "@/app/components/ui/utils";

export type NotificationsPanelScope =
  | { kind: "project"; projectId: number; viewAllHref: string }
  | {
      kind: "milestone";
      projectId: number;
      milestoneId: string;
      viewAllHref: string;
    };

/** A prepared @mention notification row (internal deep-link). */
export type MentionNotificationRow = {
  key: string;
  /** Primary line, e.g. "Author mentioned you". */
  title: string;
  /** Secondary line — the comment excerpt. */
  subtitle: string;
  createdAt: string;
  /** In-app (react-router) path to the comment. */
  href: string;
};

type Props = {
  scope: NotificationsPanelScope;
  items: readonly WelcomeRecentActivityFeedItem[];
  /** @mention notifications, newest first (shown above recent activity). */
  mentions?: readonly MentionNotificationRow[];
  isLoading: boolean;
  isError: boolean;
  /** ISO timestamp of the user's last bell-open. Items strictly newer get a dot. */
  lastSeenAt: string | null;
  onViewAllClick?: () => void;
  /** Called when an internal deep-link is clicked (e.g. to close the popover). */
  onMentionClick?: () => void;
};

export function NotificationsPanel({
  scope,
  items,
  mentions,
  isLoading,
  isError,
  lastSeenAt,
  onViewAllClick,
  onMentionClick,
}: Props) {
  const subtitle = scope.kind === "project" ? "Project activity" : "Sprint activity";

  // Newest first — server returns newest-first already, but we re-sort defensively.
  const sortedRows = useMemo(() => {
    const rows = items.map((item, idx) => ({
      item,
      formatted: formatActivityRow(item, idx),
    }));
    rows.sort((a, b) => (b.formatted.createdAt ?? "").localeCompare(a.formatted.createdAt ?? ""));
    return rows;
  }, [items]);

  const mentionRows = useMemo(() => {
    const rows = [...(mentions ?? [])];
    rows.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    return rows;
  }, [mentions]);

  const isEmpty = sortedRows.length === 0 && mentionRows.length === 0;

  return (
    <div
      className="flex w-[360px] max-w-[92vw] flex-col"
      role="dialog"
      aria-label="Notifications"
    >
      <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex flex-col">
          <p className="font-['Satoshi',sans-serif] text-[14px] font-semibold text-foreground">
            Notifications
          </p>
          <p className="font-['Satoshi',sans-serif] text-[12px] font-medium text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </header>

      {isLoading ? (
        <PanelStatus
          icon={<Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />}
          message="Loading notifications…"
        />
      ) : isError ? (
        <PanelStatus
          icon={<BellOff className="size-5 text-muted-foreground" aria-hidden />}
          message="Couldn't load notifications. Try again later."
        />
      ) : isEmpty ? (
        <PanelStatus
          icon={<BellOff className="size-5 text-muted-foreground" aria-hidden />}
          message="You're all caught up."
        />
      ) : (
        <div className="flex max-h-[360px] flex-col overflow-y-auto">
        {mentionRows.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border" aria-label="Mentions">
            <li className="bg-background px-4 py-1.5">
              <p className="font-['Satoshi',sans-serif] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Mentions
              </p>
            </li>
            {mentionRows.map((m) => {
              const isUnread = lastSeenAt == null || m.createdAt > lastSeenAt;
              return (
                <li
                  key={m.key}
                  className="bg-card transition-colors hover:bg-accent"
                >
                  <Link
                    to={m.href}
                    onClick={onMentionClick}
                    className="block text-inherit no-underline outline-none focus-visible:bg-primary/10"
                  >
                    <article className="flex gap-3 px-4 py-3">
                      <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <AtSign className="size-4 text-primary" strokeWidth={2} aria-hidden />
                        {isUnread ? (
                          <span
                            className="pointer-events-none absolute -left-1 top-1/2 -translate-y-1/2 size-2 rounded-full bg-primary ring-2 ring-card"
                            aria-hidden
                          />
                        ) : null}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <p
                          className={cn(
                            "truncate font-['Satoshi',sans-serif] text-[13px] leading-snug",
                            isUnread
                              ? "font-semibold text-foreground"
                              : "font-medium text-foreground",
                          )}
                          title={m.title}
                        >
                          {m.title}
                        </p>
                        <p
                          className="truncate font-['Satoshi',sans-serif] text-[12px] font-normal leading-snug text-muted-foreground"
                          title={m.subtitle}
                        >
                          {m.subtitle}
                        </p>
                        <p className="mt-0.5 font-['Satoshi',sans-serif] text-[11px] font-medium text-muted-foreground">
                          {formatRelativeShort(m.createdAt)}
                        </p>
                      </div>
                    </article>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
        {sortedRows.length > 0 ? (
        <ul
          className="flex flex-col divide-y divide-border"
          aria-label="Recent notifications"
        >
          {mentionRows.length > 0 ? (
            <li className="bg-background px-4 py-1.5">
              <p className="font-['Satoshi',sans-serif] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Recent activity
              </p>
            </li>
          ) : null}
          {sortedRows.map(({ formatted }) => {
            const isUnread = lastSeenAt == null || formatted.createdAt > lastSeenAt;
            const Row = (
              <article className="flex gap-3 px-4 py-3">
                <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  {formatted.icon === "commit" ? (
                    <GitCommit className="size-4 text-muted-foreground" strokeWidth={2} aria-hidden />
                  ) : (
                    <ArrowRightLeft className="size-4 text-muted-foreground" strokeWidth={2} aria-hidden />
                  )}
                  {isUnread ? (
                    <span
                      className="pointer-events-none absolute -left-1 top-1/2 -translate-y-1/2 size-2 rounded-full bg-primary ring-2 ring-card"
                      aria-hidden
                    />
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p
                    className={cn(
                      "truncate font-['Satoshi',sans-serif] text-[13px] leading-snug",
                      isUnread ? "font-semibold text-foreground" : "font-medium text-foreground",
                    )}
                    title={formatted.title}
                  >
                    {formatted.title}
                  </p>
                  <p
                    className="truncate font-['Satoshi',sans-serif] text-[12px] font-normal leading-snug text-muted-foreground"
                    title={formatted.subtitle}
                  >
                    {formatted.subtitle}
                  </p>
                  <p className="mt-0.5 font-['Satoshi',sans-serif] text-[11px] font-medium text-muted-foreground">
                    {formatRelativeShort(formatted.createdAt)}
                  </p>
                </div>
                {formatted.href ? (
                  <ExternalLink
                    className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                    strokeWidth={2}
                    aria-hidden
                  />
                ) : null}
              </article>
            );

            if (formatted.href) {
              return (
                <li key={formatted.key} className="bg-card transition-colors hover:bg-accent">
                  <a
                    href={formatted.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-inherit no-underline outline-none focus-visible:bg-primary/10"
                  >
                    {Row}
                  </a>
                </li>
              );
            }
            return (
              <li key={formatted.key} className="bg-card">
                {Row}
              </li>
            );
          })}
        </ul>
        ) : null}
        </div>
      )}

      <footer className="border-t border-border px-4 py-2">
        <Link
          to={scope.viewAllHref}
          onClick={onViewAllClick}
          className="block w-full rounded-[6px] py-1.5 text-center font-['Satoshi',sans-serif] text-[12px] font-semibold text-primary no-underline outline-none transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring"
        >
          View all activity
        </Link>
      </footer>
    </div>
  );
}

function PanelStatus({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-8">
      <div className="flex size-10 items-center justify-center rounded-full bg-card">
        {icon}
      </div>
      <p className="text-center font-['Satoshi',sans-serif] text-[12px] font-medium text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
