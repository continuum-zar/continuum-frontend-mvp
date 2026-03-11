/** Backend task status (API) */
export type TaskStatusAPI = 'todo' | 'in_progress' | 'done';

/** Frontend task status (display) */
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export type ScopeWeight = 'XS' | 'S' | 'M' | 'L' | 'XL';

/** Raw task from API (GET /tasks/, GET /tasks/:id, PATCH /tasks/:id/status) */
export interface TaskAPIResponse {
    id: number;
    title: string;
    description?: string | null;
    status: TaskStatusAPI;
    project_id: number;
    milestone_id?: number | null;
    assigned_to?: number | null;
    due_date?: string | null;
    scope_weight?: ScopeWeight | null;
    checklists?: Array<{ id?: string; text: string; done: boolean }> | null;
    created_at?: string;
    updated_at?: string | null;
    attachment_count?: number;
    comment_count?: number;
    project_name?: string | null;
    closure_summary?: string | null;
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
}

export type ActivityType = | 'task_created' | 'status_changed' | 'comment_added' | 'attachment_uploaded' | 'hours_logged';

export interface TaskTimelineEntry {
    id: number;
    activity_type: ActivityType;
    user: {
        id: number;
        username: string;
        display_name: string | null;
    };
    timestamp: string;
    data: Record<string, unknown>;
}
