/** When description exceeds this length, it is shortened for Kanban card previews. */
export const KANBAN_TASK_DESC_PREVIEW_MAX_CHARS = 120;

/**
 * Short preview for Kanban task cards: up to {@link KANBAN_TASK_DESC_PREVIEW_MAX_CHARS}
 * characters, with a trailing ellipsis when longer. Expects trimmed text.
 */
export function kanbanTaskDescriptionPreview(trimmed: string): {
  preview: string;
  isTruncated: boolean;
} {
  if (!trimmed) {
    return { preview: "", isTruncated: false };
  }
  if (trimmed.length <= KANBAN_TASK_DESC_PREVIEW_MAX_CHARS) {
    return { preview: trimmed, isTruncated: false };
  }
  const sliceEnd = KANBAN_TASK_DESC_PREVIEW_MAX_CHARS - 3;
  return {
    preview: `${trimmed.slice(0, sliceEnd).trim()}…`,
    isTruncated: true,
  };
}
