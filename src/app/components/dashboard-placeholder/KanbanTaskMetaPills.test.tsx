import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { KanbanTaskMetaPills } from "./KanbanTaskMetaPills";

describe("KanbanTaskMetaPills", () => {
  it("shows attachment, comment, and branch counts in the footer row", () => {
    render(<KanbanTaskMetaPills attachments={0} comments={1} branchCount={2} />);
    expect(screen.getByTitle("Attachments")).toHaveTextContent("0");
    expect(screen.getByTitle("Comments")).toHaveTextContent("1");
    expect(screen.getByTitle("Linked branches")).toHaveTextContent("2");
  });

  it("fades each pill when all counts are zero", () => {
    render(<KanbanTaskMetaPills attachments={0} comments={0} branchCount={0} />);
    expect(screen.getByTitle("Attachments").className).toContain("opacity-0");
    expect(screen.getByTitle("Linked branches").className).toContain("opacity-0");
  });
});
