/** Backend task status: Kanban column id or legacy todo | in_progress | done */
export type TaskStatusAPI = string;

/** UI task status (same as API after mapping); may be a column id for custom boards */
export type TaskStatus = string;

export type ScopeWeight = 'XS' | 'S' | 'M' | 'L' | 'XL';

/** Task priority — maps to flag colors in the UI (red, yellow, green, blue). */
export type TaskPriority = 'high' | 'medium' | 'low' | 'info';

export const TASK_PRIORITY_OPTIONS: {
    value: TaskPriority;
    label: string;
    /** Tailwind text color for the flag icon */
    flagColorClass: string;
}[] = [
    { value: 'high', label: 'High', flagColorClass: 'text-red-500' },
    { value: 'medium', label: 'Medium', flagColorClass: 'text-yellow-500' },
    { value: 'low', label: 'Low', flagColorClass: 'text-green-500' },
    { value: 'info', label: 'Info', flagColorClass: 'text-blue-500' },
];

export function taskPriorityLabel(p: string | null | undefined): string {
    const row = TASK_PRIORITY_OPTIONS.find((o) => o.value === p);
    return row?.label ?? 'Medium';
}

/** Tailwind classes for Lucide `Flag` — matches `TASK_PRIORITY_OPTIONS`; neutral gray when unset or unknown. */
export function taskPriorityFlagClass(priority?: TaskPriority | null): string {
    if (priority == null) return 'text-[#606d76]';
    return TASK_PRIORITY_OPTIONS.find((o) => o.value === priority)?.flagColorClass ?? 'text-[#606d76]';
}

/** One Git repo + branch pair linked to a task (GET/PUT task payloads). */
export interface TaskLinkedBranch {
    id?: number;
    linked_repo: string;
    linked_branch: string;
    linked_branch_full_ref?: string | null;
}

/** Raw task from API (GET /tasks/, GET /tasks/:id, PATCH /tasks/:id/status) */
export interface TaskAPIResponse {
    id: number;
    title: string;
    description?: string | null;
    status: string;
    project_id: number;
    milestone_id?: number | null;
    assigned_to?: number | null;
    /** Canonical multi-assign list from the API (`GET`/`PATCH` task payloads). */
    assignee_ids?: number[] | null;
    /** When the API supports multi-assign, all assignee user ids (preferred over `assigned_to` alone). */
    assigned_user_ids?: number[] | null;
    due_date?: string | null;
    /** Estimated effort in hours (time tracking). */
    estimated_hours?: number | null;
    scope_weight?: ScopeWeight | null;
    priority?: TaskPriority | null;
    checklists?: Array<{ id?: string; text: string; done: boolean }> | null;
    created_at?: string;
    updated_at?: string | null;
    attachment_count?: number;
    comment_count?: number;
    project_name?: string | null;
    closure_summary?: string | null;
    /** All linked repo/branch pairs (preferred). */
    linked_branches?: TaskLinkedBranch[] | null;
    /**
     * Legacy single link — still returned by some endpoints; use `linked_branches` when present.
     * When only these are set, `getTaskLinkedBranches` synthesizes one entry.
     */
    linked_repo?: string | null;
    linked_branch?: string | null;
    linked_branch_full_ref?: string | null;
    labels?: string[];
}

/**
 * Normalized list of linked branches for a task: prefers `linked_branches`, otherwise builds
 * one entry from legacy `linked_repo` / `linked_branch` when both are set.
 */
export function getTaskLinkedBranches(task: TaskAPIResponse): TaskLinkedBranch[] {
    const rows = task.linked_branches;
    if (Array.isArray(rows) && rows.length > 0) {
        return rows.filter(
            (b) =>
                b != null &&
                typeof b.linked_repo === 'string' &&
                b.linked_repo.trim() !== '' &&
                typeof b.linked_branch === 'string' &&
                b.linked_branch.trim() !== '',
        );
    }
    const lr = task.linked_repo?.trim();
    const lb = task.linked_branch?.trim();
    if (lr && lb) {
        return [
            {
                linked_repo: lr,
                linked_branch: lb,
                linked_branch_full_ref: task.linked_branch_full_ref ?? null,
            },
        ];
    }
    return [];
}

/** Resolved assignee user ids for a task (multi-assign from `assignee_ids` / `assigned_user_ids`). */
export function getTaskAssigneeUserIds(
    task: Pick<TaskAPIResponse, 'assignee_ids' | 'assigned_to' | 'assigned_user_ids'>,
): number[] {
    const fromApi = task.assignee_ids;
    if (Array.isArray(fromApi) && fromApi.length > 0) {
        const deduped = [...new Set(fromApi.filter((id) => typeof id === 'number' && Number.isFinite(id)))];
        return deduped.sort((a, b) => a - b);
    }
    const raw = task.assigned_user_ids;
    if (Array.isArray(raw) && raw.length > 0) {
        const deduped = [...new Set(raw.filter((id) => typeof id === 'number' && Number.isFinite(id)))];
        return deduped.sort((a, b) => a - b);
    }
    if (task.assigned_to != null && Number.isFinite(task.assigned_to)) {
        return [task.assigned_to];
    }
    return [];
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
    priority?: TaskPriority;
    assignees: string[];
    attachments: number;
    comments: number;
    estimatedHours?: number;
    checklists: { total: number; completed: number };
    milestoneId: string;
    /** ISO date from API (`due_date`), for list view */
    dueDate?: string | null;
    /** ISO timestamp from API (`created_at`) when present — used for Gantt start. */
    createdAtIso?: string | null;
    /** Repo/branch links for Kanban badges (from `linked_branches` or legacy fields). */
    linkedBranches?: TaskLinkedBranch[];
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
