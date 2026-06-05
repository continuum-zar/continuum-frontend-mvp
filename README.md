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

## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
