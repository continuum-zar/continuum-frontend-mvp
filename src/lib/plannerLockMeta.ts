import { fetchProjectKanbanBoard } from '@/api/projects';
import { fetchProjectTasksRaw } from '@/api/tasks';
import api from '@/lib/api';
import type { KanbanBoardColumnApi } from '@/types/kanban';
import type { MilestoneAPIResponse, MilestoneStatusAPI } from '@/types/milestone';
import type { TaskAPIResponse } from '@/types/task';

const LEGACY_SEMANTIC = new Set(['todo', 'in_progress', 'done']);

function columnKind(col: KanbanBoardColumnApi): string {
    return col.kind || col.task_status || 'todo';
}

/** Map stored task.status to semantic bucket (matches backend kanban_status.semantic_for_stored). */
export function semanticForStored(columns: KanbanBoardColumnApi[], stored: string | null | undefined): string {
    if (!stored) return 'todo';
    for (const col of columns) {
        const cid = col.id;
        if (cid && stored === String(cid)) {
            const k = columnKind(col);
            if (LEGACY_SEMANTIC.has(k)) return k;
            return k;
        }
    }
    if (LEGACY_SEMANTIC.has(stored)) return stored;
    for (const col of columns) {
        if (col.task_status === stored) return columnKind(col);
    }
    return 'todo';
}

export function taskLockedFromSemantic(semantic: string): boolean {
    return semantic === 'in_progress' || semantic === 'done';
}

export function milestoneLockedFromStatus(status: MilestoneStatusAPI | string | undefined): boolean {
    const s = (status ?? 'not_started').toLowerCase();
    return s === 'in_progress' || s === 'completed' || s === 'overdue';
}

export interface PlannerLockMeta {
    lockedTaskIds: Set<number>;
    lockedMilestoneIds: Set<number>;
}

export async function fetchPlannerLockMeta(projectId: number): Promise<PlannerLockMeta> {
    const [columns, tasks, milestonesRes] = await Promise.all([
        fetchProjectKanbanBoard(projectId),
        fetchProjectTasksRaw(projectId),
        api.get<MilestoneAPIResponse[]>(`/projects/${projectId}/milestones`),
    ]);
    const milestones = Array.isArray(milestonesRes.data) ? milestonesRes.data : [];

    const lockedTaskIds = new Set<number>();
    for (const t of tasks) {
        const sem = semanticForStored(columns, t.status);
        if (taskLockedFromSemantic(sem)) lockedTaskIds.add(t.id);
    }

    const lockedMilestoneIds = new Set<number>();
    for (const m of milestones) {
        if (milestoneLockedFromStatus(m.status)) lockedMilestoneIds.add(m.id);
    }

    return { lockedTaskIds, lockedMilestoneIds };
}

/** Task lock meta from raw rows + board (for tests / callers that already fetched). */
export function plannerLockMetaFromRows(
    columns: KanbanBoardColumnApi[],
    tasks: TaskAPIResponse[],
    milestones: MilestoneAPIResponse[],
): PlannerLockMeta {
    const lockedTaskIds = new Set<number>();
    for (const t of tasks) {
        const sem = semanticForStored(columns, t.status);
        if (taskLockedFromSemantic(sem)) lockedTaskIds.add(t.id);
    }
    const lockedMilestoneIds = new Set<number>();
    for (const m of milestones) {
        if (milestoneLockedFromStatus(m.status)) lockedMilestoneIds.add(m.id);
    }
    return { lockedTaskIds, lockedMilestoneIds };
}
