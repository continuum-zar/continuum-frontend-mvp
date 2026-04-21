import { describe, expect, it } from 'vitest';
import { getTaskLinkedBranches, type TaskAPIResponse } from './task';

const base: TaskAPIResponse = {
    id: 1,
    title: 'T',
    status: 'todo',
    project_id: 1,
};

describe('getTaskLinkedBranches', () => {
    it('prefers linked_branches when non-empty', () => {
        const task: TaskAPIResponse = {
            ...base,
            linked_branches: [
                { linked_repo: 'a/b', linked_branch: 'main', linked_branch_full_ref: 'refs/heads/main' },
                { linked_repo: 'c/d', linked_branch: 'feat', linked_branch_full_ref: null },
            ],
            linked_repo: 'legacy',
            linked_branch: 'legacy-b',
        };
        const out = getTaskLinkedBranches(task);
        expect(out).toHaveLength(2);
        expect(out[0].linked_repo).toBe('a/b');
        expect(out[1].linked_branch).toBe('feat');
    });

    it('falls back to legacy flat fields when linked_branches is absent', () => {
        const task: TaskAPIResponse = {
            ...base,
            linked_repo: 'org/r',
            linked_branch: 'dev',
            linked_branch_full_ref: 'refs/heads/dev',
        };
        expect(getTaskLinkedBranches(task)).toEqual([
            {
                linked_repo: 'org/r',
                linked_branch: 'dev',
                linked_branch_full_ref: 'refs/heads/dev',
            },
        ]);
    });

    it('returns empty when nothing is linked', () => {
        expect(getTaskLinkedBranches({ ...base })).toEqual([]);
        expect(getTaskLinkedBranches({ ...base, linked_branches: [] })).toEqual([]);
    });
});
