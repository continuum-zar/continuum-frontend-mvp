import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FeedbackModal } from "./FeedbackModal";

const submitIssueReport = vi.fn();

vi.mock("@/api/feedback", () => ({
  submitIssueReport: (...args: unknown[]) => submitIssueReport(...args),
}));

describe("FeedbackModal", () => {
  beforeEach(() => {
    submitIssueReport.mockReset();
    submitIssueReport.mockResolvedValue(undefined);
  });

  it("renders the form when open", () => {
    render(<FeedbackModal open onOpenChange={() => {}} />);
    expect(screen.getByRole("dialog", { name: /report an issue/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/what happened/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact email/i)).toBeInTheDocument();
  });

  it("requires a non-empty message before calling the API", async () => {
    const user = userEvent.setup();
    render(<FeedbackModal open onOpenChange={() => {}} />);

    await user.click(screen.getByRole("button", { name: /^send report$/i }));

    expect(await screen.findByText(/please describe what happened/i)).toBeInTheDocument();
    expect(submitIssueReport).not.toHaveBeenCalled();
  });

  it("submits the message and optional email, then shows success", async () => {
    const user = userEvent.setup();
    render(<FeedbackModal open onOpenChange={() => {}} />);

    await user.type(screen.getByLabelText(/what happened/i), "Login button freezes");
    await user.type(screen.getByLabelText(/contact email/i), "dev@example.com");
    await user.click(screen.getByRole("button", { name: /^send report$/i }));

    await waitFor(() => {
      expect(submitIssueReport).toHaveBeenCalledWith({
        message: "Login button freezes",
        contact_email: "dev@example.com",
      });
    });

    expect(screen.getByText(/we've received your report/i)).toBeInTheDocument();
  });

  it("shows an error when the API fails", async () => {
    const user = userEvent.setup();
    submitIssueReport.mockRejectedValueOnce(new Error("Network down"));

    render(<FeedbackModal open onOpenChange={() => {}} />);

    await user.type(screen.getByLabelText(/what happened/i), "Something broke");
    await user.click(screen.getByRole("button", { name: /^send report$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/network down/i);
  });

  it("invokes onOpenChange(false) when the user closes from the success state", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<FeedbackModal open onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText(/what happened/i), "Ok");
    await user.click(screen.getByRole("button", { name: /^send report$/i }));

    await screen.findByText(/we've received your report/i);

    await user.click(screen.getByRole("button", { name: /^close$/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
