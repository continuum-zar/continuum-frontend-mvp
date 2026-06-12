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

function repoBranchKey(linkedRepo: string, linkedBranch: string): string {
  return `${linkedRepo.trim().toLowerCase()}\0${linkedBranch.trim().toLowerCase()}`;
}

export function isDuplicateRepoBranchLink(
  existing: TaskLinkedBranch[],
  linkedRepo: string,
  linkedBranch: string,
): boolean {
  const want = repoBranchKey(linkedRepo, linkedBranch);
  return existing.some((b) => repoBranchKey(b.linked_repo, b.linked_branch) === want);
}

/** Append a link, replacing any existing entry for the same repo+branch (case-insensitive). */
export function appendLinkedBranchDeduped(
  existing: TaskLinkedBranch[],
  link: TaskLinkedBranch,
): TaskLinkedBranch[] {
  const want = repoBranchKey(link.linked_repo, link.linked_branch);
  return [...existing.filter((b) => repoBranchKey(b.linked_repo, b.linked_branch) !== want), link];
}
