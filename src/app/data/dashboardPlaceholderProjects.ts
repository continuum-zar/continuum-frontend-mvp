/**
 * Dashboard-placeholder routing helpers.
 * "welcome" = demo overview at /welcome; numeric ids = API projects at /project/:id.
 */

export const WELCOME_PROJECT_ID = "welcome" as const;

/** Static row for the marketing/demo Welcome overview only. */
export const DASHBOARD_WELCOME_PROJECT = {
  id: WELCOME_PROJECT_ID,
  name: "Welcome to Continuum!",
  sprintLabel: "Get started",
} as const;

/** @deprecated Prefer DASHBOARD_WELCOME_PROJECT; kept for imports expecting an array */
export const DASHBOARD_PROJECTS = [DASHBOARD_WELCOME_PROJECT] as const;

export type DashboardPlaceholderProjectId = typeof WELCOME_PROJECT_ID | (string & {});

export function isApiProjectId(id: string): boolean {
  return /^\d+$/.test(id);
}

export function getDashboardProjectById(id: string) {
  if (id === WELCOME_PROJECT_ID) return DASHBOARD_WELCOME_PROJECT;
  return undefined;
}

/** Project overview: welcome uses /welcome; API projects use /project/:numericId */
export function projectMainHref(projectId: string): string {
  if (projectId === WELCOME_PROJECT_ID) return "/dashboard-placeholder/welcome";
  return `/dashboard-placeholder/project/${projectId}`;
}

/** Sprint / kanban board. Optional milestone id scopes the nav row and `?milestone=` for deep links. */
export function projectSprintHref(projectId: string, milestoneId?: string): string {
  if (projectId === WELCOME_PROJECT_ID) return "/dashboard-placeholder/get-started";
  const q = new URLSearchParams();
  q.set("project", projectId);
  if (milestoneId) q.set("milestone", milestoneId);
  return `/dashboard-placeholder/get-started?${q.toString()}`;
}

/**
 * Time logs / Activity views under get-started. Pass `milestoneId` so the URL round-trips back to the
 * Sprint board with the same milestone (breadcrumb + title stay correct).
 */
export function projectTimeLogsHref(
  projectId: string,
  tab: "time-logs" | "activity",
  milestoneId?: string,
): string {
  const q = new URLSearchParams();
  q.set("project", projectId);
  q.set("tab", tab);
  if (milestoneId) q.set("milestone", milestoneId);
  return `/dashboard-placeholder/get-started/time-logs?${q.toString()}`;
}

/**
 * Which project is expanded in the rail (sprint child may show when milestones exist). Null = none.
 */
export function expandedProjectFromLocation(pathname: string, projectParam: string | null): string | null {
  if (pathname.startsWith("/dashboard-placeholder/welcome")) return WELCOME_PROJECT_ID;
  if (pathname.startsWith("/dashboard-placeholder/project/")) {
    const m = pathname.match(/^\/dashboard-placeholder\/project\/([^/]+)/);
    const id = m?.[1];
    if (id && (id === WELCOME_PROJECT_ID || isApiProjectId(id))) return id;
  }
  if (pathname.startsWith("/dashboard-placeholder/get-started")) {
    if (projectParam && (projectParam === WELCOME_PROJECT_ID || isApiProjectId(projectParam))) return projectParam;
    return WELCOME_PROJECT_ID;
  }
  if (pathname.startsWith("/dashboard-placeholder/task/")) {
    if (projectParam && (projectParam === WELCOME_PROJECT_ID || isApiProjectId(projectParam))) return projectParam;
    return WELCOME_PROJECT_ID;
  }
  return null;
}

export function isSprintNavActive(projectId: string, pathname: string, projectParam: string | null): boolean {
  const onSprintSurface =
    pathname.startsWith("/dashboard-placeholder/get-started") ||
    pathname.startsWith("/dashboard-placeholder/task/");
  if (!onSprintSurface) return false;
  if (projectId === WELCOME_PROJECT_ID) return !projectParam || projectParam === WELCOME_PROJECT_ID;
  return projectParam === projectId;
}

/** True when viewing this project's overview (not the kanban sprint). */
export function isProjectOverviewActive(projectId: string, pathname: string): boolean {
  if (projectId === WELCOME_PROJECT_ID) {
    return pathname === "/dashboard-placeholder/welcome" || pathname.startsWith("/dashboard-placeholder/welcome/");
  }
  return (
    pathname === `/dashboard-placeholder/project/${projectId}` ||
    pathname.startsWith(`/dashboard-placeholder/project/${projectId}/`)
  );
}

/** Resolve active project id for overview pages (welcome demo vs API project param). */
export function resolveDashboardProjectId(pathname: string, routeProjectId: string | undefined): string {
  if (pathname.startsWith("/dashboard-placeholder/project/") && routeProjectId) {
    if (routeProjectId === WELCOME_PROJECT_ID || isApiProjectId(routeProjectId)) return routeProjectId;
  }
  return WELCOME_PROJECT_ID;
}
