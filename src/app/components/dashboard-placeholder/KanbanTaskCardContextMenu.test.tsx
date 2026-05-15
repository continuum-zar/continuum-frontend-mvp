import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { KanbanTaskCardContextMenu } from "./KanbanTaskCardContextMenu";

const defaultMoveOptions = [
  { id: "todo", label: "To-do" },
  { id: "in-progress", label: "In progress" },
  { id: "completed", label: "Done" },
];

function renderMenu(
  overrides: Partial<{
    onOpenTask: () => void;
    onEditTask: () => void;
    onCopyLink: () => void;
    onDelete: () => void;
    onMoveToColumn: (columnId: string) => void;
    currentColumnId: string;
    currentColumnKind: "todo" | "in-progress" | "done";
    milestoneMoveOptions: { milestoneId: string | null; label: string }[];
    taskMilestoneId: string | null;
    onMoveTaskToMilestone: (milestoneId: string | null) => void;
  }> = {},
) {
  const onOpenTask = overrides.onOpenTask ?? vi.fn();
  const onEditTask = overrides.onEditTask ?? vi.fn();
  const onCopyLink = overrides.onCopyLink ?? vi.fn();
  const onDelete = overrides.onDelete ?? vi.fn();
  const onMoveToColumn = overrides.onMoveToColumn ?? vi.fn();

  render(
    <KanbanTaskCardContextMenu
      taskId="task-1"
      currentColumnId={overrides.currentColumnId ?? "todo"}
      currentColumnKind={overrides.currentColumnKind ?? "todo"}
      moveColumnOptions={defaultMoveOptions}
      onOpenTask={onOpenTask}
      onEditTask={onEditTask}
      onCopyLink={onCopyLink}
      onDelete={onDelete}
      onMoveToColumn={onMoveToColumn}
      milestoneMoveOptions={overrides.milestoneMoveOptions}
      taskMilestoneId={overrides.taskMilestoneId}
      onMoveTaskToMilestone={overrides.onMoveTaskToMilestone}
    >
      <div data-testid="kanban-card">Example task card</div>
    </KanbanTaskCardContextMenu>,
  );

  return { onOpenTask, onEditTask, onCopyLink, onDelete, onMoveToColumn };
}

describe("KanbanTaskCardContextMenu", () => {
  it("opens on right-click and invokes Open task when that item is activated", async () => {
    const user = userEvent.setup();
    const { onOpenTask } = renderMenu();

    await user.pointer({ keys: "[MouseRight>]", target: screen.getByTestId("kanban-card") });

    await screen.findByRole("menu");
    await user.click(screen.getByRole("menuitem", { name: /open task/i }));
    expect(onOpenTask).toHaveBeenCalledTimes(1);
  });

  it("closes the menu on Escape without calling Open", async () => {
    const user = userEvent.setup();
    const { onOpenTask } = renderMenu();

    await user.pointer({ keys: "[MouseRight>]", target: screen.getByTestId("kanban-card") });
    await screen.findByRole("menu");

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
    expect(onOpenTask).not.toHaveBeenCalled();
  });

  it("invokes onDelete when Delete task is chosen", async () => {
    const user = userEvent.setup();
    const { onDelete } = renderMenu();

    await user.pointer({ keys: "[MouseRight>]", target: screen.getByTestId("kanban-card") });
    await screen.findByRole("menu");
    await user.click(screen.getByRole("menuitem", { name: /delete task/i }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("invokes onCopyLink when Copy link is chosen", async () => {
    const user = userEvent.setup();
    const { onCopyLink } = renderMenu();

    await user.pointer({ keys: "[MouseRight>]", target: screen.getByTestId("kanban-card") });
    await screen.findByRole("menu");
    await user.click(screen.getByRole("menuitem", { name: /copy link/i }));

    expect(onCopyLink).toHaveBeenCalledTimes(1);
  });

  it("does not show Move to milestone when no milestone options are provided", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.pointer({ keys: "[MouseRight>]", target: screen.getByTestId("kanban-card") });
    await screen.findByRole("menu");

    expect(
      screen.queryByRole("menuitem", { name: /move this task to another milestone/i }),
    ).not.toBeInTheDocument();
  });

  it("invokes onMoveTaskToMilestone when a milestone is chosen", async () => {
    const user = userEvent.setup();
    const onMoveTaskToMilestone = vi.fn();
    renderMenu({
      milestoneMoveOptions: [
        { milestoneId: null, label: "No milestone" },
        { milestoneId: "99", label: "Sprint A" },
      ],
      taskMilestoneId: null,
      onMoveTaskToMilestone,
    });

    await user.pointer({ keys: "[MouseRight>]", target: screen.getByTestId("kanban-card") });
    await screen.findByRole("menu");

    const trigger = screen.getByRole("menuitem", {
      name: /move this task to another milestone/i,
    });
    await user.hover(trigger);
    const dest = await screen.findByRole("menuitem", { name: /move task to milestone sprint a/i });
    fireEvent.click(dest);

    expect(onMoveTaskToMilestone).toHaveBeenCalledTimes(1);
    expect(onMoveTaskToMilestone).toHaveBeenCalledWith("99");
  });
});
