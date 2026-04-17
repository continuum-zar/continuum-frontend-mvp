import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { TaskPanels } from "./TaskPanels";

const mockUseTaskLoggedHoursTotal = vi.fn();
const mockUseTask = vi.fn();
const mockUpdateTaskMutate = vi.fn();

vi.mock("@/api/hooks", () => ({
  useTaskLoggedHoursTotal: (...args: unknown[]) => mockUseTaskLoggedHoursTotal(...args),
  useTask: (...args: unknown[]) => mockUseTask(...args),
  useUpdateTask: () => ({ mutate: mockUpdateTaskMutate, isPending: false }),
}));

vi.mock("./LogTimeModal", () => ({
  LogTimeModal: () => null,
}));

describe("TaskPanels", () => {
  beforeEach(() => {
    mockUseTaskLoggedHoursTotal.mockReset();
    mockUseTaskLoggedHoursTotal.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });
    mockUseTask.mockReset();
    mockUseTask.mockReturnValue({ data: undefined });
    mockUpdateTaskMutate.mockReset();
  });

  it("shows an em dash when project/task IDs are not available for API hours", () => {
    render(<TaskPanels onBack={() => {}} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(mockUseTaskLoggedHoursTotal).toHaveBeenCalledWith(null, null, { enabled: false });
  });

  it("requests logged hours when numeric project and task ids are present", () => {
    mockUseTaskLoggedHoursTotal.mockReturnValue({
      data: 12.5,
      isLoading: false,
      isError: false,
    });
    render(<TaskPanels onBack={() => {}} taskId="42" projectId="9" />);
    expect(mockUseTaskLoggedHoursTotal).toHaveBeenCalledWith("9", "42", { enabled: true });
    expect(screen.getByText("12.5")).toBeInTheDocument();
  });

  it("shows a loading indicator while hours are fetching", () => {
    mockUseTaskLoggedHoursTotal.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    render(<TaskPanels onBack={() => {}} taskId="42" projectId="9" />);
    expect(screen.getByText("Loading logged hours", { exact: false })).toBeInTheDocument();
  });

  it("shows an error fallback when the hours query fails", () => {
    mockUseTaskLoggedHoursTotal.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    render(<TaskPanels onBack={() => {}} taskId="42" projectId="9" />);
    expect(screen.getByText("Unable to load")).toBeInTheDocument();
  });
});
