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
      <header className="flex items-start justify-between gap-3 border-b border-[#ebedee] px-4 py-3">
        <div className="flex flex-col">
          <p className="font-['Satoshi',sans-serif] text-[14px] font-semibold text-[#0b191f]">
            Notifications
          </p>
          <p className="font-['Satoshi',sans-serif] text-[12px] font-medium text-[#727d83]">
            {subtitle}
          </p>
        </div>
      </header>

      {isLoading ? (
        <PanelStatus
          icon={<Loader2 className="size-4 animate-spin text-[#606d76]" aria-hidden />}
          message="Loading notifications…"
        />
      ) : isError ? (
        <PanelStatus
          icon={<BellOff className="size-5 text-[#9fa5a8]" aria-hidden />}
          message="Couldn't load notifications. Try again later."
        />
      ) : isEmpty ? (
        <PanelStatus
          icon={<BellOff className="size-5 text-[#9fa5a8]" aria-hidden />}
          message="You're all caught up."
        />
      ) : (
        <div className="flex max-h-[360px] flex-col overflow-y-auto">
        {mentionRows.length > 0 ? (
          <ul className="flex flex-col divide-y divide-[#ebedee]" aria-label="Mentions">
            <li className="bg-[#fafbfc] px-4 py-1.5">
              <p className="font-['Satoshi',sans-serif] text-[11px] font-semibold uppercase tracking-wide text-[#9fa5a8]">
                Mentions
              </p>
            </li>
            {mentionRows.map((m) => {
              const isUnread = lastSeenAt == null || m.createdAt > lastSeenAt;
              return (
                <li
                  key={m.key}
                  className="bg-white transition-colors hover:bg-[#f7f8f9]"
                >
                  <Link
                    to={m.href}
                    onClick={onMentionClick}
                    className="block text-inherit no-underline outline-none focus-visible:bg-[#f0f4ff]"
                  >
                    <article className="flex gap-3 px-4 py-3">
                      <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-[#eef4ff]">
                        <AtSign className="size-4 text-[#1466ff]" strokeWidth={2} aria-hidden />
                        {isUnread ? (
                          <span
                            className="pointer-events-none absolute -left-1 top-1/2 -translate-y-1/2 size-2 rounded-full bg-[#1466ff] ring-2 ring-white"
                            aria-hidden
                          />
                        ) : null}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <p
                          className={cn(
                            "truncate font-['Satoshi',sans-serif] text-[13px] leading-snug",
                            isUnread
                              ? "font-semibold text-[#0b191f]"
                              : "font-medium text-[#0b191f]",
                          )}
                          title={m.title}
                        >
                          {m.title}
                        </p>
                        <p
                          className="truncate font-['Satoshi',sans-serif] text-[12px] font-normal leading-snug text-[#727d83]"
                          title={m.subtitle}
                        >
                          {m.subtitle}
                        </p>
                        <p className="mt-0.5 font-['Satoshi',sans-serif] text-[11px] font-medium text-[#9fa5a8]">
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
          className="flex flex-col divide-y divide-[#ebedee]"
          aria-label="Recent notifications"
        >
          {mentionRows.length > 0 ? (
            <li className="bg-[#fafbfc] px-4 py-1.5">
              <p className="font-['Satoshi',sans-serif] text-[11px] font-semibold uppercase tracking-wide text-[#9fa5a8]">
                Recent activity
              </p>
            </li>
          ) : null}
          {sortedRows.map(({ formatted }) => {
            const isUnread = lastSeenAt == null || formatted.createdAt > lastSeenAt;
            const Row = (
              <article className="flex gap-3 px-4 py-3">
                <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-[#edf0f3]">
                  {formatted.icon === "commit" ? (
                    <GitCommit className="size-4 text-[#606d76]" strokeWidth={2} aria-hidden />
                  ) : (
                    <ArrowRightLeft className="size-4 text-[#606d76]" strokeWidth={2} aria-hidden />
                  )}
                  {isUnread ? (
                    <span
                      className="pointer-events-none absolute -left-1 top-1/2 -translate-y-1/2 size-2 rounded-full bg-[#1466ff] ring-2 ring-white"
                      aria-hidden
                    />
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p
                    className={cn(
                      "truncate font-['Satoshi',sans-serif] text-[13px] leading-snug",
                      isUnread ? "font-semibold text-[#0b191f]" : "font-medium text-[#0b191f]",
                    )}
                    title={formatted.title}
                  >
                    {formatted.title}
                  </p>
                  <p
                    className="truncate font-['Satoshi',sans-serif] text-[12px] font-normal leading-snug text-[#727d83]"
                    title={formatted.subtitle}
                  >
                    {formatted.subtitle}
                  </p>
                  <p className="mt-0.5 font-['Satoshi',sans-serif] text-[11px] font-medium text-[#9fa5a8]">
                    {formatRelativeShort(formatted.createdAt)}
                  </p>
                </div>
                {formatted.href ? (
                  <ExternalLink
                    className="mt-0.5 size-3.5 shrink-0 text-[#9fa5a8]"
                    strokeWidth={2}
                    aria-hidden
                  />
                ) : null}
              </article>
            );

            if (formatted.href) {
              return (
                <li key={formatted.key} className="bg-white transition-colors hover:bg-[#f7f8f9]">
                  <a
                    href={formatted.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-inherit no-underline outline-none focus-visible:bg-[#f0f4ff]"
                  >
                    {Row}
                  </a>
                </li>
              );
            }
            return (
              <li key={formatted.key} className="bg-white">
                {Row}
              </li>
            );
          })}
        </ul>
        ) : null}
        </div>
      )}

      <footer className="border-t border-[#ebedee] px-4 py-2">
        <Link
          to={scope.viewAllHref}
          onClick={onViewAllClick}
          className="block w-full rounded-[6px] py-1.5 text-center font-['Satoshi',sans-serif] text-[12px] font-semibold text-[#1466ff] no-underline outline-none transition-colors hover:bg-[#f0f4ff] focus-visible:ring-2 focus-visible:ring-ring"
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
      <div className="flex size-10 items-center justify-center rounded-full bg-[#f7f8f9]">
        {icon}
      </div>
      <p className="text-center font-['Satoshi',sans-serif] text-[12px] font-medium text-[#606d76]">
        {message}
      </p>
    </div>
  );
}
