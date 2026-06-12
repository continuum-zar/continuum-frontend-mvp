/** When description exceeds this length, it is shortened for Kanban card previews. */
export const KANBAN_TASK_DESC_PREVIEW_MAX_CHARS = 120;

/**
 * Best-effort strip of common Markdown syntax for plain-text previews.
 *
 * The task detail page renders the description as Markdown (via
 * TaskDescriptionMarkdown), but a tiny 120-char card preview can't render
 * block elements like headings or lists without looking broken. So when a
 * user writes "**Wire telemetry** for the launchpad", the kanban card
 * should show "Wire telemetry for the launchpad" — readable, no raw
 * syntax leaking through.
 *
 * Regex-based on purpose: react-markdown doesn't expose a "to plain text"
 * path, and the previews are short enough that pulling in a parser would
 * be wasteful. Covers the syntax users write in practice; anything more
 * exotic falls through harmlessly.
 */
export function stripMarkdownToPlainText(input: string): string {
  let s = input;

  // Fenced code blocks (```…```) → drop fences, keep inner text.
  s = s.replace(/```([^\n]*)\n?([\s\S]*?)```/g, (_m, _lang, body) => body);

  // Inline code (`x`) → x
  s = s.replace(/`([^`]+)`/g, "$1");

  // Images ![alt](url) → alt
  s = s.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");

  // Links [text](url) → text
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

  // Reference links [text][ref] → text
  s = s.replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1");

  // Heading markers at line start (# / ## / ### …) → drop marker
  s = s.replace(/^\s{0,3}#{1,6}\s+/gm, "");

  // Blockquote markers at line start (>)
  s = s.replace(/^\s{0,3}>\s?/gm, "");

  // Horizontal rules → blank line
  s = s.replace(/^\s{0,3}(?:-{3,}|_{3,}|\*{3,})\s*$/gm, "");

  // List markers at line start (-, *, +, 1.) → drop marker
  s = s.replace(/^\s{0,3}(?:[-*+]|\d+\.)\s+/gm, "");

  // Bold/italic emphasis: **bold**, __bold__, *italic*, _italic_, ~~strike~~
  s = s.replace(/(\*\*|__)(.+?)\1/g, "$2");
  s = s.replace(/(\*|_)(.+?)\1/g, "$2");
  s = s.replace(/~~(.+?)~~/g, "$1");

  // Collapse run of blank lines + line breaks into single spaces so the
  // truncation budget actually shows content rather than newlines.
  s = s.replace(/\s*\n+\s*/g, " ");
  s = s.replace(/\s{2,}/g, " ");

  return s.trim();
}

/**
 * Short preview for Kanban task cards: strips Markdown syntax to plain
 * text, then truncates to {@link KANBAN_TASK_DESC_PREVIEW_MAX_CHARS} with
 * an ellipsis when longer. Expects trimmed input.
 */
export function kanbanTaskDescriptionPreview(trimmed: string): {
  preview: string;
  isTruncated: boolean;
} {
  if (!trimmed) {
    return { preview: "", isTruncated: false };
  }
  const plain = stripMarkdownToPlainText(trimmed);
  if (plain.length <= KANBAN_TASK_DESC_PREVIEW_MAX_CHARS) {
    return { preview: plain, isTruncated: false };
  }
  const sliceEnd = KANBAN_TASK_DESC_PREVIEW_MAX_CHARS - 3;
  return {
    preview: `${plain.slice(0, sliceEnd).trim()}…`,
    isTruncated: true,
  };
}
