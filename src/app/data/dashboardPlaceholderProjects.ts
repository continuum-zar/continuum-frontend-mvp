/**
 * Placeholder project list for dashboard-placeholder sidebar + project-level routes.
 * Closed row = folder-dot; expanded shows folder-open + sprint row (kanban) under the project.
 */

export const DASHBOARD_PROJECTS = [
  { id: "welcome", name: "Welcome to Continuum!", sprintLabel: "Get started" },
  { id: "alpha", name: "Untitled long project_name_1", sprintLabel: "UX Strategy" },
  { id: "beta", name: "Mobile redesign", sprintLabel: "Sprint 2" },
] as const;

export type DashboardPlaceholderProjectId = (typeof DASHBOARD_PROJECTS)[number]["id"];

export function getDashboardProjectById(id: string) {
  return DASHBOARD_PROJECTS.find((p) => p.id === id);
}

/** Project overview: welcome uses legacy URL; others use /project/:id */
export function projectMainHref(projectId: string): string {
  if (projectId === "welcome") return "/dashboard-placeholder/welcome";
  return `/dashboard-placeholder/project/${projectId}`;
}

/** Sprint / kanban board */
export function projectSprintHref(projectId: string): string {
  if (projectId === "welcome") return "/dashboard-placeholder/get-started";
  return `/dashboard-placeholder/get-started?project=${projectId}`;
}

/**
 * Which project is expanded in the rail (shows sprint child). Null = all collapsed (e.g. org home).
 */
export function expandedProjectFromLocation(pathname: string, projectParam: string | null): string | null {
  if (pathname.startsWith("/dashboard-placeholder/welcome")) return "welcome";
  if (pathname.startsWith("/dashboard-placeholder/project/")) {
    const m = pathname.match(/^\/dashboard-placeholder\/project\/([^/]+)/);
    const id = m?.[1];
    if (id && DASHBOARD_PROJECTS.some((p) => p.id === id)) return id;
  }
  if (pathname.startsWith("/dashboard-placeholder/get-started")) {
    if (projectParam && DASHBOARD_PROJECTS.some((p) => p.id === projectParam)) return projectParam;
    return "welcome";
  }
  if (pathname.startsWith("/dashboard-placeholder/task/")) {
    if (projectParam && DASHBOARD_PROJECTS.some((p) => p.id === projectParam)) return projectParam;
    return "welcome";
  }
  return null;
}

export function isSprintNavActive(projectId: string, pathname: string, projectParam: string | null): boolean {
  const onSprintSurface =
    pathname.startsWith("/dashboard-placeholder/get-started") ||
    pathname.startsWith("/dashboard-placeholder/task/");
  if (!onSprintSurface) return false;
  if (projectId === "welcome") return !projectParam || projectParam === "welcome";
  return projectParam === projectId;
}

/** True when viewing this project's overview (not the kanban sprint). */
export function isProjectOverviewActive(projectId: string, pathname: string): boolean {
  if (projectId === "welcome") {
    return pathname === "/dashboard-placeholder/welcome" || pathname.startsWith("/dashboard-placeholder/welcome/");
  }
  return (
    pathname === `/dashboard-placeholder/project/${projectId}` ||
    pathname.startsWith(`/dashboard-placeholder/project/${projectId}/`)
  );
}

/** Resolve project for project-level overview pages */
export function resolveDashboardProjectId(
  pathname: string,
  routeProjectId: string | undefined,
): DashboardPlaceholderProjectId {
  if (pathname.startsWith("/dashboard-placeholder/project/") && routeProjectId) {
    const p = getDashboardProjectById(routeProjectId);
    if (p) return p.id;
  }
  return "welcome";
}
