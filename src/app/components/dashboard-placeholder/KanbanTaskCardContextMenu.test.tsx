import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { KanbanTaskCardContextMenu } from "./KanbanTaskCardContextMenu";

function renderMenu(
  overrides: Partial<{
    onOpenTask: () => void;
    onEditTask: () => void;
    onCopyLink: () => void;
    onDelete: () => void;
    onMoveTo: (s: "todo" | "in-progress" | "done") => void;
    currentStatus: "todo" | "in-progress" | "done";
  }> = {},
) {
  const onOpenTask = overrides.onOpenTask ?? vi.fn();
  const onEditTask = overrides.onEditTask ?? vi.fn();
  const onCopyLink = overrides.onCopyLink ?? vi.fn();
  const onDelete = overrides.onDelete ?? vi.fn();
  const onMoveTo = overrides.onMoveTo ?? vi.fn();

  render(
    <KanbanTaskCardContextMenu
      taskId="task-1"
      currentStatus={overrides.currentStatus ?? "todo"}
      onOpenTask={onOpenTask}
      onEditTask={onEditTask}
      onCopyLink={onCopyLink}
      onDelete={onDelete}
      onMoveTo={onMoveTo}
    >
      <div data-testid="kanban-card">Example task card</div>
    </KanbanTaskCardContextMenu>,
  );

  return { onOpenTask, onEditTask, onCopyLink, onDelete, onMoveTo };
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
});
