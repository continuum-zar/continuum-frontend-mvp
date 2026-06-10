import { describe, expect, it } from "vitest";

import {
  KANBAN_TASK_DESC_PREVIEW_MAX_CHARS,
  kanbanTaskDescriptionPreview,
  stripMarkdownToPlainText,
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

  it("strips markdown syntax from the preview", () => {
    expect(kanbanTaskDescriptionPreview("**Wire telemetry** for the launchpad").preview).toBe(
      "Wire telemetry for the launchpad",
    );
    expect(kanbanTaskDescriptionPreview("# Heading\n\nBody copy here").preview).toBe(
      "Heading Body copy here",
    );
    expect(kanbanTaskDescriptionPreview("- step one\n- step two\n- step three").preview).toBe(
      "step one step two step three",
    );
    expect(kanbanTaskDescriptionPreview("see [the spec](https://example.com)").preview).toBe(
      "see the spec",
    );
  });
});

describe("stripMarkdownToPlainText", () => {
  it("removes bold + italic emphasis markers", () => {
    expect(stripMarkdownToPlainText("**bold** and *italic* and ~~strike~~")).toBe(
      "bold and italic and strike",
    );
    expect(stripMarkdownToPlainText("__also bold__ and _also italic_")).toBe(
      "also bold and also italic",
    );
  });

  it("flattens links and images to their text", () => {
    expect(stripMarkdownToPlainText("see [docs](https://x.example)")).toBe("see docs");
    expect(stripMarkdownToPlainText("![diagram](image.png) follows")).toBe("diagram follows");
  });

  it("drops headings, blockquotes, list markers, hr lines", () => {
    expect(stripMarkdownToPlainText("# Title\n## Sub\n### Section")).toBe(
      "Title Sub Section",
    );
    expect(stripMarkdownToPlainText("> A quote\n> continued")).toBe("A quote continued");
    expect(stripMarkdownToPlainText("- one\n- two\n* three\n1. four")).toBe(
      "one two three four",
    );
    expect(stripMarkdownToPlainText("before\n\n---\n\nafter")).toBe("before after");
  });

  it("preserves inline + block code content (just drops the fences)", () => {
    expect(stripMarkdownToPlainText("use `cn()` for class merge")).toBe(
      "use cn() for class merge",
    );
    expect(stripMarkdownToPlainText("```ts\nconst x = 1;\n```")).toBe("const x = 1;");
  });

  it("collapses newlines into spaces so the truncation budget shows content", () => {
    expect(stripMarkdownToPlainText("line one\n\n\nline two")).toBe("line one line two");
  });
});
