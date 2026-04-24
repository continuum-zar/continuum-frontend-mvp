import type { GitContributionRead } from '@/api/gitContributions';

/** Matches GET /projects/{id}/welcome-recent-activity discriminated items. */
export type WelcomeRecentActivityTaskStatusItem = {
    type: 'task_status';
    task_id: number;
    task_title: string;
    from_column: string;
    to_column: string;
    user_id: number | null;
    user_name: string | null;
    created_at: string;
};

export type WelcomeRecentActivityCommitItem = {
    type: 'commit';
    contribution: GitContributionRead;
};

export type WelcomeRecentActivityFeedItem = WelcomeRecentActivityCommitItem | WelcomeRecentActivityTaskStatusItem;

export interface WelcomeRecentActivityFeedResponse {
    items: WelcomeRecentActivityFeedItem[];
}

export function welcomeRecentActivityFeedItemKey(item: WelcomeRecentActivityFeedItem, index: number): string {
    if (item.type === 'commit') return `commit-${item.contribution.id}`;
    return `task-${item.task_id}-${item.created_at}-${index}`;
}
