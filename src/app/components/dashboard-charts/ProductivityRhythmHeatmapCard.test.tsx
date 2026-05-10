import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ActiveWorkSessionItem } from "@/api/dashboard";
import { ProductivityRhythmHeatmapCard, type LiveRhythmOverlayState } from "./ProductivityRhythmHeatmapCard";

function sessionForUser(userId: number, sessionId: number): ActiveWorkSessionItem {
  return {
    session_id: sessionId,
    user_id: userId,
    display_name: `User ${userId}`,
    first_name: "U",
    last_name: String(userId),
    task_id: 1,
    task_title: "Live session task title",
    started_at: "2026-05-04T10:00:00.000Z",
    last_resumed_at: null,
    status: "ACTIVE",
  };
}

function buildChartRows() {
  return (["Mon", "Tue", "Wed", "Thu", "Fri"] as const).map((day) => {
    const row: Record<string, string | number> = { day };
    for (let h = 8; h <= 18; h++) {
      row[`hour${h}`] = 0;
    }
    return row;
  });
}

function renderCard(ui: ReactElement) {
  return render(ui);
}

const baseProps = {
  reduceMotion: true,
  effectiveRole: "Project Manager",
  isProjectPM: true,
  hasProjectSelected: true,
  user: { id: 1 },
  rhythmMember: "all",
  onRhythmMemberChange: vi.fn(),
  rhythmProjectMembers: [
    { id: 1, userId: 10, name: "Member One", email: "m1@example.com", role: "developer", initials: "MO" },
  ],
  rhythmLoading: false,
  rhythmError: false,
  rhythmChartData: buildChartRows(),
};

describe("ProductivityRhythmHeatmapCard live overlay", () => {
  it("shows at most three avatars and a +N overflow indicator", () => {
    const sessions = [1, 2, 3, 4, 5].map((i) => sessionForUser(i, 100 + i));
    const live: LiveRhythmOverlayState = {
      dayLabel: "Mon",
      hour: 10,
      sessions,
      loading: false,
      error: false,
    };
    renderCard(<ProductivityRhythmHeatmapCard {...baseProps} liveRhythmOverlay={live} />);
    expect(screen.getByLabelText("2 more active users")).toBeInTheDocument();
    const group = screen.getByRole("group", { name: /5 active in this hour/i });
    expect(group.querySelectorAll("button[type='button']").length).toBe(3);
  });

  it("opens session detail dialog when an avatar is clicked", async () => {
    const user = userEvent.setup();
    const s = sessionForUser(7, 501);
    const live: LiveRhythmOverlayState = {
      dayLabel: "Mon",
      hour: 10,
      sessions: [s],
      loading: false,
      error: false,
    };
    renderCard(<ProductivityRhythmHeatmapCard {...baseProps} liveRhythmOverlay={live} />);
    await user.click(screen.getByRole("button", { name: /open session details for u 7/i }));
    expect(screen.getByRole("dialog", { name: /active time session/i })).toBeInTheDocument();
    expect(screen.getByText("Live session task title")).toBeInTheDocument();
  });

  it("marks paused sessions in avatar aria label", () => {
    const paused = { ...sessionForUser(8, 701), status: "PAUSED" };
    const live: LiveRhythmOverlayState = {
      dayLabel: "Mon",
      hour: 10,
      sessions: [paused],
      loading: false,
      error: false,
    };
    renderCard(<ProductivityRhythmHeatmapCard {...baseProps} liveRhythmOverlay={live} />);
    expect(screen.getByRole("button", { name: /open session details for u 8 \(paused\)/i })).toBeInTheDocument();
  });

  it("shows loading skeleton on live cell when loading and no sessions yet", () => {
    const live: LiveRhythmOverlayState = {
      dayLabel: "Mon",
      hour: 10,
      sessions: [],
      loading: true,
      error: false,
    };
    renderCard(<ProductivityRhythmHeatmapCard {...baseProps} liveRhythmOverlay={live} />);
    expect(screen.getByLabelText(/loading active team sessions/i)).toBeInTheDocument();
  });

  it("shows next hour block when More is clicked", async () => {
    const user = userEvent.setup();
    renderCard(<ProductivityRhythmHeatmapCard {...baseProps} />);
    expect(screen.getByText("8:00")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /show later hour blocks/i }));
    expect(screen.getByText("19:00")).toBeInTheDocument();
  });

  it("auto-scrolls the hour strip so the live clock hour is visible (evening)", async () => {
    const live: LiveRhythmOverlayState = {
      dayLabel: "Mon",
      hour: 20,
      sessions: [],
      loading: false,
      error: false,
    };
    renderCard(<ProductivityRhythmHeatmapCard {...baseProps} liveRhythmOverlay={live} />);
    await waitFor(() => {
      expect(screen.getByText("20:00")).toBeInTheDocument();
    });
  });
});
