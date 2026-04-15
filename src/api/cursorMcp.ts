import api from '@/lib/api';
import type { TaskAPIResponse } from '@/types/task';
import type { CommentAPIResponse } from '@/types/comment';

/** Normalized task detail for the Cursor MCP share view. */
export interface CursorMcpTaskDetail {
    task: TaskAPIResponse;
    comments: CommentAPIResponse[];
}

/** Backend `TaskCursorMcpDetail` uses a nested `branch`; list views use flat `linked_*` on the task. */
type CursorMcpBranchPayload = {
    linked_repo: string;
    linked_branch: string;
    linked_branch_full_ref?: string | null;
};

type CursorMcpTaskDetailPayload =
    | (TaskAPIResponse & {
          comments?: CommentAPIResponse[] | null;
          branch?: CursorMcpBranchPayload | null;
      })
    | { task: TaskAPIResponse; comments?: CommentAPIResponse[] | null };

function normalizeCursorMcpTaskDetail(data: CursorMcpTaskDetailPayload): CursorMcpTaskDetail {
    if (data && typeof data === 'object' && 'task' in data && data.task != null) {
        const wrapped = data as { task: TaskAPIResponse; comments?: CommentAPIResponse[] | null };
        return {
            task: wrapped.task,
            comments: Array.isArray(wrapped.comments) ? wrapped.comments : [],
        };
    }
    const flat = data as TaskAPIResponse & {
        comments?: CommentAPIResponse[] | null;
        branch?: CursorMcpBranchPayload | null;
    };
    const { comments, branch, ...rest } = flat;
    const base = rest as TaskAPIResponse;
    const task =
        branch && !base.linked_repo && !base.linked_branch
            ? {
                  ...base,
                  status: base.status ?? 'todo',
                  linked_repo: branch.linked_repo,
                  linked_branch: branch.linked_branch,
                  linked_branch_full_ref: branch.linked_branch_full_ref ?? null,
              }
            : { ...base, status: base.status ?? 'todo' };
    return {
        task,
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
