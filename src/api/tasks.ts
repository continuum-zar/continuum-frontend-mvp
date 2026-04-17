import api from '@/lib/api';
import type { PaginatedResponse } from '@/types/api';
import { mapTask } from '@/api/mappers';
import type { TaskAPIResponse, Task, TaskStatus, ScopeWeight, TaskTimelineEntry } from '@/types/task';
import type { CommentAPIResponse } from '@/types/comment';
import type { AttachmentAPIResponse } from '@/types/attachment';

export type { Task, TaskStatus, TaskAPIResponse, TaskTimelineEntry };

/** Dropdown task shape for time-tracking / task selector (id as string for Select value). */
export interface TaskOption {
    id: string;
    title: string;
    project: string;
    project_id: number;
}

/** Tasks assigned to a given user across all projects the current user can access. */
export async function fetchTasksAssignedToUser(assignedUserId: number): Promise<TaskAPIResponse[]> {
    const { data } = await api.get<PaginatedResponse<TaskAPIResponse>>('/tasks/', {
        params: { assigned_to: assignedUserId, limit: 500, skip: 0 },
    });
    return data.data ?? [];
}

/** Tasks created by a given user across all projects the current user can access. */
export async function fetchTasksCreatedByUser(creatorUserId: number): Promise<TaskAPIResponse[]> {
    const { data } = await api.get<PaginatedResponse<TaskAPIResponse>>('/tasks/', {
        params: { created_by: creatorUserId, limit: 500, skip: 0 },
    });
    return data.data ?? [];
}

/** Fetch all tasks for the current user's projects (no project_id). For time log task dropdown. */
export async function fetchAllTasks(): Promise<TaskOption[]> {
    const { data } = await api.get<PaginatedResponse<TaskAPIResponse>>('/tasks/', {
        params: { limit: 500, skip: 0 },
    });
    return (data.data ?? []).map((t) => ({
        id: String(t.id),
        title: t.title ?? '',
        project: t.project_name ?? '',
        project_id: t.project_id,
    }));
}

/** Fetch a single task by ID. Returns raw API response. */
export async function fetchTask(taskId: number | string): Promise<TaskAPIResponse> {
    const { data } = await api.get<TaskAPIResponse>(`/tasks/${taskId}`);
    return data;
}

/** Checklist item shape for task update (matches API TaskChecklistItem). */
export type TaskChecklistItemUpdate = { id?: string; text: string; done: boolean };

/** Update task with multiple fields. Returns updated task from API. */
export async function updateTask(
    taskId: number | string,
    body: {
        title?: string;
        description?: string | null;
        status?: string;
        scope_weight?: ScopeWeight;
        due_date?: string | null;
        estimated_hours?: number | null;
        linked_repo?: string | null;
        linked_branch?: string | null;
        checklists?: TaskChecklistItemUpdate[];
    }
): Promise<TaskAPIResponse> {
    const payload: Record<
        string,
        TaskStatus | ScopeWeight | string | number | null | TaskChecklistItemUpdate[] | undefined
    > = {};

    if (body.title !== undefined) {
        payload.title = body.title;
    }
    if (body.description !== undefined) {
        payload.description = body.description;
    }
    if (body.status !== undefined) {
        const s = body.status;
        payload.status = s === 'in-progress' ? 'in_progress' : s;
    }
    if (body.scope_weight !== undefined) {
        payload.scope_weight = body.scope_weight;
    }
    if (body.due_date !== undefined) {
        payload.due_date = body.due_date;
    }
    if (body.estimated_hours !== undefined) {
        payload.estimated_hours = body.estimated_hours;
    }
    if (body.linked_repo !== undefined) {
        payload.linked_repo = body.linked_repo;
    }
    if (body.linked_branch !== undefined) {
        payload.linked_branch = body.linked_branch;
    }
    if (body.checklists !== undefined) {
        payload.checklists = body.checklists;
    }

    const { data } = await api.put<TaskAPIResponse>(`/tasks/${taskId}`, payload);
    return data;
}

