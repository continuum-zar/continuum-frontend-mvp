/** Backend milestone status (API) */
export type MilestoneStatusAPI = 'not_started' | 'in_progress' | 'completed' | 'overdue';

/** Frontend milestone status (display) */
export type MilestoneStatus = 'upcoming' | 'active' | 'completed' | 'overdue';

/** Progress payload from milestone list/detail (scope-weighted completion). */
export interface MilestoneProgressPayload {
    total_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    todo_tasks: number;
    completion_percentage: number;
    completed_weight?: number;
    total_weight?: number;
}

/** Raw milestone from API (GET /projects/:id/milestones, POST /milestones/) */
export interface MilestoneAPIResponse {
    id: number;
    project_id: number;
    name: string;
    due_date?: string | null;
    description?: string | null;
    status: MilestoneStatusAPI;
    created_at?: string;
    updated_at?: string | null;
    progress?: MilestoneProgressPayload | null;
}

/** Milestone shape used by UI (e.g. ProjectBoard timeline) */
export interface Milestone {
    id: string;
    name: string;
    date: string;
    status: MilestoneStatus;
    desc?: string;
    /** Raw `due_date` from API (YYYY-MM-DD) for timeline formatting */
    dueDateIso?: string | null;
    progress?: MilestoneProgressPayload | null;
}
