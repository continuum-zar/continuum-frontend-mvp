import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { ChevronDown, GitBranch, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateTask } from '@/api/hooks';
import { fetchRepositoryBranches } from '@/api/repositories';
import { normalizeProjectKeyId } from '@/api/projects';
import { STALE_MODERATE_MS } from '@/lib/queryDefaults';
import { getTaskLinkedBranches, type TaskAPIResponse, type TaskLinkedBranch } from '@/types/task';
import type { BranchItem, Repository } from '@/types/repository';

function createRowKey(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Provider full name for task.linked_repo / webhooks; fallback from URL or name. */
function repoLinkedName(r: Repository): string {
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

function branchToFullRef(name: string): string {
  if (name.startsWith('refs/')) return name;
  return `refs/heads/${name}`;
}

function findRepoIdForLinkedName(repos: Repository[], linkedName: string): number | null {
  const want = linkedName.trim().toLowerCase();
  if (!want) return null;
  const m = repos.find((r) => repoLinkedName(r).toLowerCase() === want);
  return m?.id ?? null;
}

interface EntryRow {
  key: string;
  repoId: number | null;
  branchName: string | null;
  /** API link whose repo string does not match any project repository */
  orphanRepoName?: string | null;
}

function isCompleteEntry(e: EntryRow): boolean {
  if (e.orphanRepoName?.trim() && e.branchName?.trim()) return true;
  if (e.repoId != null && e.branchName?.trim()) return true;
  return false;
}

function parseEntriesFromTask(task: TaskAPIResponse, projectRepos: Repository[]): EntryRow[] {
  const links = getTaskLinkedBranches(task);
  return links.map((l, i) => {
    const repoId = findRepoIdForLinkedName(projectRepos, l.linked_repo);
    return {
      key: l.id != null ? `srv-${l.id}` : `srv-${i}-${l.linked_repo}-${l.linked_branch}`,
      repoId,
      branchName: l.linked_branch,
      orphanRepoName: repoId == null ? l.linked_repo : undefined,
    };
  });
}

function entriesToPayload(entries: EntryRow[], projectRepos: Repository[]): TaskLinkedBranch[] {
  const out: TaskLinkedBranch[] = [];
  for (const e of entries) {
    if (e.orphanRepoName?.trim() && e.branchName?.trim()) {
      const bn = e.branchName.trim();
      out.push({
        linked_repo: e.orphanRepoName.trim(),
        linked_branch: bn,
        linked_branch_full_ref: branchToFullRef(bn),
      });
      continue;
    }
    if (e.repoId == null || !e.branchName?.trim()) continue;
    const repo = projectRepos.find((r) => r.id === e.repoId);
    if (!repo) continue;
    const bn = e.branchName.trim();
    out.push({
      linked_repo: repoLinkedName(repo),
      linked_branch: bn,
      linked_branch_full_ref: branchToFullRef(bn),
    });
  }
  return out;
}

function hasDuplicateLinks(links: TaskLinkedBranch[]): boolean {
  const seen = new Set<string>();
  for (const b of links) {
    const k = `${b.linked_repo.trim().toLowerCase()}\0${b.linked_branch.trim().toLowerCase()}`;
    if (seen.has(k)) return true;
    seen.add(k);
  }
  return false;
}

export interface TaskLinkedBranchesSectionProps {
  taskId: string;
  projectId: number;
  task: TaskAPIResponse;
  projectRepos: Repository[];
  reposLoading: boolean;
}

export function TaskLinkedBranchesSection({
  taskId,
  projectId,
  task,
  projectRepos,
  reposLoading,
}: TaskLinkedBranchesSectionProps) {
  const updateTaskMutation = useUpdateTask();
  const [entries, setEntries] = useState<EntryRow[]>(() => parseEntriesFromTask(task, projectRepos));
  const [openRepoKey, setOpenRepoKey] = useState<string | null>(null);
  const [openBranchKey, setOpenBranchKey] = useState<string | null>(null);

  const branchSyncKey = useMemo(() => JSON.stringify(getTaskLinkedBranches(task)), [task]);

  useEffect(() => {
    setEntries((prev) => {
      const fromServer = parseEntriesFromTask(task, projectRepos);
      const drafts = prev.filter((e) => !isCompleteEntry(e));
      return [...fromServer, ...drafts];
    });
  }, [task.id, branchSyncKey, projectRepos]);

  const repoIdsUnique = useMemo(
    () => [...new Set(entries.map((e) => e.repoId).filter((id): id is number => id != null))],
    [entries],
  );

  const branchQueries = useQueries({
    queries: repoIdsUnique.map((repositoryId) => ({
      queryKey: ['projects', 'detail', normalizeProjectKeyId(projectId), 'repositories', repositoryId, 'branches'] as const,
      queryFn: () => fetchRepositoryBranches(projectId, repositoryId),
      staleTime: STALE_MODERATE_MS,
      refetchOnWindowFocus: false,
    })),
  });

  const branchesForRepo = useCallback(
    (repoId: number | null): BranchItem[] => {
      if (repoId == null) return [];
      const idx = repoIdsUnique.indexOf(repoId);
      if (idx < 0) return [];
      return branchQueries[idx]?.data ?? [];
    },
    [repoIdsUnique, branchQueries],
  );

  const branchesLoadingForRepo = useCallback(
    (repoId: number | null): boolean => {
      if (repoId == null) return false;
      const idx = repoIdsUnique.indexOf(repoId);
      if (idx < 0) return false;
      const q = branchQueries[idx];
      const data = q?.data as BranchItem[] | undefined;
      return Boolean(q?.isLoading && (data?.length ?? 0) === 0);
    },
    [repoIdsUnique, branchQueries],
  );

  const persist = useCallback(
    (next: EntryRow[]) => {
      const payload = entriesToPayload(next, projectRepos);
      if (hasDuplicateLinks(payload)) {
        toast.error('That repository and branch are already linked.');
        return;
      }
      setEntries(next);
      updateTaskMutation.mutate(
        { taskId, linked_branches: payload },
        {
          onError: () => {
            setEntries(parseEntriesFromTask(task, projectRepos));
          },
        },
      );
    },
    [projectRepos, task, taskId, updateTaskMutation],
  );

  const addRow = () => {
    setEntries((prev) => [...prev, { key: createRowKey(), repoId: null, branchName: null }]);
  };

  const removeRow = (key: string) => {
    const next = entries.filter((e) => e.key !== key);
    persist(next);
    setOpenRepoKey(null);
    setOpenBranchKey(null);
  };

  const selectRepo = (key: string, repo: Repository) => {
    const next = entries.map((e) =>
      e.key === key
        ? { ...e, repoId: repo.id, branchName: null, orphanRepoName: undefined }
        : e,
    );
    setOpenRepoKey(null);
    persist(next);
  };

  const selectBranch = (key: string, branchName: string) => {
    const next = entries.map((e) => (e.key === key ? { ...e, branchName } : e));
    setOpenBranchKey(null);
    persist(next);
  };

  if (reposLoading) {
    return <div className="h-[46px] w-full animate-pulse rounded-[8px] bg-[#e4eaec]" />;
  }

  if (projectRepos.length === 0) {
    return (
      <p className="text-[13px] leading-snug text-[#727d83]">
        Link a repository to this project first (project settings or onboarding), then you can attach branches to this
        task.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {entries.map((row) => {
          const repo = row.repoId != null ? projectRepos.find((r) => r.id === row.repoId) : undefined;
          const branchList = branchesForRepo(row.repoId);
          const bLoading = branchesLoadingForRepo(row.repoId);
          const isOrphan = Boolean(row.orphanRepoName && row.repoId == null);

          return (
            <li
              key={row.key}
              className="flex flex-col gap-2 rounded-[8px] border border-[#e9e9e9] bg-white p-3 sm:flex-row sm:items-stretch"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
                {isOrphan ? (
                  <div className="flex min-h-[46px] min-w-0 flex-1 flex-col justify-center rounded-[8px] border border-dashed border-[#e9e9e9] bg-[#f9fafb] px-3 py-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#727d83]">Repository (not in project)</p>
                    <p className="truncate font-mono text-[14px] font-medium text-[#0b191f]">{row.orphanRepoName}</p>
                  </div>
                ) : (
                  <div className="relative min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenRepoKey((k) => (k === row.key ? null : row.key));
                        setOpenBranchKey(null);
                      }}
                      className="flex h-[46px] w-full items-center justify-between rounded-[8px] border border-[#e9e9e9] bg-white px-3"
                    >
                      <span className="min-w-0 truncate text-left text-[14px] font-medium text-[#0b191f]">
                        {repo ? repoLinkedName(repo) || repo.repositoryName : 'Select repository'}
                      </span>
                      <ChevronDown size={16} className="shrink-0" />
                    </button>
                    {openRepoKey === row.key && (
                      <div
                        className="absolute left-0 top-full z-30 mt-1 max-h-[240px] min-w-full w-max max-w-[min(28rem,calc(100vw-2rem))] overflow-y-auto overflow-x-hidden rounded-[8px] border border-[#e9e9e9] bg-white shadow-md"
                        role="listbox"
                        aria-label="Repositories"
                      >
                        {projectRepos.map((r) => {
                          const name = repoLinkedName(r) || r.repositoryName;
                          return (
                            <button
                              key={r.id}
                              type="button"
                              role="option"
                              onClick={() => selectRepo(row.key, r)}
                              className={`flex w-full items-start px-3 py-2.5 text-left text-[14px] font-medium hover:bg-[#f0f3f5] ${
                                row.repoId === r.id ? 'bg-[#f0f3f5] text-[#0b191f]' : 'text-[#606d76]'
                              }`}
                            >
                              <span className="min-w-0 flex-1 break-words">{name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="relative min-w-0 flex-1">
                  {isOrphan ? (
                    <div className="flex min-h-[46px] min-w-0 flex-col justify-center rounded-[8px] border border-[#e9e9e9] bg-[#f9fafb] px-3 py-2">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#727d83]">Branch</p>
                      <p className="truncate font-mono text-[14px] font-medium text-[#0b191f]">{row.branchName ?? '—'}</p>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={row.repoId == null || bLoading}
                        onClick={() => {
                          if (row.repoId == null || bLoading) return;
                          setOpenBranchKey((k) => (k === row.key ? null : row.key));
                          setOpenRepoKey(null);
                        }}
                        className="flex h-[46px] w-full items-center justify-between rounded-[8px] border border-[#e9e9e9] bg-white px-3 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="min-w-0 truncate text-left text-[14px] font-medium text-[#0b191f]">
                          {bLoading ? 'Loading branches…' : row.branchName?.trim() ? row.branchName : 'Select branch'}
                        </span>
                        <ChevronDown size={16} className="shrink-0" />
                      </button>
                      {openBranchKey === row.key && !bLoading && (
                        <div
                          className="absolute left-0 top-full z-30 mt-1 max-h-[240px] min-w-full w-max max-w-[min(28rem,calc(100vw-2rem))] overflow-y-auto overflow-x-hidden rounded-[8px] border border-[#e9e9e9] bg-white shadow-md"
                          role="listbox"
                          aria-label="Branches"
                        >
                          {branchList.length === 0 ? (
                            <p className="px-3 py-2.5 text-[13px] text-[#727d83]">No branches found.</p>
                          ) : (
                            branchList.map((b) => (
                              <button
                                key={b.name}
                                type="button"
                                role="option"
                                onClick={() => selectBranch(row.key, b.name)}
                                disabled={updateTaskMutation.isPending}
                                className={`flex w-full items-start gap-2 px-3 py-2.5 text-left text-[14px] font-medium hover:bg-[#f0f3f5] disabled:opacity-50 ${
                                  row.branchName === b.name ? 'bg-[#f0f3f5] text-[#0b191f]' : 'text-[#606d76]'
                                }`}
                              >
                                <GitBranch size={14} className="mt-0.5 shrink-0 text-[#727d83]" aria-hidden />
                                <span className="min-w-0 flex-1 break-words">{b.name}</span>
                                {b.default ? (
                                  <span className="shrink-0 self-center text-[11px] uppercase text-[#727d83]">default</span>
                                ) : null}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-end sm:flex-col sm:justify-center">
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  disabled={updateTaskMutation.isPending}
                  className="inline-flex h-[46px] w-full items-center justify-center rounded-[8px] border border-transparent px-2 text-[#727d83] hover:bg-[#f0f3f5] hover:text-[#0b191f] disabled:opacity-50 sm:w-10"
                  aria-label="Remove branch link"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={addRow}
        disabled={updateTaskMutation.isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] border border-dashed border-[#e9e9e9] bg-white py-2.5 text-[14px] font-medium text-[#606d76] hover:border-[#24B5F8]/50 hover:text-[#0b191f] disabled:opacity-50 sm:w-auto sm:justify-start sm:px-3"
      >
        {updateTaskMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus size={16} />}
        Add branch link
      </button>
    </div>
  );
}
