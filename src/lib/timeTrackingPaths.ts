import { isWorkspaceSprintTimeLogsPath } from "@/lib/workspacePaths";

/**
 * Paths where the legacy time page or workspace time logs
 * should own the full time UI (context activation, hide global session chip).
 */
export function isTimeTrackingRoutePath(pathname: string): boolean {
  return pathname === "/time" || isWorkspaceSprintTimeLogsPath(pathname);
}
