import api from '@/lib/api';
import { projectMainHref } from '@/app/data/dashboardPlaceholderProjects';
import { workspaceJoin } from '@/lib/workspacePaths';

export interface NotificationActorAPI {
    id: number;
    display_name?: string | null;
    username?: string | null;
}

export type UserNotificationType = 'comment_mention';

/** One in-app mention notification (GET /me/notifications) — an @mention in a task comment. */
export interface UserNotificationItem {
    id: number;
    type: UserNotificationType;
    project_id: number;
    task_id: number;
    comment_id?: number | null;
    title: string;
    body: string;
    actor?: NotificationActorAPI | null;
    created_at: string;
    /** Backend-supplied relative href (non-workspace); prefer mentionNotificationHref(). */
    href: string;
}

interface UserNotificationListResponse {
    items: UserNotificationItem[];
    total: number;
    skip: number;
    limit: number;
}

export const notificationKeys = {
    all: ['notifications'] as const,
    mine: (projectId?: number | string | null) =>
        [...notificationKeys.all, 'mine', projectId ?? 'all'] as const,
};

/** List the signed-in user's mention notifications, optionally scoped to one project. */
export async function fetchMyNotifications(opts?: {
    projectId?: number | string | null;
    limit?: number;
    skip?: number;
}): Promise<UserNotificationListResponse> {
    const params: Record<string, number | string> = {
        limit: opts?.limit ?? 50,
        skip: opts?.skip ?? 0,
    };
    if (opts?.projectId != null && opts.projectId !== '') {
        params.project_id = Number(opts.projectId);
    }
    const { data } = await api.get<UserNotificationListResponse>('/users/me/notifications', {
        params,
    });
    return data ?? { items: [], total: 0, skip: 0, limit: params.limit as number };
}

/**
 * Build an in-app (react-router) deep-link for a mention notification — opens the
 * task the comment lives on. Built client-side so links stay on the canonical
 * `/workspace/...` routes (the backend `href` uses legacy `/projects/...`).
 */
export function mentionNotificationHref(item: UserNotificationItem): string {
    if (item.task_id != null) {
        return workspaceJoin('task', String(item.task_id));
    }
    return projectMainHref(String(item.project_id));
}
