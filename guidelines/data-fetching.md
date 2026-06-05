# Data fetching patterns

This is a status snapshot of the TanStack Query (React Query) migration
(Continuum #1299, part of the railway-scaling initiative) and the guidelines for
new features.

## State as of 2026-05-31

- **TanStack Query is the default.** `@tanstack/react-query` v5 is installed and a
  `QueryClient` with documented defaults is mounted at the app root in
  `src/main.tsx`. All read-heavy data fetching uses `useQuery` / `useInfiniteQuery`
  / `useMutation` hooks defined in `src/api/`.
- Direct `api.get/post/put/delete` calls outside `src/api/` are deliberately
  rare and limited to **imperative side-effects** that don't fit a query
  lifecycle: login/register/logout in `authStore.ts`, the OAuth-return handler
  in `McpOAuth.tsx`, and the planner lock-meta util in `plannerLockMeta.ts`.
  Don't grow this list without a specific reason.
- **Query-key conventions** live next to the hooks. Each domain module exposes a
  `<domain>Keys` object (e.g. `projectKeys`, `taskKeys`) with stable key
  factories so callers can invalidate consistently.

## Realtime → query invalidation

SSE streams (`task-events`, `presence-events`, `agent-runs`, deployment events)
do **not** push data into components. They invalidate the relevant TanStack Query
keys so the next refetch reads fresh data through the normal path.

Pattern (inline in the SSE consumer):

```ts
const onMessage = (ev: MessageEvent<string>) => {
  const data = JSON.parse(ev.data) as { type?: string; project_id?: number };
  if (data.type === "task_updated" && Number(data.project_id) === projectId) {
    void queryClient.invalidateQueries({ queryKey: projectKeys.tasks(projectId) });
    void queryClient.invalidateQueries({ queryKey: projectKeys.tasksInfinite(projectId) });
  }
};
```

Reference sites: `GetStartedKanbanLive.tsx` (task events) and `Dashboard.tsx`
(presence events). The presence handler invalidates two keys
(`project-active-work-sessions` and `my-active-work-session`) — invalidate
**every** key whose data the event could change, not just the most obvious one.

## When to add a new query hook

1. Find the right domain file in `src/api/` (or create one) and export the
   query/mutation hook there. The hook file owns the URL, the query key, and
   the response transformer in one place.
2. Pick `staleTime` per-query if the global default doesn't fit. The default
   is conservative — long-lived reference data can safely set `staleTime:
   Infinity` and rely on explicit invalidation.
3. For paginated lists, use `useInfiniteQuery` with cursor-based pagination
   (see `projectKeys.tasksInfinite`). Don't use offset pagination — it
   double-counts under concurrent inserts.
4. If a realtime event can change the data, wire an invalidation in the
   relevant SSE consumer and reference the same query key.

## Migration sunset

The four imperative direct-axios call sites above are intentionally **not**
migrated to `useMutation` because they're invoked from non-React contexts
(zustand actions, OAuth redirect handlers). Re-evaluating them is out of scope
for #1299 and would be a separate refactor.

## See also

- `backend/docs/scaling-audit.md` — backend statelessness audit (Continuum #1302).
- `backend/docs/DEPLOYMENT_CONCURRENCY.md` — DB pool sizing + APScheduler patterns.
