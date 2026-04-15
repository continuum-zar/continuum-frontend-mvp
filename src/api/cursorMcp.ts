import api from '@/lib/api';
import type { TaskAPIResponse } from '@/types/task';
import type { CommentAPIResponse } from '@/types/comment';

/** Normalized task detail for the Cursor MCP share view. */
export interface CursorMcpTaskDetail {
    task: TaskAPIResponse;
    comments: CommentAPIResponse[];
}

type CursorMcpTaskDetailPayload =
    | (TaskAPIResponse & { comments?: CommentAPIResponse[] | null })
    | { task: TaskAPIResponse; comments?: CommentAPIResponse[] | null };

function normalizeCursorMcpTaskDetail(data: CursorMcpTaskDetailPayload): CursorMcpTaskDetail {
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
 * GET /api/v1/cursor-mcp/task/:id
 */
export async function fetchCursorMcpTaskDetail(taskId: number | string): Promise<CursorMcpTaskDetail> {
    const { data } = await api.get<CursorMcpTaskDetailPayload>(`/cursor-mcp/task/${taskId}`);
    return normalizeCursorMcpTaskDetail(data);
}
