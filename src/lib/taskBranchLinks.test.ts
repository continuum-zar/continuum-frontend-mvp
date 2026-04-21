import { describe, expect, it } from 'vitest';

import { linkedBranchBrowseUrl, linkedBranchChipLabel } from './taskBranchLinks';

describe('taskBranchLinks', () => {
    it('linkedBranchBrowseUrl builds GitHub tree URLs for owner/repo', () => {
        expect(
            linkedBranchBrowseUrl({
                linked_repo: 'acme/app',
                linked_branch: 'feature/x',
            }),
        ).toBe('https://github.com/acme/app/tree/feature%2Fx');
    });

    it('linkedBranchBrowseUrl returns null for non owner/repo shapes', () => {
        expect(
            linkedBranchBrowseUrl({
                linked_repo: 'https://example.com/r.git',
                linked_branch: 'main',
            }),
        ).toBeNull();
    });

    it('linkedBranchChipLabel truncates long repo names', () => {
        const label = linkedBranchChipLabel(
            {
                linked_repo: 'very-long-organization-name/repo-name',
                linked_branch: 'main',
            },
            18,
        );
        expect(label.length).toBeLessThanOrEqual(24);
        expect(label).toContain('@main');
    });
});
