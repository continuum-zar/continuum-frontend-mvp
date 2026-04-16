import api from '@/lib/api';
import type { TaskAPIResponse } from '@/types/task';
import type { CommentAPIResponse } from '@/types/comment';

/** Normalized task detail for the Cursor MCP share view. */
export interface CursorMcpTaskDetail {
    task: TaskAPIResponse;
    comments: CommentAPIResponse[];
}

/** Shape returned by the backend `GET /tasks/{id}/cursor-mcp` endpoint. */
export interface TaskCursorMcpApiResponse {
    id: number;
    project_id: number;
    title: string;
    description: string | null;
    checklists: Array<{ id?: string; text: string; done: boolean }> | null;
    branch: {
        linked_repo: string;
        linked_branch: string;
        linked_branch_full_ref?: string | null;
        identifier: string;
    } | null;
    comments: CommentAPIResponse[] | null;
}

/**
 * Type guard: returns `true` when `data` matches the backend
 * `TaskCursorMcpDetail` shape (has `checklists` + `branch` + `comments`,
 * does NOT have `status` — which distinguishes it from a full `TaskAPIResponse`).
 */
export function isTaskCursorMcpApiResponse(data: unknown): data is TaskCursorMcpApiResponse {
    if (data == null || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    if ('status' in obj) return false;
    if ('task' in obj) return false;
    return 'id' in obj && 'project_id' in obj && 'title' in obj && 'checklists' in obj;
}

/**
 * Map the backend `TaskCursorMcpDetail` payload to the frontend
 * `CursorMcpTaskDetail` by flattening branch fields onto a task-like object.
 */
export function mapTaskCursorMcpApiToDetail(data: TaskCursorMcpApiResponse): CursorMcpTaskDetail {
    const { branch, comments, ...rest } = data;
    const base: TaskAPIResponse = {
        ...rest,
        status: 'todo' as const,
        checklists: rest.checklists ?? undefined,
        linked_repo: branch?.linked_repo ?? null,
        linked_branch: branch?.linked_branch ?? null,
        linked_branch_full_ref: branch?.linked_branch_full_ref ?? null,
    };
    return {
        task: base,
        comments: Array.isArray(comments) ? comments : [],
    };
}

type CursorMcpTaskDetailPayload =
    | TaskCursorMcpApiResponse
    | (TaskAPIResponse & { comments?: CommentAPIResponse[] | null })
    | { task: TaskAPIResponse; comments?: CommentAPIResponse[] | null };

function normalizeCursorMcpTaskDetail(data: CursorMcpTaskDetailPayload): CursorMcpTaskDetail {
    if (isTaskCursorMcpApiResponse(data)) {
        return mapTaskCursorMcpApiToDetail(data);
    }
    if (data && typeof data === 'object' && 'task' in data && data.task != null) {
        const wrapped = data as { task: TaskAPIResponse; comments?: CommentAPIResponse[] | null };
        return {
            task: wrapped.task,
            comments: Array.isArray(wrapped.comments) ? wrapped.comments : [],
        };
    }
    const flat = data as TaskAPIResponse & { comments?: CommentAPIResponse[] | null };
    const { comments, ...rest } = flat;
    return {
        task: rest as TaskAPIResponse,
        comments: Array.isArray(comments) ? comments : [],
    };
}

/**
 * Aggregated task payload for Cursor MCP (title, description, checklists, branch, comments).
 * GET /api/v1/tasks/:id/cursor-mcp
 */
export async function fetchCursorMcpTaskDetail(taskId: number | string): Promise<CursorMcpTaskDetail> {
    const { data } = await api.get<CursorMcpTaskDetailPayload>(`/tasks/${encodeURIComponent(String(taskId))}/cursor-mcp`);
    return normalizeCursorMcpTaskDetail(data);
}
