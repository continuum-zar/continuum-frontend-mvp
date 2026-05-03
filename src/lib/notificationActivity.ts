/**
 * Pure helpers for the in-app notifications bell. Operates on
 * `WelcomeRecentActivityFeedItem`s already returned by the API and adds
 * client-side filtering / formatting that doesn't exist server-side yet.
 */

import { parseApiUtcDateTime } from "@/lib/parseApiUtcDateTime";
import type {
  WelcomeRecentActivityFeedItem,
} from "@/lib/welcomeRecentActivityFeed";

export type NotificationRow = {
  /** Stable key for React lists. */
  key: string;
  /** Visual icon hint; the panel decides which Lucide glyph to render. */
  icon: "commit" | "status";
  /** Primary line: who did what. */
  title: string;
  /** Secondary line: short context (column move, commit summary). */
  subtitle: string;
  /** ISO timestamp from the source item. */
  createdAt: string;
  /** Optional deep-link target — used only when known to be safe. */
  href?: string;
};

/**
 * Keep only items linked to the given milestone's tasks.
 *
 * `task_status` items always carry a `task_id`. `commit` items expose
 * `contribution.task_id`, which is optional — commits without a linked task are
 * excluded from milestone-scoped feeds (they're still shown in project scope).
 */
export function filterByMilestoneTaskIds(
  items: readonly WelcomeRecentActivityFeedItem[],
  milestoneTaskIds: ReadonlySet<number>,
): WelcomeRecentActivityFeedItem[] {
  if (milestoneTaskIds.size === 0) return [];
  const out: WelcomeRecentActivityFeedItem[] = [];
  for (const item of items) {
    if (item.type === "task_status") {
      if (milestoneTaskIds.has(item.task_id)) out.push(item);
      continue;
    }
    const tid = item.contribution?.task_id;
    if (tid != null && milestoneTaskIds.has(tid)) out.push(item);
  }
  return out;
}

/** Number of items strictly newer than `lastSeenAt` (or all items if it's null). */
export function countUnread(
  items: readonly WelcomeRecentActivityFeedItem[],
  lastSeenAt: string | null,
): number {
  if (items.length === 0) return 0;
  if (lastSeenAt == null) return items.length;
  let n = 0;
  for (const item of items) {
    const ts = itemCreatedAt(item);
    if (ts != null && ts > lastSeenAt) n += 1;
  }
  return n;
}

/** Most recent `created_at` across the items, or `null` if the list is empty. */
export function latestCreatedAt(
  items: readonly WelcomeRecentActivityFeedItem[],
): string | null {
  let max: string | null = null;
  for (const item of items) {
    const ts = itemCreatedAt(item);
    if (ts == null) continue;
    if (max == null || ts > max) max = ts;
  }
  return max;
}

function itemCreatedAt(
  item: WelcomeRecentActivityFeedItem,
): string | null {
  if (item.type === "task_status") {
    return item.created_at ?? null;
  }
  return item.contribution?.created_at ?? null;
}

function commitSummary(message: string | null | undefined, hash: string): string {
  const m = (message ?? "").trim();
  if (m.length > 0) {
    const firstLine = m.split(/\r?\n/, 1)[0] ?? m;
    return firstLine.length > 80 ? `${firstLine.slice(0, 79)}…` : firstLine;
  }
  return hash.slice(0, 7);
}

/** Build a UI row for the popover list. Pure — no React, no formatting state. */
export function formatActivityRow(
  item: WelcomeRecentActivityFeedItem,
  index: number,
): NotificationRow {
  if (item.type === "commit") {
    const c = item.contribution;
    const author = c.user_name?.trim() || "Contributor";
    const branch = c.branch?.trim() || "default";
    const summary = commitSummary(c.commit_message, c.commit_hash);
    return {
      key: `commit-${c.id}`,
      icon: "commit",
      title: `${author} pushed to ${branch}`,
      subtitle: summary,
      createdAt: c.created_at,
      ...(c.commit_url ? { href: c.commit_url } : {}),
    };
  }
  const actor = item.user_name?.trim() || "Someone";
  return {
    key: `task-${item.task_id}-${item.created_at}-${index}`,
    icon: "status",
    title: `${actor} moved “${item.task_title}”`,
    subtitle: `${item.from_column} → ${item.to_column}`,
    createdAt: item.created_at,
  };
}

/**
 * Compact relative time used in the popover ("just now", "5m", "2h", "3d", or
 * a `MMM d` fallback for older items). Mirrors the densely-formatted style
 * used by GitHub/Linear-style notification trays.
 */
export function formatRelativeShort(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = parseApiUtcDateTime(iso);
  if (!d) return "";
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return "now";
  const sec = Math.floor(diffMs / 1000);
  if (sec < 45) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  // Older — short calendar label so the tray stays compact.
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
