import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getRecordingElapsedMs, useTimeRecordingStore } from "./timeRecordingStore";

const task = {
  id: "10",
  title: "Example",
  project: "P",
  project_id: 3,
};

describe("useTimeRecordingStore pause/resume", () => {
  beforeEach(() => {
    useTimeRecordingStore.setState({
      selectedTask: task,
      isRecording: false,
      isPaused: false,
      startedAtMs: null,
      accumulatedMs: 0,
      logModalOpen: false,
      timerPrefill: null,
      manualLogProjectId: null,
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("accumulates elapsed across pause and resume", () => {
    expect(useTimeRecordingStore.getState().startRecording()).toBe(true);
    vi.setSystemTime(new Date("2026-01-15T12:00:10.000Z"));
    useTimeRecordingStore.getState().pauseRecording();
    expect(useTimeRecordingStore.getState()).toMatchObject({
      isRecording: true,
      isPaused: true,
      startedAtMs: null,
      accumulatedMs: 10_000,
    });
    expect(getRecordingElapsedMs(useTimeRecordingStore.getState())).toBe(10_000);

    vi.setSystemTime(new Date("2026-01-15T12:05:00.000Z"));
    useTimeRecordingStore.getState().resumeRecording();
    expect(useTimeRecordingStore.getState()).toMatchObject({
      isPaused: false,
      accumulatedMs: 10_000,
    });
    vi.setSystemTime(new Date("2026-01-15T12:05:03.000Z"));
    expect(getRecordingElapsedMs(useTimeRecordingStore.getState())).toBe(13_000);
  });

  it("stopRecordingOpenLogModal uses total elapsed while paused", () => {
    useTimeRecordingStore.setState({
      isRecording: true,
      isPaused: true,
      startedAtMs: null,
      accumulatedMs: 45_000,
      selectedTask: task,
    });
    useTimeRecordingStore.getState().stopRecordingOpenLogModal();
    const { timerPrefill, isRecording, isPaused } = useTimeRecordingStore.getState();
    expect(isRecording).toBe(false);
    expect(isPaused).toBe(false);
    expect(timerPrefill?.hours).toBe("0.01");
    expect(timerPrefill?.taskId).toBe("10");
  });
});
