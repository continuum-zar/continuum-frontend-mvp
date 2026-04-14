import { describe, expect, it } from "vitest";

import { sanitizePersistedTimerSlice } from "./timeRecordingTimerStorage";

const validTask = {
  id: "42",
  title: "Fix bug",
  project: "Acme",
  project_id: 7,
};

describe("sanitizePersistedTimerSlice", () => {
  it("returns empty fields for non-objects", () => {
    expect(sanitizePersistedTimerSlice(null)).toEqual({
      selectedTask: null,
      isRecording: false,
      startedAtMs: null,
    });
    expect(sanitizePersistedTimerSlice(undefined)).toEqual({
      selectedTask: null,
      isRecording: false,
      startedAtMs: null,
    });
    expect(sanitizePersistedTimerSlice("x")).toEqual({
      selectedTask: null,
      isRecording: false,
      startedAtMs: null,
    });
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
      startedAtMs,
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
    ).toEqual({
      isRecording: false,
      startedAtMs: null,
      selectedTask: null,
    });
    expect(
      sanitizePersistedTimerSlice({
        isRecording: true,
        startedAtMs,
        selectedTask: { id: "1" },
      }),
    ).toEqual({
      isRecording: false,
      startedAtMs: null,
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
      startedAtMs: null,
      selectedTask: validTask,
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
      startedAtMs: null,
      selectedTask: validTask,
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
      startedAtMs: null,
      selectedTask: validTask,
    });
  });
});
