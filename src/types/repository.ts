/** Git provider for repository webhooks (matches backend GitProvider). */
export type RepositoryProvider = 'github' | 'gitlab' | 'bitbucket';

/** Repository as returned by API (GET /projects/:id/repositories). api_token is never exposed. */
export interface RepositoryAPIResponse {
    id: number;
    project_id: number;
    repository_url: string;
    repository_name: string;
    provider: RepositoryProvider;
    is_active: boolean;
    webhook_secret?: string | null;
    created_at: string;
    updated_at: string;
}

/** Repository shape used by UI. */
export interface Repository {
    id: number;
    projectId: number;
    repositoryUrl: string;
    repositoryName: string;
    provider: RepositoryProvider;
    isActive: boolean;
    webhookSecret?: string | null;
    createdAt: string;
    updatedAt: string;
}

/** Body for linking a repository (POST /projects/:id/repositories). */
export interface RepositoryCreateBody {
    project_id: number;
    repository_url: string;
    repository_name: string;
    provider: RepositoryProvider;
    is_active?: boolean;
    webhook_secret?: string | null;
    api_token?: string | null;
}
