import { describe, expect, it } from "vitest";

import { sanitizePersistedTimerSlice } from "./timeRecordingTimerStorage";

const validTask = {
  id: "42",
  title: "Fix bug",
  project: "Acme",
  project_id: 7,
};

const empty = {
  selectedTask: null,
  isRecording: false,
  isPaused: false,
  startedAtMs: null,
  accumulatedMs: 0,
};

describe("sanitizePersistedTimerSlice", () => {
  it("returns empty fields for non-objects", () => {
    expect(sanitizePersistedTimerSlice(null)).toEqual(empty);
    expect(sanitizePersistedTimerSlice(undefined)).toEqual(empty);
    expect(sanitizePersistedTimerSlice("x")).toEqual(empty);
  });

  it("restores a valid in-progress recording session", () => {
    const startedAtMs = 1_700_000_000_000;
    expect(
      sanitizePersistedTimerSlice({
        isRecording: true,
        startedAtMs,
        selectedTask: validTask,
      }),
    ).toEqual({
      isRecording: true,
      isPaused: false,
      startedAtMs,
      selectedTask: validTask,
      accumulatedMs: 0,
    });
  });

  it("restores a paused session with accumulated time", () => {
    expect(
      sanitizePersistedTimerSlice({
        isRecording: true,
        isPaused: true,
        startedAtMs: null,
        accumulatedMs: 125_000,
        selectedTask: validTask,
      }),
    ).toEqual({
      isRecording: true,
      isPaused: true,
      startedAtMs: null,
      accumulatedMs: 125_000,
      selectedTask: validTask,
    });
  });

  it("clears recording when isRecording but task is missing or invalid", () => {
    const startedAtMs = 1_700_000_000_000;
    expect(
      sanitizePersistedTimerSlice({
        isRecording: true,
        startedAtMs,
        selectedTask: null,
      }),
    ).toEqual(empty);
    expect(
      sanitizePersistedTimerSlice({
        isRecording: true,
        startedAtMs,
        selectedTask: { id: "1" },
      }),
    ).toEqual({
      ...empty,
      selectedTask: null,
    });
  });

  it("clears recording when isRecording but startedAtMs is invalid", () => {
    expect(
      sanitizePersistedTimerSlice({
        isRecording: true,
        startedAtMs: NaN,
        selectedTask: validTask,
      }),
    ).toEqual({
      isRecording: false,
      isPaused: false,
      startedAtMs: null,
      selectedTask: validTask,
      accumulatedMs: 0,
    });
  });

  it("restores selected task when not recording without orphan startedAtMs", () => {
    expect(
      sanitizePersistedTimerSlice({
        isRecording: false,
        startedAtMs: 99,
        selectedTask: validTask,
      }),
    ).toEqual({
      isRecording: false,
      isPaused: false,
      startedAtMs: null,
      selectedTask: validTask,
      accumulatedMs: 0,
    });
  });

  it("treats non-true isRecording as stopped", () => {
    expect(
      sanitizePersistedTimerSlice({
        isRecording: "yes",
        startedAtMs: 100,
        selectedTask: validTask,
      }),
    ).toEqual({
      isRecording: false,
      isPaused: false,
      startedAtMs: null,
      selectedTask: validTask,
      accumulatedMs: 0,
    });
  });

  it("coerces running-without-start but positive accumulated into paused", () => {
    expect(
      sanitizePersistedTimerSlice({
        isRecording: true,
        isPaused: false,
        startedAtMs: null,
        accumulatedMs: 5000,
        selectedTask: validTask,
      }),
    ).toEqual({
      isRecording: true,
      isPaused: true,
      startedAtMs: null,
      accumulatedMs: 5000,
      selectedTask: validTask,
    });
  });
});
