import { describe, expect, it, vi } from "vitest";
import { projectPresenceEventsStreamUrl } from "./projectPresenceEvents";

vi.mock("@/lib/api", () => ({
  resolveApiBaseURL: () => "/api/v1",
}));

describe("projectPresenceEventsStreamUrl", () => {
  it("builds project-scoped SSE URL with access token", () => {
    const url = projectPresenceEventsStreamUrl(123, "token-abc");
    expect(url).toContain("/api/v1/projects/123/presence-events/stream");
    expect(url).toContain("access_token=token-abc");
  });
});
