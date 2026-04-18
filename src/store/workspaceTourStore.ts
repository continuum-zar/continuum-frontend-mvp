import { create } from "zustand";

import type { SettingsSection } from "@/app/components/dashboard-placeholder/SettingsModal";

export type TimeLogsActivitySubView = "members" | "trends" | "performance";

export type WorkspaceTourPersistedStatus = "none" | "active" | "completed" | "skipped";

const STORAGE_PREFIX = "continuum_workspace_tour_v1";

export function workspaceTourStorageKeyForUser(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

export type WorkspaceTourPersisted = {
  status: Exclude<WorkspaceTourPersistedStatus, "none">;
  stepIndex: number;
};

export function readWorkspaceTourPersisted(userId: string): WorkspaceTourPersisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(workspaceTourStorageKeyForUser(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkspaceTourPersisted;
    if (
      parsed &&
      (parsed.status === "active" || parsed.status === "completed" || parsed.status === "skipped") &&
      typeof parsed.stepIndex === "number"
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function writeWorkspaceTourPersisted(userId: string, data: WorkspaceTourPersisted): void {
  try {
    localStorage.setItem(workspaceTourStorageKeyForUser(userId), JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

type WorkspaceTourState = {
  userId: string | null;
  active: boolean;
  stepIndex: number;
  pendingFromWelcome: boolean;
  timeLogsActivityView: TimeLogsActivitySubView | null;
  settingsPanelSection: SettingsSection | null;
  /** Tour-driven settings modal: null = do not sync; true/false = open/close */
  tourSettingsModalOpen: boolean | null;
  hydrate: (userId: string | null) => void;
  queueAfterWelcomeDismiss: () => void;
  clearPendingFromWelcome: () => void;
  startTour: (fromStep?: number) => void;
  nextStep: (maxSteps: number) => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  setStepIndex: (n: number) => void;
  setTimeLogsActivityView: (v: TimeLogsActivitySubView | null) => void;
  setSettingsPanelSection: (s: SettingsSection | null) => void;
  setTourSettingsModalOpen: (open: boolean | null) => void;
};

export const useWorkspaceTourStore = create<WorkspaceTourState>((set, get) => ({
  userId: null,
  active: false,
  stepIndex: 0,
  pendingFromWelcome: false,
  timeLogsActivityView: null,
  settingsPanelSection: null,
  tourSettingsModalOpen: null,

  hydrate: (userId) => {
    set({ userId, tourSettingsModalOpen: null });
    if (!userId) {
      set({
        active: false,
        stepIndex: 0,
        pendingFromWelcome: false,
        timeLogsActivityView: null,
        settingsPanelSection: null,
        tourSettingsModalOpen: null,
      });
      return;
    }
    const p = readWorkspaceTourPersisted(userId);
    if (p?.status === "active") {
      set({ stepIndex: p.stepIndex, active: false });
    } else {
      set({ stepIndex: 0, active: false });
    }
  },

  queueAfterWelcomeDismiss: () => {
    const { userId } = get();
    if (!userId) return;
    const p = readWorkspaceTourPersisted(userId);
    if (p?.status === "completed" || p?.status === "skipped") return;
    set({ pendingFromWelcome: true });
  },

  clearPendingFromWelcome: () => set({ pendingFromWelcome: false }),

  startTour: (fromStep = 0) => {
    const { userId } = get();
    if (!userId) return;
    set({ active: true, stepIndex: fromStep, pendingFromWelcome: false, tourSettingsModalOpen: null });
    writeWorkspaceTourPersisted(userId, { status: "active", stepIndex: fromStep });
  },

  nextStep: (maxSteps) => {
    const { userId, stepIndex } = get();
    const next = stepIndex + 1;
    if (next >= maxSteps) {
      get().completeTour();
      return;
    }
    set({ stepIndex: next });
    if (userId) writeWorkspaceTourPersisted(userId, { status: "active", stepIndex: next });
  },

  prevStep: () => {
    const { userId, stepIndex } = get();
    const prev = Math.max(0, stepIndex - 1);
    set({ stepIndex: prev });
    if (userId) writeWorkspaceTourPersisted(userId, { status: "active", stepIndex: prev });
  },

  skipTour: () => {
    const { userId } = get();
    set({ active: false, stepIndex: 0, timeLogsActivityView: null, settingsPanelSection: null });
    if (userId) writeWorkspaceTourPersisted(userId, { status: "skipped", stepIndex: 0 });
  },

  completeTour: () => {
    const { userId } = get();
    set({ active: false, stepIndex: 0, timeLogsActivityView: null, settingsPanelSection: null });
    if (userId) writeWorkspaceTourPersisted(userId, { status: "completed", stepIndex: 0 });
  },

  setStepIndex: (n) => {
    const { userId } = get();
    set({ stepIndex: n });
    if (userId) writeWorkspaceTourPersisted(userId, { status: "active", stepIndex: n });
  },

  setTimeLogsActivityView: (v) => set({ timeLogsActivityView: v }),

  setSettingsPanelSection: (s) => set({ settingsPanelSection: s }),

  setTourSettingsModalOpen: (open) => set({ tourSettingsModalOpen: open }),
}));
