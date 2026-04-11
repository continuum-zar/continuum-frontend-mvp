import api from '@/lib/api';
import type { PaginatedResponse } from '@/types/api';

/** Matches backend `GitContributionClassification`. */
export type GitContributionClassification = 'TRIVIAL' | 'INCREMENTAL' | 'STRUCTURAL';

/** Matches backend `GitContributionRead` (list endpoint). */
export interface GitContributionRead {
    id: number;
    project_id: number;
    user_id: number;
    task_id?: number | null;
    commit_hash: string;
    branch?: string | null;
    commit_message?: string | null;
    provider: string;
    commit_url?: string | null;
    classification?: GitContributionClassification | null;
    confidence_score: number;
    created_at: string;
    user_name?: string | null;
}

export async function fetchProjectGitContributions(
    projectId: number | string,
    options?: { limit?: number; skip?: number },
): Promise<PaginatedResponse<GitContributionRead>> {
    const limit = options?.limit ?? 20;
    const skip = options?.skip ?? 0;
    const { data } = await api.get<PaginatedResponse<GitContributionRead>>('/git-contributions/', {
        params: { project_id: projectId, limit, skip },
    });
    return data;
}
