/**
 * TanStack Query (v5) timing presets for Continuum.
 *
 * Use these instead of scattering `staleTime` / `gcTime` literals so high-traffic
 * resources (tasks, projects, time data) stay consistent and easier to tune.
 *
 * - **staleTime**: duration where cached data is treated as fresh (no background refetch).
 * - **gcTime** (formerly cacheTime): how long inactive query data remains in memory after unmount.
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults
 */

/** App-wide defaults — see `main.tsx` `QueryClient` `defaultOptions.queries`. */
export const DEFAULT_STALE_MS = 60_000;
export const DEFAULT_GC_MS = 15 * 60_000;

/** Longer retention for navigational lists so back/forward does not refetch immediately. */
export const LONG_GC_MS = 30 * 60_000;

/** Project list, members, clients, repos, MCP metadata — changes infrequently. */
export const STALE_REFERENCE_MS = 5 * 60_000;

/** Dashboard aggregates, burndown, velocity, classification — moderate churn. */
export const STALE_MODERATE_MS = 2 * 60_000;

/** Board / dropdown task lists (`fetchProjectTasks`, `fetchAllTasks`). */
export const STALE_TASK_LIST_MS = 2 * 60_000;

/** Assigned-to-me / created-by-me lists — active but not real-time. */
export const STALE_ASSIGNED_LIST_MS = 90_000;

/** Single task detail — shared with board prefetch (`TASK_DETAIL_STALE_MS`). */
export const TASK_DETAIL_STALE_MS = 90_000;

/** Logged hours, user hours API, invoice modal aggregates. */
export const STALE_TIME_DATA_MS = 60_000;

/** Short TTL for widgets that should feel responsive (welcome demo, member drill-down). */
export const STALE_SHORT_MS = 45_000;

/**
 * Wiki repo scan: TanStack Query `refetchInterval` while `is_scanning` is true (see `useWikiScanStatus`).
 * When server push is available, replace this with WebSocket or SSE-driven invalidation and drop the interval.
 */
export const WIKI_SCAN_POLL_MS = 5_000;

/** RAG indexing progress while project query may be embedding (`GET /indexing/progress`). */
export const INDEXING_PROGRESS_POLL_MS = 4_000;

/**
 * Candidates for future WebSocket / SSE (push invalidation instead of polling):
 * - Wiki repository scan status (`useWikiScanStatus`) — progress while indexing
 * - Welcome “Recent activity” git feed — if live commit stream becomes a product requirement
 */
