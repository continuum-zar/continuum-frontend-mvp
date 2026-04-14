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

type TimeRecordingState = {
  /** Task chosen for the next recording (or current session). */
  selectedTask: TaskOption | null;
  isRecording: boolean;
  startedAtMs: number | null;
  /** Log Time modal visibility + context */
  logModalOpen: boolean;
  /** Prefill when stopping the timer */
  timerPrefill: TimerLogPrefill | null;
  /** When opening Log Time from the header (no timer), which project scopes the task list */
  manualLogProjectId: number | null;

  setSelectedTask: (task: TaskOption | null) => void;
  /** Returns false if no task selected */
  startRecording: () => boolean;
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
    startedAtMs: patch.startedAtMs,
  };
}

export const useTimeRecordingStore = create<TimeRecordingState>()(
  persist(
    (set, get) => ({
      selectedTask: null,
      isRecording: false,
      startedAtMs: null,
      logModalOpen: false,
      timerPrefill: null,
      manualLogProjectId: null,

      setSelectedTask: (task) => set({ selectedTask: task }),

      startRecording: () => {
        const { selectedTask } = get();
        if (!selectedTask) return false;
        set({ isRecording: true, startedAtMs: Date.now() });
        return true;
      },

      stopRecordingOpenLogModal: () => {
        const { isRecording, startedAtMs, selectedTask } = get();
        if (!isRecording || startedAtMs == null || !selectedTask) {
          set({ isRecording: false, startedAtMs: null });
          return;
        }
        const elapsedSec = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
        const hours = Math.max(elapsedSec / 3600, 0.01);
        const hoursStr = hours < 10 ? hours.toFixed(2) : hours.toFixed(1);
        set({
          isRecording: false,
          startedAtMs: null,
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
        startedAtMs: state.startedAtMs,
      }),
      merge: (persistedState, currentState) => {
        const patch = sanitizePersistedTimerSlice(persistedState);
        return applyPersistedTimerFields(currentState, patch);
      },
    },
  ),
);
