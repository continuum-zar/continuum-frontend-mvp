import { describe, expect, it } from 'vitest';

import {
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
