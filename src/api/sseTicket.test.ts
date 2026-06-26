import { describe, expect, it, vi, beforeEach } from "vitest";

// Each POST /events/sse-ticket returns a distinct single-use ticket. We assert
// that concurrent callers never share one — the bug the dedupe removal fixed.
const postMock = vi.fn();

vi.mock("@/lib/api", () => ({
  default: { post: (...args: unknown[]) => postMock(...args) },
}));

import { getSseTicket } from "./sseTicket";

describe("getSseTicket", () => {
  beforeEach(() => {
    postMock.mockReset();
  });

  it("returns the ticket from the API response", async () => {
    postMock.mockResolvedValueOnce({ data: { ticket: "t-1", expires_in: 30 } });
    await expect(getSseTicket()).resolves.toBe("t-1");
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith("/events/sse-ticket");
  });

  it("gives concurrent callers DISTINCT tickets (no single-use sharing)", async () => {
    let n = 0;
    postMock.mockImplementation(() =>
      Promise.resolve({ data: { ticket: `t-${++n}`, expires_in: 30 } }),
    );

    const [a, b, c] = await Promise.all([
      getSseTicket(),
      getSseTicket(),
      getSseTicket(),
    ]);

    // One POST per caller, and three different tickets.
    expect(postMock).toHaveBeenCalledTimes(3);
    expect(new Set([a, b, c]).size).toBe(3);
  });
});
