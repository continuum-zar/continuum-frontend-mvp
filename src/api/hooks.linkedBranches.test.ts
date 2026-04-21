import { describe, expect, it } from 'vitest';

import { applyLinkedBranchesToTaskResponse } from '@/api/hooks';
import { mapTask } from '@/api/mappers';
import type { Task, TaskAPIResponse } from '@/types/task';

describe('linked branch cache helpers', () => {
    it('applyLinkedBranchesToTaskResponse keeps legacy flat fields in sync with the first link', () => {
        const base: TaskAPIResponse = {
            id: 1,
            title: 'T',
            status: 'todo',
            project_id: 9,
            linked_branches: [],
            linked_repo: null,
            linked_branch: null,
        };
        const next = applyLinkedBranchesToTaskResponse(base, [
            { linked_repo: 'o/r', linked_branch: 'feat', linked_branch_full_ref: 'refs/heads/feat' },
            { linked_repo: 'o/r2', linked_branch: 'main', linked_branch_full_ref: null },
        ]);
        expect(next.linked_branches).toHaveLength(2);
        expect(next.linked_repo).toBe('o/r');
        expect(next.linked_branch).toBe('feat');
        expect(next.linked_branch_full_ref).toBe('refs/heads/feat');
    });

    it('patchTaskInProjectKanbanCaches shape: Task gets linkedBranches via mapTask', () => {
        const api: TaskAPIResponse = {
            id: 42,
            title: 'X',
            status: 'todo',
            project_id: 1,
            linked_branches: [{ linked_repo: 'p/q', linked_branch: 'dev', linked_branch_full_ref: null }],
        };
        const t: Task = mapTask(api);
        expect(t.linkedBranches?.[0]?.linked_branch).toBe('dev');
    });

});
