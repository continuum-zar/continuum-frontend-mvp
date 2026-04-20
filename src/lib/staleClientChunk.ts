export const STALE_CHUNK_RELOAD_COUNT_KEY = "continuum.chunk-reload-count";
export const STALE_CHUNK_MAX_AUTO_RELOADS = 2;

/**
 * Schedules a full page reload to pick up a new deploy after a lazy chunk failed.
 * Returns whether a reload was initiated (false if capped).
 */
export function tryReloadForStaleChunk(): boolean {
  try {
    const n = Number(sessionStorage.getItem(STALE_CHUNK_RELOAD_COUNT_KEY) ?? "0");
    if (n >= STALE_CHUNK_MAX_AUTO_RELOADS) return false;
    sessionStorage.setItem(STALE_CHUNK_RELOAD_COUNT_KEY, String(n + 1));
    window.location.reload();
    return true;
  } catch {
    window.location.reload();
    return true;
  }
}

/** Clears auto-reload budget after the app has run successfully for a while. */
export function resetStaleChunkReloadCount(): void {
  try {
    sessionStorage.removeItem(STALE_CHUNK_RELOAD_COUNT_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Detects failed lazy/chunk loads (common after a new deploy while an old tab
 * still runs a previous bundle, or transient network loss during `import()`).
 */
export function isStaleClientChunkError(error: unknown): boolean {
  if (error == null) return false;
  if (typeof error !== "object") return false;

  const name = "name" in error && typeof error.name === "string" ? error.name : "";
  if (name === "ChunkLoadError") return true;

  const message =
    "message" in error && typeof error.message === "string" ? error.message : String(error);
  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed") ||
    message.includes("error loading dynamically imported module") ||
    message.includes("Unable to preload CSS")
  );
}
