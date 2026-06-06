# Continuum MVP

Frontend for the Continuum project management dashboard. Connects to the backend at `http://localhost:8001/api`.

## Tasks and attachments

- **Create task:** Use the Create Task flow; there is no attachment upload on the create form.
- **Add attachments:** After a task is created, you are redirected to the task detail page. Add attachments there (task detail implements attachment upload).

## Optimistic UI for task checklists

Checklist edits on an existing task (toggle, add, rename, reorder) update the rendered list in `TaskDetail` immediately and persist via a debounced `PUT /tasks/:id`. The shared mutation `useUpdateTask` (`src/api/hooks.ts`) handles the optimistic path:

- `onMutate` snapshots the task detail and patches the cache via `optimisticApplyChecklists`, so kanban/list cards reflect the new completion counts right away.
- `onError` restores the snapshot via `restoreTaskCachesFromSnapshot` and surfaces a checklist-specific toast ("Couldn't save checklist changes. Reverted to last saved state.").
- `TaskDetail` keeps the locally-rendered checklist in its own state behind a debounce; it reverts that state from `checklistBaselineRef` / `sectionsBaselineRef` (the last server-confirmed value) when the mutation rejects, so the UI does not drift after the cache rolls back.

`CreateTaskLiveModal` / `CreateTaskModal` work on a draft task that is not yet persisted — their checklists are local form state and are only saved when the user submits the create action, so they don't need the optimistic/rollback dance.

## Authentication (Clerk + legacy fallback)

Continuum's frontend speaks two auth backends, gated by env var:

- **Clerk (Google + Apple social login).** Set `VITE_CLERK_PUBLISHABLE_KEY` and the app mounts `ClerkProvider`, swaps `/login` and `/register` to Clerk's `<SignIn />` / `<SignUp />`, and uses Clerk-issued JWTs for every API request. Configure Google + Apple inside the Clerk dashboard (the components show whichever providers are enabled there). Optional: `VITE_CLERK_JWT_TEMPLATE` selects a JWT template if you've created one in Clerk to shape the bearer token the backend receives.
- **Legacy email/password.** When `VITE_CLERK_PUBLISHABLE_KEY` is unset (default on a fresh checkout), the app falls back to the original `useAuthStore`-backed flow — the same forms and refresh-token dance that shipped before Clerk.

How the bridge works:

- `src/lib/clerkConfig.ts` reads the env vars once and exposes `isClerkEnabled`.
- `src/main.tsx` conditionally wraps the tree in `<ClerkProvider>`.
- `src/app/components/auth/ClerkSessionBridge.tsx` mirrors Clerk's session into the existing `useAuthStore`, so `AuthGuard`, query hooks, and the rest of the codebase keep reading a single auth contract.
- `src/lib/api.ts`'s axios request interceptor prefers `Clerk.session.getToken(...)` when Clerk is enabled and falls back to the legacy localStorage token otherwise. The 401 retry path mints a fresh Clerk token instead of calling `/auth/refresh-token`.

Backend expectations: the backend (`continuum-backend`) accepts Clerk JWTs when `CLERK_JWT_ISSUER` / `CLERK_JWT_JWKS_URL` are configured there; see that repo's README for the matching server-side setup.

## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
