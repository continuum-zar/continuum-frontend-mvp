import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { TaskOption } from "@/api/tasks";
import {
  TIME_RECORDING_STORAGE_KEY,
  sanitizePersistedTimerSlice,
  type PersistedTimerFields,
} from "@/lib/timeRecordingTimerStorage";

export type TimerLogPrefill = {
  taskId: string;
  projectId: number;
  /** Decimal hours as string, e.g. "1.25" */
  hours: string;
};

/** Elapsed ms for the open recording session (0 if idle). */
export function getRecordingElapsedMs(state: {
  isRecording: boolean;
  isPaused: boolean;
  startedAtMs: number | null;
  accumulatedMs: number;
}): number {
  if (!state.isRecording) return 0;
  if (state.isPaused || state.startedAtMs == null) {
    return Math.max(0, state.accumulatedMs);
  }
  return Math.max(0, state.accumulatedMs + (Date.now() - state.startedAtMs));
}

type TimeRecordingState = {
  /** Task chosen for the next recording (or current session). */
  selectedTask: TaskOption | null;
  /** True while a session is open (running or paused). */
  isRecording: boolean;
  isPaused: boolean;
  /** Wall time when the current running segment began; null while paused. */
  startedAtMs: number | null;
  /** Elapsed ms from completed segments; while running, add `now - startedAtMs`. */
  accumulatedMs: number;
  /** Log Time modal visibility + context */
  logModalOpen: boolean;
  /** Prefill when stopping the timer */
  timerPrefill: TimerLogPrefill | null;
  /** When opening Log Time from the header (no timer), which project scopes the task list */
  manualLogProjectId: number | null;

  setSelectedTask: (task: TaskOption | null) => void;
  /** Returns false if no task selected */
  startRecording: () => boolean;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecordingOpenLogModal: () => void;
  openLogModalManual: (projectId: number | null) => void;
  closeLogModal: () => void;
  setLogModalOpen: (open: boolean) => void;
};

function applyPersistedTimerFields(
  current: TimeRecordingState,
  patch: PersistedTimerFields,
): TimeRecordingState {
  return {
    ...current,
    selectedTask: patch.selectedTask,
    isRecording: patch.isRecording,
    isPaused: patch.isPaused,
    startedAtMs: patch.startedAtMs,
    accumulatedMs: patch.accumulatedMs,
  };
}

function elapsedMsToHoursString(elapsedMs: number): string {
  const elapsedSec = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.max(elapsedSec / 3600, 0.01);
  return hours < 10 ? hours.toFixed(2) : hours.toFixed(1);
}

export const useTimeRecordingStore = create<TimeRecordingState>()(
  persist(
    (set, get) => ({
      selectedTask: null,
      isRecording: false,
      isPaused: false,
      startedAtMs: null,
      accumulatedMs: 0,
      logModalOpen: false,
      timerPrefill: null,
      manualLogProjectId: null,

      setSelectedTask: (task) => set({ selectedTask: task }),

      startRecording: () => {
        const { selectedTask, isRecording, isPaused } = get();
        if (!selectedTask) return false;
        if (isRecording && isPaused) {
          set({ isPaused: false, startedAtMs: Date.now() });
          return true;
        }
        if (isRecording) return true;
        set({
          isRecording: true,
          isPaused: false,
          startedAtMs: Date.now(),
          accumulatedMs: 0,
        });
        return true;
      },

      pauseRecording: () => {
        const { isRecording, isPaused, startedAtMs, accumulatedMs } = get();
        if (!isRecording || isPaused || startedAtMs == null) return;
        set({
          isPaused: true,
          startedAtMs: null,
          accumulatedMs: accumulatedMs + (Date.now() - startedAtMs),
        });
      },

      resumeRecording: () => {
        const { isRecording, isPaused } = get();
        if (!isRecording || !isPaused) return;
        set({ isPaused: false, startedAtMs: Date.now() });
      },

      stopRecordingOpenLogModal: () => {
        const { isRecording, selectedTask } = get();
        if (!isRecording || !selectedTask) {
          set({
            isRecording: false,
            isPaused: false,
            startedAtMs: null,
            accumulatedMs: 0,
          });
          return;
        }
        const elapsedMs = getRecordingElapsedMs(get());
        const hoursStr = elapsedMsToHoursString(elapsedMs);
        set({
          isRecording: false,
          isPaused: false,
          startedAtMs: null,
          accumulatedMs: 0,
          logModalOpen: true,
          timerPrefill: {
            taskId: selectedTask.id,
            projectId: selectedTask.project_id,
            hours: hoursStr,
          },
          manualLogProjectId: null,
        });
      },

      openLogModalManual: (projectId) => {
        set({
          logModalOpen: true,
          timerPrefill: null,
          manualLogProjectId: projectId,
        });
      },

      closeLogModal: () => {
        set({
          logModalOpen: false,
          timerPrefill: null,
          manualLogProjectId: null,
        });
      },

      setLogModalOpen: (open) => {
        if (!open) {
          get().closeLogModal();
        } else {
          set({ logModalOpen: true });
        }
      },
    }),
    {
      name: TIME_RECORDING_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedTask: state.selectedTask,
        isRecording: state.isRecording,
        isPaused: state.isPaused,
        startedAtMs: state.startedAtMs,
        accumulatedMs: state.accumulatedMs,
      }),
      merge: (persistedState, currentState) => {
        const patch = sanitizePersistedTimerSlice(persistedState);
        return applyPersistedTimerFields(currentState, patch);
      },
    },
  ),
);
