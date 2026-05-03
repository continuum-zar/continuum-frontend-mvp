import { describe, expect, it } from 'vitest';
import { shouldPauseTaskDetailChecklistSyncFromServer } from './taskDetailChecklistSync';

describe('shouldPauseTaskDetailChecklistSyncFromServer', () => {
  it('returns false when nothing pending', () => {
    expect(
      shouldPauseTaskDetailChecklistSyncFromServer({
        debounceTimerActive: false,
        awaitingDebouncedPayload: false,
        checklistSaveInFlight: false,
      }),
    ).toBe(false);
  });

  it('returns true when debounce timer is active', () => {
    expect(
      shouldPauseTaskDetailChecklistSyncFromServer({
        debounceTimerActive: true,
        awaitingDebouncedPayload: false,
        checklistSaveInFlight: false,
      }),
    ).toBe(true);
  });

  it('returns true while payload is queued before debounce fires', () => {
    expect(
      shouldPauseTaskDetailChecklistSyncFromServer({
        debounceTimerActive: false,
        awaitingDebouncedPayload: true,
        checklistSaveInFlight: false,
      }),
    ).toBe(true);
  });

  it('returns true while checklist PUT is in flight', () => {
    expect(
      shouldPauseTaskDetailChecklistSyncFromServer({
        debounceTimerActive: false,
        awaitingDebouncedPayload: false,
        checklistSaveInFlight: true,
      }),
    ).toBe(true);
  });
});
