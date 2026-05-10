import type { ReactElement } from "react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ActiveWorkSessionItem } from "@/api/dashboard";
import { ActiveWorkSessionDetailDialog, formatWorkingDuration, initialsFromActiveSession } from "./ActiveWorkSessionDetailDialog";

const baseSession: ActiveWorkSessionItem = {
  session_id: 1,
  user_id: 42,
  display_name: "Pat Dev",
  first_name: "Pat",
  last_name: "Developer",
  task_id: 9,
  task_title: "Fix rhythm overlay",
  started_at: "2026-05-04T08:00:00.000Z",
  last_resumed_at: "2026-05-04T08:00:00.000Z",
  status: "ACTIVE",
};

function renderDialog(ui: ReactElement) {
  return render(ui);
}

describe("initialsFromActiveSession", () => {
  it("uses first and last initial", () => {
    expect(initialsFromActiveSession(baseSession)).toBe("PD");
  });
});

describe("formatWorkingDuration", () => {
  it("formats hours and minutes", () => {
    const now = new Date("2026-05-04T10:30:00.000Z");
    expect(formatWorkingDuration("2026-05-04T08:00:00.000Z", now)).toBe("2h 30m");
  });
});

describe("ActiveWorkSessionDetailDialog", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders task and elapsed when open", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-04T10:00:00.000Z"));
    renderDialog(
      <ActiveWorkSessionDetailDialog open onOpenChange={() => {}} session={baseSession} />,
    );
    expect(screen.getByRole("dialog", { name: /active time session/i })).toBeInTheDocument();
    expect(screen.getByText("Pat Developer")).toBeInTheDocument();
    expect(screen.getByText("Fix rhythm overlay")).toBeInTheDocument();
    expect(screen.getByText("2h 0m")).toBeInTheDocument();
  });

  it("closes via onOpenChange when dismiss is activated", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog(
      <ActiveWorkSessionDetailDialog open onOpenChange={onOpenChange} session={baseSession} />,
    );
    await user.click(screen.getByRole("button", { name: /close/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows paused helper text for paused sessions", () => {
    renderDialog(
      <ActiveWorkSessionDetailDialog
        open
        onOpenChange={() => {}}
        session={{ ...baseSession, status: "PAUSED" }}
      />,
    );
    expect(screen.getByText(/timer is paused/i)).toBeInTheDocument();
  });
});
