import type { ReactElement } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { FeedbackModal } from "./FeedbackModal";

const submitIssueReport = vi.fn();

vi.mock("@/api/feedback", () => ({
  submitIssueReport: (...args: unknown[]) => submitIssueReport(...args),
}));

const toastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
  },
}));

function renderFeedbackModal(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("FeedbackModal", () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    submitIssueReport.mockReset();
    submitIssueReport.mockResolvedValue({
      id: 1,
      message: "ok",
      user_id: null,
      contact_email: null,
      created_at: new Date().toISOString(),
    });
  });

  it("renders the form when open", () => {
    renderFeedbackModal(<FeedbackModal open onOpenChange={() => {}} />);
    expect(screen.getByRole("dialog", { name: /report an issue/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/what happened/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact email/i)).toBeInTheDocument();
  });

  it("requires a non-empty message before calling the API", async () => {
    const user = userEvent.setup();
    renderFeedbackModal(<FeedbackModal open onOpenChange={() => {}} />);

    await user.click(screen.getByRole("button", { name: /^send report$/i }));

    expect(await screen.findByText(/please describe what happened/i)).toBeInTheDocument();
    expect(submitIssueReport).not.toHaveBeenCalled();
  });

  it("submits the message and optional email, then toasts and closes", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderFeedbackModal(<FeedbackModal open onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText(/what happened/i), "Login button freezes");
    await user.type(screen.getByLabelText(/contact email/i), "dev@example.com");
    await user.click(screen.getByRole("button", { name: /^send report$/i }));

    await waitFor(() => {
      expect(submitIssueReport).toHaveBeenCalledWith({
        message: "Login button freezes",
        contact_email: "dev@example.com",
      });
    });

    expect(toastSuccess).toHaveBeenCalledWith("Thanks, we've received your report.");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("submits without contact_email when email field is blank", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderFeedbackModal(<FeedbackModal open onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText(/what happened/i), "Blank email path");
    await user.click(screen.getByRole("button", { name: /^send report$/i }));

    await waitFor(() => {
      expect(submitIssueReport).toHaveBeenCalledWith({
        message: "Blank email path",
        contact_email: null,
      });
    });
    expect(toastSuccess).toHaveBeenCalledWith("Thanks, we've received your report.");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows an error when the API fails", async () => {
    const user = userEvent.setup();
    submitIssueReport.mockRejectedValueOnce(new Error("Network down"));

    renderFeedbackModal(<FeedbackModal open onOpenChange={() => {}} />);

    await user.type(screen.getByLabelText(/what happened/i), "Something broke");
    await user.click(screen.getByRole("button", { name: /^send report$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/network down/i);
  });

  it("invokes onOpenChange(false) when the user clicks Cancel", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderFeedbackModal(<FeedbackModal open onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
