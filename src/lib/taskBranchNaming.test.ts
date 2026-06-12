import { describe, expect, it } from 'vitest';

import {
  appendLinkedBranchDeduped,
  branchNameFromTaskTitle,
  isDuplicateRepoBranchLink,
  repositoryLinkedName,
} from '@/lib/taskBranchNaming';
import type { Repository } from '@/types/repository';
import type { TaskLinkedBranch } from '@/types/task';

describe('branchNameFromTaskTitle', () => {
  it('replaces spaces with hyphens', () => {
    expect(branchNameFromTaskTitle('Fix login bug', 12)).toBe('Fix-login-bug');
  });

  it('sanitizes invalid characters and keeps slashes', () => {
    expect(branchNameFromTaskTitle('feat: hello/world #99', 1)).toBe('feat-hello/world-99');
  });

  it('falls back to task id when title is empty', () => {
    expect(branchNameFromTaskTitle('', 'abc')).toBe('task-abc');
    expect(branchNameFromTaskTitle('   ', 7)).toBe('task-7');
  });

  it('collapses consecutive hyphens', () => {
    expect(branchNameFromTaskTitle('a   b', 1)).toBe('a-b');
  });

  it('preserves slashes after sanitization edge cases', () => {
    expect(branchNameFromTaskTitle('path/to/feature', 2)).toBe('path/to/feature');
  });
});

describe('repositoryLinkedName', () => {
  it('prefers fullName', () => {
    const r = {
      id: 1,
      projectId: 1,
      repositoryUrl: 'https://github.com/o/n',
      repositoryName: 'n',
      provider: 'github' as const,
      isActive: true,
      createdAt: '',
      updatedAt: '',
      fullName: 'org/repo',
    };
    expect(repositoryLinkedName(r)).toBe('org/repo');
  });

  it('parses owner/repo from https URL path when fullName missing', () => {
    const r: Repository = {
      id: 1,
      projectId: 1,
      repositoryUrl: 'https://github.com/acme/widget',
      repositoryName: 'widget',
      provider: 'github',
      isActive: true,
      createdAt: '',
      updatedAt: '',
    };
    expect(repositoryLinkedName(r)).toBe('acme/widget');
  });
});

describe('isDuplicateRepoBranchLink', () => {
  it('detects matching repo and branch case-insensitively', () => {
    const existing: TaskLinkedBranch[] = [
      { linked_repo: 'Org/Repo', linked_branch: 'main', linked_branch_full_ref: 'refs/heads/main' },
    ];
    expect(isDuplicateRepoBranchLink(existing, 'org/repo', 'Main')).toBe(true);
    expect(isDuplicateRepoBranchLink(existing, 'other/r', 'main')).toBe(false);
  });
});

describe('appendLinkedBranchDeduped', () => {
  const link = (repo: string, branch: string): TaskLinkedBranch => ({
    linked_repo: repo,
    linked_branch: branch,
    linked_branch_full_ref: `refs/heads/${branch}`,
  });

  it('appends a new link', () => {
    const out = appendLinkedBranchDeduped([link('org/repo', 'main')], link('org/repo', 'feat'));
    expect(out).toHaveLength(2);
    expect(out[1].linked_branch).toBe('feat');
  });

  it('replaces an existing entry instead of duplicating it', () => {
    const existing = [link('org/repo', 'Fix-login-bug')];
    const out = appendLinkedBranchDeduped(existing, link('org/repo', 'Fix-login-bug'));
    expect(out).toHaveLength(1);
  });

  it('matches case-insensitively and ignores surrounding whitespace', () => {
    const existing = [link('Org/Repo', ' Fix-Login-Bug ')];
    const out = appendLinkedBranchDeduped(existing, link('org/repo', 'fix-login-bug'));
    expect(out).toHaveLength(1);
    expect(out[0].linked_branch).toBe('fix-login-bug');
  });

  it('keeps other links untouched', () => {
    const existing = [link('org/repo', 'main'), link('org/other', 'main')];
    const out = appendLinkedBranchDeduped(existing, link('org/repo', 'main'));
    expect(out).toHaveLength(2);
    expect(out.map((b) => b.linked_repo)).toEqual(['org/other', 'org/repo']);
  });
});
