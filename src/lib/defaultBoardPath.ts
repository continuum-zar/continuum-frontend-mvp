import { fetchMilestones, fetchProjects } from "@/api/projects";
import { projectSprintHref } from "@/app/data/dashboardPlaceholderProjects";
import { sortMilestonesForNav } from "@/lib/milestoneSort";
import { WORKSPACE_SPRINT_SEGMENT, workspaceJoin } from "@/lib/workspacePaths";

const FALLBACK_WELCOME_BOARD = workspaceJoin(WORKSPACE_SPRINT_SEGMENT);

/**
 * Where to send the user so they land on the tasks (Kanban) board:
 * - No API projects → static Welcome “Get started” board.
 * - Has projects → first project’s board, scoped to the first milestone when any exist.
 */
export async function resolveDefaultBoardPath(): Promise<string> {
  try {
    const projects = await fetchProjects();
    if (projects.length === 0) {
      return FALLBACK_WELCOME_BOARD;
    }
    const first = projects[0];
    const milestones = await fetchMilestones(first.apiId);
    const sorted = sortMilestonesForNav(milestones);
    const firstMilestoneId = sorted[0]?.id;
    return projectSprintHref(String(first.apiId), firstMilestoneId);
  } catch {
    return FALLBACK_WELCOME_BOARD;
  }
}

/**
 * Dashboard-placeholder sprint/Kanban URL for a specific project (same rules as default board pick).
 */
export async function resolveProjectBoardPath(projectId: string | number): Promise<string> {
  const id = String(projectId);
  try {
    const milestones = await fetchMilestones(id);
    const sorted = sortMilestonesForNav(milestones);
    const firstMilestoneId = sorted[0]?.id;
    return projectSprintHref(id, firstMilestoneId);
  } catch {
    return projectSprintHref(id);
  }
}
