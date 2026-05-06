import api from '@/lib/api';

/**
 * POST /projects/:project_id/repositories/:repository_id/branches
 * Creates a branch on the linked provider (GitHub/GitLab/…) via the backend.
 */
export interface CreateRepositoryBranchBody {
  name: string;
  /** Optional ref or SHA to branch from; omit to use the repository default branch. */
  from_ref?: string | null;
}

export interface CreateRepositoryBranchResponse {
  name: string;
}

export async function createRepositoryBranch(
  projectId: number | string,
  repositoryId: number,
  body: CreateRepositoryBranchBody,
): Promise<CreateRepositoryBranchResponse> {
  const { data } = await api.post<CreateRepositoryBranchResponse>(
    `/projects/${projectId}/repositories/${repositoryId}/branches`,
    body,
  );
  return data;
}
