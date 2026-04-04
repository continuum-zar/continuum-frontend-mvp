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

/** Fetch all tasks for the current user's projects (no project_id). For time log task dropdown. */
export async function fetchAllTasks(): Promise<TaskOption[]> {
    const { data } = await api.get<PaginatedResponse<TaskAPIResponse>>('/tasks/');
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
        status?: TaskStatus;
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
        payload.status = body.status === 'in-progress' ? 'in_progress' : body.status;
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

/** Update task status. Returns updated task from API. */
export async function updateTaskStatus(
    taskId: number | string,
    status: TaskStatus
): Promise<TaskAPIResponse> {
    const backendStatus = status === 'in-progress' ? 'in_progress' : status;
    const { data } = await api.patch<TaskAPIResponse>(`/tasks/${taskId}/status`, {
        status: backendStatus,
    });
    return data;
}

/** Fetch comments for a task. Returns raw API comment objects. */
export async function fetchTaskComments(taskId: number | string): Promise<CommentAPIResponse[]> {
    const { data } = await api.get<
        CommentAPIResponse[] | { comments?: CommentAPIResponse[] }
    >(`/tasks/${taskId}/comments`);
    if (Array.isArray(data)) return data;
    return data?.comments ?? [];
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

/** Fetch timeline for a task. Returns raw API timeline objects. */
export async function fetchTaskTimeline(taskId: number | string): Promise<TaskTimelineEntry[]> {
    const { data } = await api.get<
        TaskTimelineEntry[] | { activities?: TaskTimelineEntry[]; total?: number; skip?: number; limit?: number }
    >(`/tasks/${taskId}/timeline`);
    if (Array.isArray(data)) return data;
    return data?.activities ?? [];
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
