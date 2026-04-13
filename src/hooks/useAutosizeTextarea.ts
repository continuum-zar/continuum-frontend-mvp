import { useCallback, useLayoutEffect, useRef } from "react";

export type UseAutosizeTextareaOptions = {
  /** Minimum height in pixels (default 40). */
  minPx?: number;
  /** Maximum height before inner scroll (default 480). */
  maxPx?: number;
};

/**
 * Keeps a controlled textarea height in sync with its content (like iMessage / Slack).
 */
export function useAutosizeTextarea(
  value: string,
  options?: UseAutosizeTextareaOptions,
) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const minPx = options?.minPx ?? 40;
  const maxPx = options?.maxPx ?? 480;

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const h = Math.min(Math.max(el.scrollHeight, minPx), maxPx);
    el.style.height = `${h}px`;
  }, [minPx, maxPx]);

  useLayoutEffect(() => {
    sync();
  }, [value, sync]);

  return ref;
}
