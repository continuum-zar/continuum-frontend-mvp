import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";

import { ReleaseNotesSessionHost } from "./ReleaseNotesSessionHost";

const fetchLatestReleaseNote = vi.fn();
const markReleaseNoteSeen = vi.fn();

vi.mock("@/store/authStore", () => ({
  useAuthStore: (selector: (s: { user: { id: number } | null }) => unknown) =>
    selector({ user: { id: 42 } }),
}));

vi.mock("@/api/releaseNotes", () => ({
  fetchLatestReleaseNote: (...args: unknown[]) => fetchLatestReleaseNote(...args),
  markReleaseNoteSeen: (...args: unknown[]) => markReleaseNoteSeen(...args),
  releaseNoteKeys: { latest: () => ["release-notes", "latest"] as const },
}));

function renderHost(initialPath: string) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialPath]}>
        <ReleaseNotesSessionHost />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("ReleaseNotesSessionHost", () => {
  beforeEach(() => {
    fetchLatestReleaseNote.mockReset();
    markReleaseNoteSeen.mockReset();
    markReleaseNoteSeen.mockResolvedValue(undefined);
    sessionStorage.clear();
    localStorage.clear();
  });

  it("shows the modal when the latest note is unseen and calls mark seen on dismiss", async () => {
    const user = userEvent.setup();
    fetchLatestReleaseNote.mockResolvedValue({
      id: 7,
      version: "1.2.0",
      title: "Ship notes",
      content: "Hello",
      checklist_items: ["A"],
      created_at: new Date().toISOString(),
      seen: false,
    });

    renderHost("/workspace");

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: /what's new in continuum v1\.2\.0/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /^got it$/i }));

    await waitFor(() => {
      expect(markReleaseNoteSeen).toHaveBeenCalledWith(7);
    });
  });

  it("does not fetch on onboarding routes", async () => {
    fetchLatestReleaseNote.mockResolvedValue(null);
    renderHost("/onboarding/usage");
    await new Promise((r) => setTimeout(r, 50));
    expect(fetchLatestReleaseNote).not.toHaveBeenCalled();
  });
});
