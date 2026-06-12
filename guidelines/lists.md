# List rendering: pagination and virtualization

Status snapshot for Continuum #1300, part of the railway-scaling initiative.

## State as of 2026-05-31

### Frontend

- **`VirtualList`** (`src/app/components/ui/VirtualList.tsx`, 147 lines) wraps
  `@tanstack/react-virtual`'s `useVirtualizer`. It supports a no-virtualize
  threshold (`DEFAULT_THRESHOLD = 14`), variable row heights via
  `measureElement`, `onEndReached` for infinite scroll, and an optional
  fixed-height fast path for table-like rows.
- **Consumers**: `Dashboard.tsx`, `SprintKanbanListView.tsx`. Both pass long
  task/work-session collections through `VirtualList`.
- **Infinite queries**: three `useInfiniteQuery` hooks live in `src/api/hooks.ts`
  (the per-project task list and two others). They drive optimistic-update
  mutations via `queryClient.setQueryData<InfiniteData<TasksPage>>(...)`.

### Backend

- **Paginated envelope** (`{ data, total, skip, limit }`) is documented in
  `backend/docs/pagination_and_sorting.md` and used by `GET /projects/`,
  `GET /tasks/`, `GET /milestones/`. The migration to TanStack Query's
  `useInfiniteQuery` uses these endpoints with `pageParam = skip`.

## What is *not* virtualized (concrete follow-up candidates)

These are lists that render `items.map(...)` without `VirtualList` and could
exhaust the DOM if the underlying collection grows large. Whether to virtualize
each one is an engineering judgement based on real usage, not a blocker:

- **`GanttChartView.tsx`** (line 96): `tasks.map(...)` renders a row per task
  across the full project. Likely candidate as projects grow past a few dozen
  tasks; needs `VirtualList` with fixed height matching the gantt row.
- **`LogTimeModal.tsx`** (line 328): `filteredTasks.map(...)` in a task picker
  modal. Probably fine — modal-scoped, filtered. Skip unless the user reports
  scroll lag.
- **Comments threads, activity feeds**: walk the comments/feed files; if any
  use plain `.map` without infinite pagination, virtualize.

Use this rule of thumb: virtualize when the worst-case row count is plausibly
≥100 in production. Otherwise leave plain `.map` — virtualization has overhead
and breaks `find-in-page` browser search outside the rendered window.

## Backend: cursor pagination

The current endpoints use offset/limit (`?skip=&limit=`). Offset pagination
double-counts under concurrent inserts — a known nuisance with kanban where new
tasks land mid-scroll. **Adding cursor pagination is out of scope for #1300**:
the migration is non-trivial (route + service + ordering guarantee + frontend
infinite-query adapter), and the current envelope works for MVP-scale data. If
list endpoints start showing wrong "total" or duplicate rows under load, file a
follow-up to introduce `?after_id=` cursor pagination for the affected route.

## When to add a new infinite query

1. Add the hook to `src/api/hooks.ts` next to the related domain.
2. Use `pageParam` to track `skip` (or a cursor when cursor pagination lands).
3. Pair with `VirtualList` + `onEndReached={() => fetchNextPage()}` in the
   consumer.
4. If realtime updates exist, invalidate the matching `*Infinite` query key
   from the SSE consumer (see `guidelines/data-fetching.md`).

## See also

- `guidelines/data-fetching.md` — TanStack Query patterns and realtime bridge.
- `backend/docs/pagination_and_sorting.md` — current paginated envelope shape.
- `backend/docs/scaling-audit.md` — backend statelessness for horizontal scale.
