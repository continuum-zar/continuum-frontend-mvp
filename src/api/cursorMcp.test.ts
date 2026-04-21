import { describe, expect, it } from 'vitest';
import {
    isTaskCursorMcpApiResponse,
    mapTaskCursorMcpApiToDetail,
    type TaskCursorMcpApiResponse,
} from './cursorMcp';

describe('mapTaskCursorMcpApiToDetail', () => {
    it('maps branch onto flat task fields and preserves comments', () => {
        const api: TaskCursorMcpApiResponse = {
            id: 535,
            project_id: 7,
            title: 'Ship MCP',
            description: 'Body',
            checklists: [{ id: '1', text: 'Step', done: false }],
            branch: {
                linked_repo: 'org/r',
                linked_branch: 'feat',
                linked_branch_full_ref: 'refs/heads/feat',
                identifier: 'refs/heads/feat',
            },
            comments: [
                {
                    id: 1,
                    content: 'Note',
                    author: { id: 2, display_name: 'Dev', username: 'dev' },
                    created_at: '2026-01-01T00:00:00Z',
                },
            ],
        };
        const out = mapTaskCursorMcpApiToDetail(api);
        expect(out.task.linked_branches).toHaveLength(1);
        expect(out.task.linked_branches?.[0].linked_repo).toBe('org/r');
        expect(out.task.linked_repo).toBe('org/r');
        expect(out.task.linked_branch).toBe('feat');
        expect(out.task.linked_branch_full_ref).toBe('refs/heads/feat');
        expect(out.task.status).toBe('todo');
        expect(out.comments).toHaveLength(1);
        expect(out.comments[0].content).toBe('Note');
    });

    it('handles missing branch and comments', () => {
        const out = mapTaskCursorMcpApiToDetail({
            id: 1,
            project_id: 2,
            title: 'T',
            description: null,
            checklists: [],
            branch: null,
            comments: null,
        });
        expect(out.task.linked_repo).toBeNull();
        expect(out.task.linked_branches).toBeNull();
        expect(out.comments).toEqual([]);
    });

    it('maps branches array onto linked_branches and legacy first row', () => {
        const out = mapTaskCursorMcpApiToDetail({
            id: 2,
            project_id: 3,
            title: 'Multi',
            description: null,
            checklists: [],
            branches: [
                {
                    linked_repo: 'x/a',
                    linked_branch: 'b1',
                    linked_branch_full_ref: 'refs/heads/b1',
                    identifier: 'refs/heads/b1',
                },
                {
                    linked_repo: 'x/b',
                    linked_branch: 'b2',
                    identifier: 'refs/heads/b2',
                },
            ],
            comments: [],
        });
        expect(out.task.linked_branches).toHaveLength(2);
        expect(out.task.linked_repo).toBe('x/a');
        expect(out.task.linked_branch).toBe('b1');
        expect(out.task.linked_branches?.[1].linked_branch).toBe('b2');
    });
});

describe('isTaskCursorMcpApiResponse', () => {
    it('returns true for backend TaskCursorMcpDetail shape', () => {
        expect(
            isTaskCursorMcpApiResponse({
                id: 1,
                project_id: 2,
                title: 'x',
                description: null,
                checklists: [],
                branch: null,
                comments: [],
            }),
        ).toBe(true);
    });

    it('returns false when status is present (full task payload)', () => {
        expect(
            isTaskCursorMcpApiResponse({
                id: 1,
                project_id: 2,
                title: 'x',
                status: 'todo',
            }),
        ).toBe(false);
    });

    it('returns false for wrapped legacy payload', () => {
        expect(
            isTaskCursorMcpApiResponse({
                task: { id: 1, project_id: 2, title: 'x', status: 'todo' },
                comments: [],
            }),
        ).toBe(false);
    });

    it('returns false for non-objects', () => {
        expect(isTaskCursorMcpApiResponse(null)).toBe(false);
        expect(isTaskCursorMcpApiResponse(undefined)).toBe(false);
        expect(isTaskCursorMcpApiResponse('x')).toBe(false);
    });
});
