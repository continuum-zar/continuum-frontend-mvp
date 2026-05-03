/**
 * Task detail keeps checklist rows in local React state while edits are debounced.
 * Do not overwrite that local state from a refetched `task` while a save is pending
 * or in flight — the server snapshot can lag and causes checkboxes to tick then untick.
 */
export function shouldPauseTaskDetailChecklistSyncFromServer(args: {
  debounceTimerActive: boolean;
  awaitingDebouncedPayload: boolean;
  checklistSaveInFlight: boolean;
}): boolean {
  return (
    args.debounceTimerActive ||
    args.awaitingDebouncedPayload ||
    args.checklistSaveInFlight
  );
}
