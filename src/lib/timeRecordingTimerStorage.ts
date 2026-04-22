import type { TaskOption } from "@/api/tasks";

/** localStorage key for zustand `persist` on `useTimeRecordingStore` (must match store `name`). */
export const TIME_RECORDING_STORAGE_KEY = "continuum-time-recording";

function isTaskOption(x: unknown): x is TaskOption {
  if (x == null || typeof x !== "object") return false;
  const t = x as Record<string, unknown>;
  return (
    typeof t.id === "string" &&
    typeof t.title === "string" &&
    typeof t.project === "string" &&
    typeof t.project_id === "number" &&
    Number.isFinite(t.project_id)
  );
}

/** Fields we persist for the header/rail timer (see `timeRecordingStore` partialize). */
export type PersistedTimerFields = {
  selectedTask: TaskOption | null;
  isRecording: boolean;
  /** True when a session is open but the clock is frozen (elapsed = `accumulatedMs`). */
  isPaused: boolean;
  startedAtMs: number | null;
  /** Milliseconds counted before the current running segment (and full elapsed while paused). */
  accumulatedMs: number;
};

const emptyTimerFields = (): PersistedTimerFields => ({
  selectedTask: null,
  isRecording: false,
  isPaused: false,
  startedAtMs: null,
  accumulatedMs: 0,
});

/**
 * Normalizes persisted timer slice after JSON parse. Drops an invalid “recording” session
 * (e.g. missing start time or task) so the UI resets instead of showing a broken timer.
 */
export function sanitizePersistedTimerSlice(raw: unknown): PersistedTimerFields {
  if (raw == null || typeof raw !== "object") return emptyTimerFields();
  const o = raw as Record<string, unknown>;

  let selectedTask: TaskOption | null = null;
  if (o.selectedTask != null) {
    if (isTaskOption(o.selectedTask)) selectedTask = o.selectedTask;
  }

  const isRecording = o.isRecording === true;
  const isPaused = o.isPaused === true;
  let accumulatedMs =
    typeof o.accumulatedMs === "number" && Number.isFinite(o.accumulatedMs)
      ? Math.max(0, Math.floor(o.accumulatedMs))
      : 0;
  const startedAtMs =
    typeof o.startedAtMs === "number" && Number.isFinite(o.startedAtMs) ? o.startedAtMs : null;

  if (isRecording) {
    if (selectedTask == null) {
      return {
        selectedTask: null,
        isRecording: false,
        isPaused: false,
        startedAtMs: null,
        accumulatedMs: 0,
      };
    }
    if (isPaused) {
      return {
        selectedTask,
        isRecording: true,
        isPaused: true,
        startedAtMs: null,
        accumulatedMs,
      };
    }
    if (startedAtMs != null) {
      return {
        selectedTask,
        isRecording: true,
        isPaused: false,
        startedAtMs,
        accumulatedMs,
      };
    }
    if (accumulatedMs > 0) {
      return {
        selectedTask,
        isRecording: true,
        isPaused: true,
        startedAtMs: null,
        accumulatedMs,
      };
    }
    return {
      selectedTask,
      isRecording: false,
      isPaused: false,
      startedAtMs: null,
      accumulatedMs: 0,
    };
  }

  return {
    selectedTask,
    isRecording: false,
    isPaused: false,
    startedAtMs: null,
    accumulatedMs: 0,
  };
}