/** Attach or update the Git branch linked to a task. POST /tasks/{id}/linked-branch */
export async function setTaskLinkedBranch(
    taskId: number | string,
    body: {
        linked_repo: string;
        linked_branch: string;
        linked_branch_full_ref?: string | null;
    }
): Promise<TaskAPIResponse> {
    const payload: {
        linked_repo: string;
        linked_branch: string;
        linked_branch_full_ref?: string | null;
    } = { linked_repo: body.linked_repo, linked_branch: body.linked_branch };
    if (body.linked_branch_full_ref != null && body.linked_branch_full_ref !== '') {
        payload.linked_branch_full_ref = body.linked_branch_full_ref;
    }
    const { data } = await api.post<TaskAPIResponse>(`/tasks/${taskId}/linked-branch`, payload);
    return data;
}

/** Payload for creating a new task. */
export interface CreateTaskBody {
    title: string;
    project_id: number;
    description?: string | null;
    status?: 'todo' | 'in_progress' | 'done';
    scope_weight?: ScopeWeight;
    due_date?: string | null;
    estimated_hours?: number | null;
    assigned_to?: number | null;
    milestone_id?: number | null;
    checklists?: Array<{ text: string; done?: boolean }> | null;
    labels?: string[] | null;
}

/** Create a task. POST /tasks/ */
export async function createTask(body: CreateTaskBody): Promise<TaskAPIResponse> {
    const { data } = await api.post<TaskAPIResponse>('/tasks/', body);
    return data;
}

/** Fetch tasks for a project. Returns UI-shaped tasks. */
export async function fetchProjectTasks(projectId: number | string): Promise<Task[]> {
    const { data } = await api.get<PaginatedResponse<TaskAPIResponse>>(`/tasks/`, {
        params: { project_id: projectId },
    });
    return (data.data ?? []).map(mapTask);
}

/** Paginated project tasks (`GET /tasks/?project_id=&limit=&skip=`). */
export async function fetchProjectTasksPage(
    projectId: number | string,
    opts: { limit: number; skip: number },
): Promise<{ tasks: Task[]; total: number; skip: number; limit: number }> {
    const { data } = await api.get<PaginatedResponse<TaskAPIResponse>>(`/tasks/`, {
        params: { project_id: projectId, limit: opts.limit, skip: opts.skip },
    });
    return {
        tasks: (data.data ?? []).map(mapTask),
        total: data.total,
        skip: data.skip,
        limit: data.limit,
    };
}

/** Update task status. Returns updated task from API. */
export async function updateTaskStatus(
    taskId: number | string,
    status: string
): Promise<TaskAPIResponse> {
    const backendStatus = status === 'in-progress' ? 'in_progress' : status;
    const { data } = await api.patch<TaskAPIResponse>(`/tasks/${taskId}/status`, {
        status: backendStatus,
    });
    return data;
}

type CommentsListPayload =
    | CommentAPIResponse[]
    | { comments?: CommentAPIResponse[]; total?: number; skip?: number; limit?: number };

function parseCommentsPayload(data: CommentsListPayload): CommentAPIResponse[] {
    if (Array.isArray(data)) return data;
    return data?.comments ?? [];
}

/** Fetch comments for a task. Returns raw API comment objects. */
export async function fetchTaskComments(taskId: number | string): Promise<CommentAPIResponse[]> {
    const { data } = await api.get<CommentsListPayload>(`/tasks/${taskId}/comments`);
    return parseCommentsPayload(data);
}

/** Paginated comments when the backend supports `limit` / `skip`; otherwise first page returns the full list. */
export interface TaskCommentsPageResult {
    comments: CommentAPIResponse[];
    total: number;
    hasMore: boolean;
}

