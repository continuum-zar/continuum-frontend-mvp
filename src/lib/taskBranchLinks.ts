import type { TaskLinkedBranch } from '@/types/task';

/** Best-effort browse URL for a linked repo + branch (GitHub-style `owner/repo`). */
export function linkedBranchBrowseUrl(link: TaskLinkedBranch): string | null {
    const repo = link.linked_repo?.trim() ?? '';
    const branch = link.linked_branch?.trim() ?? '';
    if (!repo || !branch) return null;
    const m = /^([^/\s]+)\/([^/\s]+)$/.exec(repo);
    if (!m) return null;
    const [, owner, name] = m;
    return `https://github.com/${owner}/${name}/tree/${encodeURIComponent(branch)}`;
}

/** Short label for a chip: `repo@branch` with repo truncated if long. */
export function linkedBranchChipLabel(link: TaskLinkedBranch, maxRepoLen = 18): string {
    const repo = link.linked_repo?.trim() ?? '';
    const branch = link.linked_branch?.trim() ?? '';
    const repoShort =
        repo.length > maxRepoLen ? `${repo.slice(0, Math.max(0, maxRepoLen - 1))}…` : repo;
    return repoShort && branch ? `${repoShort}@${branch}` : repo || branch || 'branch';
}
