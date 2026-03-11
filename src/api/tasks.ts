import api from '@/lib/api';
import { mapTask } from '@/api/mappers';
import type { TaskAPIResponse, Task, TaskStatus, ScopeWeight, TaskTimelineEntry } from '@/types/task';
import type { CommentAPIResponse } from '@/types/comment';
import type { AttachmentAPIResponse } from '@/types/attachment';

export type { Task, TaskStatus, TaskAPIResponse, TaskTimelineEntry };

/** Fetch a single task by ID. Returns raw API response. */
export async function fetchTask(taskId: number | string): Promise<TaskAPIResponse> {
    const { data } = await api.get<TaskAPIResponse>(`/tasks/${taskId}`);
    return data;
}

/** Update task with multiple fields (status, scope_weight, due_date). Returns updated task from API. */
export async function updateTask(
    taskId: number | string,
    body: {
        status?: TaskStatus;
        scope_weight?: ScopeWeight;
        due_date?: string | null;
    }
): Promise<TaskAPIResponse> {
    const payload: Record<string, TaskStatus | ScopeWeight | string | null> = {};

    if (body.status !== undefined) {
        payload.status = body.status === 'in-progress' ? 'in_progress' : body.status;
    }
    if (body.scope_weight !== undefined) {
        payload.scope_weight = body.scope_weight;
    }
    if (body.due_date !== undefined) {
        payload.due_date = body.due_date;
    }

    const { data } = await api.put<TaskAPIResponse>(`/tasks/${taskId}`, payload);
    return data;
}

/** Fetch tasks for a project. Returns UI-shaped tasks. */
export async function fetchProjectTasks(projectId: number | string): Promise<Task[]> {
    const { data } = await api.get<TaskAPIResponse[]>(`/tasks/`, {
        params: { project_id: projectId },
    });
    return (data ?? []).map(mapTask);
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
    const { data } = await api.get<CommentAPIResponse[]>(`/tasks/${taskId}/comments`);
    return data ?? [];
}

/** Post a comment to a task. Returns the created comment. */
export async function createTaskComment(taskId: number | string, content: string): Promise<CommentAPIResponse> {
    const { data } = await api.post<CommentAPIResponse>(`/tasks/${taskId}/comments`, { content });
    return data;
}

/** Fetch attachments for a task. Returns raw API attachment objects. */
export async function fetchTaskAttachments(taskId: number | string): Promise<AttachmentAPIResponse[]> {
    const { data } = await api.get<AttachmentAPIResponse[]>(`/tasks/${taskId}/attachments`);
    return data ?? [];
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

/** Delete an attachment. */
export async function deleteAttachment(attachmentId: number | string): Promise<void> {
    await api.delete(`/attachments/${attachmentId}`);
}

/** Download an attachment. Returns the download URL. */
export function getAttachmentDownloadUrl(attachmentId: number | string): string {
    return `/api/v1/attachments/${attachmentId}/download`;
}

/** Fetch timeline for a task. Returns raw API timeline objects. */
export async function fetchTaskTimeline(taskId: number | string): Promise<TaskTimelineEntry[]> {
    const { data } = await api.get<TaskTimelineEntry[]>(`/tasks/${taskId}/timeline`);
    return data ?? [];
}

/** Assign a task to a user. PATCH /api/v1/tasks/{id}/assign. */
export async function assignTask(taskId: number | string, userId: number | null): Promise<TaskAPIResponse> {
    const { data } = await api.patch<TaskAPIResponse>(`/tasks/${taskId}/assign`, { user_id: userId });
    return data;
}