export async function fetchTaskCommentsPage(
    taskId: number | string,
    opts: { limit: number; skip: number },
): Promise<TaskCommentsPageResult> {
    const { data } = await api.get<CommentsListPayload>(`/tasks/${taskId}/comments`, {
        params: { limit: opts.limit, skip: opts.skip },
    });
    const comments = parseCommentsPayload(data);
    const loaded = opts.skip + comments.length;
    const total =
        !Array.isArray(data) && typeof data.total === 'number' ? data.total : loaded;
    const hasMore = Array.isArray(data)
        ? false
        : typeof data.total === 'number'
          ? loaded < data.total
          : comments.length === opts.limit;
    return { comments, total, hasMore };
}

/** Post a comment to a task. Returns the created comment. */
export async function createTaskComment(taskId: number | string, content: string): Promise<CommentAPIResponse> {
    const { data } = await api.post<CommentAPIResponse>(`/tasks/${taskId}/comments`, { content });
    return data;
}

/** List attachments response: backend returns { attachments, total }. */
export interface TaskAttachmentsListResponse {
    attachments: AttachmentAPIResponse[];
    total: number;
}

/** Fetch attachments for a task. Returns raw API attachment objects. */
export async function fetchTaskAttachments(taskId: number | string): Promise<AttachmentAPIResponse[]> {
    const { data } = await api.get<TaskAttachmentsListResponse>(`/tasks/${taskId}/attachments`);
    return data?.attachments ?? [];
}

/** Upload an attachment to a task. Returns the created attachment. */
export async function uploadTaskAttachment(taskId: number | string, file: File): Promise<AttachmentAPIResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post<AttachmentAPIResponse>(`/tasks/${taskId}/attachments`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data;
}

/** Add a link (URL) attachment to a task. Returns the created attachment. */
export async function addTaskAttachmentLink(
    taskId: number | string,
    payload: { url: string; name?: string | null }
): Promise<AttachmentAPIResponse> {
    const { data } = await api.post<AttachmentAPIResponse>(`/tasks/${taskId}/attachments/link`, payload);
    return data;
}

/** Delete an attachment. */
export async function deleteAttachment(attachmentId: number | string): Promise<void> {
    await api.delete(`/attachments/${attachmentId}`);
}

/** Download an attachment. Returns the download URL (for display only; use downloadTaskAttachment for actual download with auth). */
export function getAttachmentDownloadUrl(attachmentId: number | string): string {
    return `/api/v1/attachments/${attachmentId}/download`;
}

function parseContentDispositionFilename(headers: Record<string, unknown>): string {
    const contentDisposition = headers?.['content-disposition'];
    let filename = 'attachment';
    if (typeof contentDisposition === 'string') {
        const match =
            contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"'\s;]+)["']?/i) ??
            contentDisposition.match(/filename=["']?([^"'\s;]+)["']?/i);
        if (match?.[1]) filename = decodeURIComponent(match[1].trim());
    }
    return filename;
}

/** Result of downloading an attachment (blob + suggested filename). */
export interface DownloadAttachmentResult {
    blob: Blob;
    filename: string;
}

/** Download an attachment via API (sends auth). Call this then trigger save with the blob/filename. */
export async function downloadTaskAttachment(attachmentId: number | string): Promise<DownloadAttachmentResult> {
    const res = await api.get<Blob>(`/attachments/${attachmentId}/download`, {
        responseType: 'blob',
    });
    const filename = parseContentDispositionFilename(res.headers as Record<string, unknown>);
    return { blob: res.data, filename };
}

type TimelinePayload =
    | TaskTimelineEntry[]
    | { activities?: TaskTimelineEntry[]; total?: number; skip?: number; limit?: number };

function parseTimelinePayload(data: TimelinePayload): TaskTimelineEntry[] {
    if (Array.isArray(data)) return data;
    return data?.activities ?? [];
}

/** Fetch timeline for a task. Returns raw API timeline objects. */
export async function fetchTaskTimeline(taskId: number | string): Promise<TaskTimelineEntry[]> {
    const { data } = await api.get<TimelinePayload>(`/tasks/${taskId}/timeline`);
    return parseTimelinePayload(data);
}

