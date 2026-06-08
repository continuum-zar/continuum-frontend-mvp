import { describe, expect, it } from 'vitest';

import { ensureUniqueTaskLinkedBranches, DuplicateTaskLinkedBranchError } from '@/api/tasks';

describe('ensureUniqueTaskLinkedBranches', () => {
    it('trims values and preserves metadata', () => {
        const rows = ensureUniqueTaskLinkedBranches([
            {
                id: 7,
                linked_repo: ' owner/repo ',
                linked_branch: ' feature-1 ',
                linked_branch_full_ref: ' refs/heads/feature-1 ',
            },
        ]);
        expect(rows).toEqual([
            {
                id: 7,
                linked_repo: 'owner/repo',
                linked_branch: 'feature-1',
                linked_branch_full_ref: 'refs/heads/feature-1',
            },
        ]);
    });

    it('throws when a repository-branch pair already exists (case-insensitive)', () => {
        expect(() =>
            ensureUniqueTaskLinkedBranches([
                { linked_repo: 'Owner/Repo', linked_branch: 'Feature' },
                { linked_repo: 'owner/repo', linked_branch: 'feature' },
            ]),
        ).toThrowError(DuplicateTaskLinkedBranchError);
    });
});
