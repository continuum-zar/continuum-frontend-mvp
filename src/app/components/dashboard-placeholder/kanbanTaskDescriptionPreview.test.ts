import { describe, expect, it } from "vitest";

import {
  KANBAN_TASK_DESC_PREVIEW_MAX_CHARS,
  kanbanTaskDescriptionPreview,
} from "./kanbanTaskDescriptionPreview";

describe("kanbanTaskDescriptionPreview", () => {
  it("returns empty for empty input", () => {
    expect(kanbanTaskDescriptionPreview("")).toEqual({ preview: "", isTruncated: false });
  });

  it("does not truncate at or below the max length", () => {
    const exact = "a".repeat(KANBAN_TASK_DESC_PREVIEW_MAX_CHARS);
    expect(kanbanTaskDescriptionPreview(exact)).toEqual({
      preview: exact,
      isTruncated: false,
    });
  });

  it("truncates with ellipsis when longer than the max", () => {
    const long = "a".repeat(KANBAN_TASK_DESC_PREVIEW_MAX_CHARS + 1);
    const { preview, isTruncated } = kanbanTaskDescriptionPreview(long);
    expect(isTruncated).toBe(true);
    expect(preview.endsWith("…")).toBe(true);
    expect(preview.length).toBeLessThanOrEqual(KANBAN_TASK_DESC_PREVIEW_MAX_CHARS);
  });

  it("trims trailing whitespace before ellipsis", () => {
    const pad = "a".repeat(114) + "   ";
    const base = pad + "b".repeat(20);
    const { preview } = kanbanTaskDescriptionPreview(base);
    expect(preview.endsWith("…")).toBe(true);
    expect(preview.includes("   …")).toBe(false);
  });
});
