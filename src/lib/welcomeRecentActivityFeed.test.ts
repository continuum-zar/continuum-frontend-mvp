import { describe, expect, it } from 'vitest';
import { welcomeRecentActivityFeedItemKey, type WelcomeRecentActivityFeedItem } from './welcomeRecentActivityFeed';

describe('welcomeRecentActivityFeedItemKey', () => {
    it('uses contribution id for commit items', () => {
        const item: WelcomeRecentActivityFeedItem = {
            type: 'commit',
            contribution: {
                id: 42,
                project_id: 1,
                user_id: 2,
                commit_hash: 'abc',
                provider: 'github',
                confidence_score: 0,
                created_at: '2026-01-01T00:00:00Z',
            },
        };
        expect(welcomeRecentActivityFeedItemKey(item, 0)).toBe('commit-42');
    });

    it('uses task id, timestamp, and index for task_status items', () => {
        const item: WelcomeRecentActivityFeedItem = {
            type: 'task_status',
            task_id: 7,
            task_title: 'Fix bug',
            from_column: 'To-do',
            to_column: 'In Progress',
            user_id: 3,
            user_name: 'Alex',
            created_at: '2026-02-02T12:00:00Z',
        };
        expect(welcomeRecentActivityFeedItemKey(item, 2)).toBe('task-7-2026-02-02T12:00:00Z-2');
    });
});