/** Paginated timeline (`GET /tasks/{id}/timeline?limit=&skip=`). */
export interface TaskTimelinePageResult {
    entries: TaskTimelineEntry[];
    total: number;
    hasMore: boolean;
}

export async function fetchTaskTimelinePage(
    taskId: number | string,
    opts: { limit: number; skip: number },
): Promise<TaskTimelinePageResult> {
    const { data } = await api.get<TimelinePayload>(`/tasks/${taskId}/timeline`, {
        params: { limit: opts.limit, skip: opts.skip },
    });
    const entries = parseTimelinePayload(data);
    const loaded = opts.skip + entries.length;
    const total =
        !Array.isArray(data) && typeof data.total === 'number' ? data.total : loaded;
    const hasMore = Array.isArray(data)
        ? false
        : typeof data.total === 'number'
          ? loaded < data.total
          : entries.length === opts.limit;
    return { entries, total, hasMore };
}

/** Assign a task to a user. PATCH /api/v1/tasks/{id}/assign. */
export async function assignTask(taskId: number | string, userId: number | null): Promise<TaskAPIResponse> {
    const { data } = await api.patch<TaskAPIResponse>(`/tasks/${taskId}/assign`, { user_id: userId });
    return data;
}

/** Task context: top relevant source file paths for this task (RAG). GET /tasks/{id}/context */
export interface TaskContextResponse {
    task_id: number;
    relevant_files: string[];
}

export async function getTaskContext(taskId: number | string): Promise<TaskContextResponse> {
    const { data } = await api.get<TaskContextResponse>(`/tasks/${taskId}/context`);
    return data;
}

/** Related tasks (semantically similar). GET /tasks/{id}/related */
export interface RelatedTaskItem {
    task_id: number;
    title: string;
    status: string;
    score: number;
    project_id?: number | null;
}

export interface RelatedTasksResponse {
    task_id: number;
    related: RelatedTaskItem[];
    cross_project: boolean;
}

export async function getRelatedTasks(
    taskId: number | string,
    params?: { limit?: number; cross_project?: boolean }
): Promise<RelatedTasksResponse> {
    const { data } = await api.get<RelatedTasksResponse>(`/tasks/${taskId}/related`, { params });
    return data;
}

/** Regenerate AI closure summary for a task. POST /tasks/{id}/generate-summary */
export async function regenerateTaskSummary(taskId: number | string): Promise<TaskAPIResponse> {
    const { data } = await api.post<TaskAPIResponse>(`/tasks/${taskId}/generate-summary`);
    return data;
}

/** Delete a task. DELETE /tasks/{id}. Requires project admin. */
export async function deleteTask(taskId: number | string): Promise<void> {
    await api.delete(`/tasks/${taskId}`);
}

/** Response shape for task labels endpoints. */
export interface TaskLabelsResponse {
    labels: string[];
}

/** Fetch labels for a task. GET /tasks/{id}/labels */
export async function fetchTaskLabels(taskId: number | string): Promise<TaskLabelsResponse> {
    const { data } = await api.get<TaskLabelsResponse>(`/tasks/${taskId}/labels`);
    return data;
}

/** Add a label to a task. POST /tasks/{id}/labels. Returns updated labels list. */
export async function addTaskLabel(taskId: number | string, label: string): Promise<TaskLabelsResponse> {
    const { data } = await api.post<TaskLabelsResponse>(`/tasks/${taskId}/labels`, { label: label.trim() });
    return data;
}

/** Remove a label from a task. DELETE /tasks/{id}/labels?label=... Returns updated labels list. */
export async function removeTaskLabel(taskId: number | string, label: string): Promise<TaskLabelsResponse> {
    const { data } = await api.delete<TaskLabelsResponse>(`/tasks/${taskId}/labels`, {
        params: { label },
    });
    return data;
}
