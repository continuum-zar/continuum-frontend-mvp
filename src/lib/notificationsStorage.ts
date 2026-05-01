/**
 * Per-(user, project[, milestone]) "last seen at" cursor for the in-app notifications bell.
 *
 * Stored in `localStorage` so the unread badge survives reloads on the same device.
 * Cross-tab consistency uses the native `storage` event; same-tab updates use an
 * in-memory broadcaster so React subscribers re-render after `writeLastSeenAt`.
 *
 * Frontend-only by design — no backend coupling.
 */

import { useSyncExternalStore } from "react";

const STORAGE_PREFIX = "continuum:notif";

export type NotificationScope =
  | { kind: "project"; userId: string; projectId: number }
  | {
      kind: "milestone";
      userId: string;
      projectId: number;
      milestoneId: string;
    };

export function scopeKey(scope: NotificationScope): string {
  const base = `${STORAGE_PREFIX}:u:${encodeURIComponent(scope.userId)}:p:${scope.projectId}`;
  return scope.kind === "milestone"
    ? `${base}:m:${encodeURIComponent(scope.milestoneId)}`
    : base;
}

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const sameTabListeners = new Map<string, Set<() => void>>();

function notifySameTab(key: string): void {
  const set = sameTabListeners.get(key);
  if (!set) return;
  for (const cb of Array.from(set)) {
    try {
      cb();
    } catch {
      /* listener errors must not break others */
    }
  }
}

export function readLastSeenAt(scope: NotificationScope): string | null {
  const ls = safeStorage();
  if (!ls) return null;
  try {
    return ls.getItem(scopeKey(scope));
  } catch {
    return null;
  }
}

export function writeLastSeenAt(scope: NotificationScope, iso: string): void {
  const ls = safeStorage();
  if (!ls) return;
  const key = scopeKey(scope);
  try {
    const prev = ls.getItem(key);
    if (prev != null && prev >= iso) return;
    ls.setItem(key, iso);
    notifySameTab(key);
  } catch {
    /* ignore — quota or privacy mode */
  }
}

function subscribe(key: string, listener: () => void): () => void {
  let bucket = sameTabListeners.get(key);
  if (!bucket) {
    bucket = new Set();
    sameTabListeners.set(key, bucket);
  }
  bucket.add(listener);

  const onStorage =
    typeof window === "undefined"
      ? null
      : (e: StorageEvent) => {
          if (e.key === key) listener();
        };
  if (onStorage) window.addEventListener("storage", onStorage);

  return () => {
    bucket?.delete(listener);
    if (bucket && bucket.size === 0) sameTabListeners.delete(key);
    if (onStorage) window.removeEventListener("storage", onStorage);
  };
}

/** Subscribe to a single scope's `lastSeenAt` value (cross-tab + same-tab). */
export function subscribeToLastSeenAt(
  scope: NotificationScope,
  listener: () => void,
): () => void {
  return subscribe(scopeKey(scope), listener);
}

/**
 * React snapshot hook for a scope's lastSeenAt. Reflects updates from this tab
 * (after `writeLastSeenAt`) and from other tabs (via the `storage` event).
 */
export function useLastSeenAt(scope: NotificationScope | null): string | null {
  const sub = (cb: () => void) => {
    if (scope == null) return () => {};
    return subscribeToLastSeenAt(scope, cb);
  };
  const getSnapshot = () => (scope == null ? null : readLastSeenAt(scope));
  return useSyncExternalStore(sub, getSnapshot, () => null);
}
