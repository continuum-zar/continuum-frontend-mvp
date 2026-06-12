import { describe, expect, it, vi } from "vitest";
import { projectPresenceEventsStreamUrl } from "./projectPresenceEvents";

vi.mock("@/lib/api", () => ({
  resolveApiBaseURL: () => "/api/v1",
}));

vi.mock("@/api/sseTicket", () => ({
  getSseTicket: vi.fn().mockResolvedValue("ticket-abc"),
}));

describe("projectPresenceEventsStreamUrl", () => {
  it("builds project-scoped SSE URL with a short-lived ticket (not the raw JWT)", async () => {
    const url = await projectPresenceEventsStreamUrl(123);
    expect(url).toContain("/api/v1/projects/123/presence-events/stream");
    expect(url).toContain("ticket=ticket-abc");
    expect(url).not.toContain("access_token");
  });
});
