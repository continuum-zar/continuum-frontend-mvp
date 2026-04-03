import { fetchMilestones, fetchProjects } from "@/api/projects";
import { projectSprintHref } from "@/app/data/dashboardPlaceholderProjects";
import type { Milestone } from "@/types/milestone";

/** Same ordering as the left rail sprint list (timeline / due date). */
function sortMilestonesForNav(list: Milestone[]): Milestone[] {
  return [...list].sort((a, b) => {
    const tA = new Date(a.date).getTime();
    const tB = new Date(b.date).getTime();
    if (Number.isNaN(tA) && Number.isNaN(tB)) return 0;
    if (Number.isNaN(tA)) return 1;
    if (Number.isNaN(tB)) return -1;
    return tA - tB;
  });
}

const FALLBACK_WELCOME_BOARD = "/dashboard-placeholder/get-started";

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
