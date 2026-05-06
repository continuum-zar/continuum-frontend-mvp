import type { TaskLinkedBranch } from '@/types/task';
import type { Repository } from '@/types/repository';

/** Provider full name for task.linked_repo / webhooks; fallback from URL or name. */
export function repositoryLinkedName(r: Repository): string {
  const fn = r.fullName?.trim();
  if (fn) return fn;
  try {
    const u = new URL(r.repositoryUrl);
    const path = u.pathname.replace(/^\/+|\/+$/g, '');
    if (path.includes('/')) return path;
  } catch {
    /* ignore */
  }
  return (r.repositoryName || '').trim();
}

const MAX_BRANCH_LEN = 244;

/**
 * Derives a git branch name from a task title (spaces → hyphens, minimal sanitization).
 * Falls back to `task-{taskId}` when the result would be empty.
 */
export function branchNameFromTaskTitle(title: string, taskId: string | number): string {
  const spaced = title.trim().replace(/\s+/g, '-');
  const sanitized = spaced
    .replace(/[^a-zA-Z0-9/_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  const base = sanitized.length > 0 ? sanitized : `task-${taskId}`;
  return base.length > MAX_BRANCH_LEN ? base.slice(0, MAX_BRANCH_LEN).replace(/-+$/g, '') : base;
}

export function isDuplicateRepoBranchLink(
  existing: TaskLinkedBranch[],
  linkedRepo: string,
  linkedBranch: string,
): boolean {
  const want = `${linkedRepo.trim().toLowerCase()}\0${linkedBranch.trim().toLowerCase()}`;
  return existing.some(
    (b) =>
      `${b.linked_repo.trim().toLowerCase()}\0${b.linked_branch.trim().toLowerCase()}` === want,
  );
}
