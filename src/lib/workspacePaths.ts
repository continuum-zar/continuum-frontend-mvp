/** Browser URL prefix for the workspace shell (Kanban, welcome, tasks). */
export const WORKSPACE_BASE = "/workspace";

/** Previous prefix — redirects and legacy pathname checks only. */
export const LEGACY_WORKSPACE_BASE = "/dashboard-placeholder";

/** Canonical URL segment for the sprint / Kanban board (`/workspace/sprint`). */
export const WORKSPACE_SPRINT_SEGMENT = "sprint";

/** Former segment — bookmarks and pathname fallbacks only. */
export const LEGACY_WORKSPACE_GET_STARTED_SEGMENT = "get-started";

/** Unified assigned / created task list (`/workspace/my-tasks`). */
export const WORKSPACE_MY_TASKS_SEGMENT = "my-tasks";

/** Standalone productivity rhythm heatmap (`/workspace/productivity-rhythm`). */
export const WORKSPACE_PRODUCTIVITY_RHYTHM_SEGMENT = "productivity-rhythm";

export type WorkspaceMyTasksScope = "assigned" | "created";

export function workspaceMyTasksHref(scope: WorkspaceMyTasksScope): string {
  return `${workspaceJoin(WORKSPACE_MY_TASKS_SEGMENT)}?scope=${scope}`;
}

export function workspaceProductivityRhythmHref(): string {
  return workspaceJoin(WORKSPACE_PRODUCTIVITY_RHYTHM_SEGMENT);
}

/**
 * Build a path under `/workspace/...`. No leading slash on segments.
 * `workspaceJoin()` → `/workspace`
 */
export function workspaceJoin(...parts: string[]): string {
  const cleaned = parts
    .map((p) => p.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean);
  if (cleaned.length === 0) return WORKSPACE_BASE;
  return `${WORKSPACE_BASE}/${cleaned.join("/")}`;
}

function underWorkspacePath(pathname: string, ...segments: string[]): boolean {
  const base = workspaceJoin(...segments);
  if (pathname === base) return true;
  return pathname.startsWith(`${base}/`);
}

/** Sprint board or time-logs under sprint (includes legacy `/workspace/get-started/...` before redirect). */
export function isWorkspaceSprintSurfacePath(pathname: string): boolean {
  return (
    underWorkspacePath(pathname, WORKSPACE_SPRINT_SEGMENT) ||
    underWorkspacePath(pathname, LEGACY_WORKSPACE_GET_STARTED_SEGMENT)
  );
}

/** Time logs tab under the sprint shell (plus legacy placeholder URLs). */
export function isWorkspaceSprintTimeLogsPath(pathname: string): boolean {
  return (
    underWorkspacePath(pathname, WORKSPACE_SPRINT_SEGMENT, "time-logs") ||
    underWorkspacePath(pathname, LEGACY_WORKSPACE_GET_STARTED_SEGMENT, "time-logs") ||
    pathname.startsWith(
      `${LEGACY_WORKSPACE_BASE}/${LEGACY_WORKSPACE_GET_STARTED_SEGMENT}/time-logs`,
    )
  );
}
