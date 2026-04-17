/** Backend task status: Kanban column id or legacy todo | in_progress | done */
export type TaskStatusAPI = string;

/** UI task status (same as API after mapping); may be a column id for custom boards */
export type TaskStatus = string;

export type ScopeWeight = 'XS' | 'S' | 'M' | 'L' | 'XL';

/** Raw task from API (GET /tasks/, GET /tasks/:id, PATCH /tasks/:id/status) */
export interface TaskAPIResponse {
    id: number;
    title: string;
    description?: string | null;
    status: string;
    project_id: number;
    milestone_id?: number | null;
    assigned_to?: number | null;
    due_date?: string | null;
    /** Estimated effort in hours (time tracking). */
    estimated_hours?: number | null;
    scope_weight?: ScopeWeight | null;
    checklists?: Array<{ id?: string; text: string; done: boolean }> | null;
    created_at?: string;
    updated_at?: string | null;
    attachment_count?: number;
    comment_count?: number;
    project_name?: string | null;
    closure_summary?: string | null;
    linked_repo?: string | null;
    linked_branch?: string | null;
    linked_branch_full_ref?: string | null;
    labels?: string[];
}

/** Attachment item for display (from API or after upload) */
export interface TaskAttachmentItem {
    id: number | string;
    name: string;
    size: string;
    url?: string;
}

/** Task shape used by UI (e.g. ProjectBoard cards) */
export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    scope: ScopeWeight;
    assignees: string[];
    attachments: number;
    comments: number;
    estimatedHours?: number;
    checklists: { total: number; completed: number };
    milestoneId: string;
    /** ISO date from API (`due_date`), for list view */
    dueDate?: string | null;
}

export type ActivityType =
    | 'task_created'
    | 'status_changed'
    | 'assignment_changed'
    | 'comment_added'
    | 'attachment_uploaded'
    | 'hours_logged'
    | 'commit_linked'
    | 'branch_push';

export interface TaskTimelineEntry {
    id: string;
    activity_type: ActivityType;
    user?: {
        id: number;
        username?: string;
        display_name?: string | null;
        name?: string;
        email?: string | null;
    } | null;
    timestamp: string;
    data: Record<string, unknown>;
}
