import api from '@/lib/api';
import type { BranchItem, RepositoryAPIResponse, Repository, RepositoryCreateBody } from '@/types/repository';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from './hooks';
import { normalizeProjectKeyId, projectKeys } from './projects';
import { STALE_MODERATE_MS, STALE_REFERENCE_MS } from '@/lib/queryDefaults';

/** Shape of the paginated envelope returned by the backend list endpoints. */
interface PaginatedResponse<T> {
    data: T[];
    total: number;
    skip: number;
    limit: number;
}

function mapRepository(res: RepositoryAPIResponse): Repository {
    return {
        id: res.id,
        projectId: res.project_id,
        repositoryUrl: res.repository_url,
        repositoryName: res.repository_name,
        provider: res.provider,
        isActive: res.is_active,
        webhookSecret: res.webhook_secret ?? null,
        createdAt: res.created_at,
        updatedAt: res.updated_at,
        fullName: res.full_name,
    };
}

/** Fetch repositories linked to a project. GET /projects/:id/repositories */
export async function fetchRepositories(projectId: number | string): Promise<Repository[]> {
    const { data } = await api.get<PaginatedResponse<RepositoryAPIResponse>>(`/projects/${projectId}/repositories`);
    // Backend returns a paginated envelope: { data: [...], total, skip, limit }
    return (data?.data ?? []).map(mapRepository);
}

/** Link a repository to a project. POST /projects/:id/repositories. Requires admin. */
export async function linkRepository(
    projectId: number | string,
    body: Omit<RepositoryCreateBody, 'project_id'>
): Promise<Repository> {
    const payload: RepositoryCreateBody = {
        project_id: Number(projectId),
        repository_url: body.repository_url,
        repository_name: body.repository_name,
        provider: body.provider,
        is_active: body.is_active ?? true,
        ...(body.webhook_secret != null && body.webhook_secret !== '' && { webhook_secret: body.webhook_secret }),
        ...(body.api_token != null && body.api_token !== '' && { api_token: body.api_token }),
    };
    const { data } = await api.post<RepositoryAPIResponse>(`/projects/${projectId}/repositories`, payload);
    return mapRepository(data);
}

/** Unlink a repository. DELETE /repositories/:id. Requires admin. */
export async function unlinkRepository(repositoryId: number): Promise<void> {
    await api.delete(`/repositories/${repositoryId}`);
}

/** Fetch branches for a repository. GET /projects/:id/repositories/:repoId/branches */
export async function fetchRepositoryBranches(
    projectId: number | string,
    repositoryId: number
): Promise<BranchItem[]> {
    const { data } = await api.get<BranchItem[]>(
        `/projects/${projectId}/repositories/${repositoryId}/branches`
    );
    return data ?? [];
}

export function useRepositoryBranches(
    projectId: number | string | undefined | null,
    repositoryId: number | undefined | null
) {
    return useQuery({
        queryKey: ['projects', 'detail', normalizeProjectKeyId(projectId!), 'repositories', repositoryId, 'branches'] as const,
        queryFn: () => fetchRepositoryBranches(projectId!, repositoryId!),
        enabled:
            projectId != null &&
            projectId !== '' &&
            repositoryId != null &&
            typeof repositoryId === 'number',
        staleTime: STALE_MODERATE_MS,
        refetchOnWindowFocus: false,
    });
}

export function useProjectRepositories(projectId: number | string | undefined | null) {
    return useQuery({
        queryKey: projectKeys.repositories(projectId!),
        queryFn: () => fetchRepositories(projectId!),
        enabled: projectId != null && projectId !== '',
        staleTime: STALE_REFERENCE_MS,
        refetchOnWindowFocus: false,
    });
}

export function useLinkRepository(projectId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: Omit<RepositoryCreateBody, 'project_id'>) =>
            linkRepository(projectId!, body),
        onSuccess: () => {
            if (projectId != null && projectId !== '')
                queryClient.invalidateQueries({ queryKey: projectKeys.repositories(projectId) });
            toast.success('Repository linked successfully');
        },
        onError: (err: unknown) => {
            const res = (err as { response?: { status?: number } })?.response;
            const message =
                res?.status === 403
                    ? 'Only admins can link repositories.'
                    : getApiErrorMessage(err, 'Failed to link repository');
            toast.error(message);
        },
    });
}

export function useUnlinkRepository(projectId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (repositoryId: number) => unlinkRepository(repositoryId),
        onSuccess: () => {
            if (projectId != null && projectId !== '')
                queryClient.invalidateQueries({ queryKey: projectKeys.repositories(projectId) });
            toast.success('Repository unlinked');
        },
        onError: (err: unknown) => {
            const res = (err as { response?: { status?: number } })?.response;
            const message =
                res?.status === 403
                    ? 'Only admins can unlink repositories.'
                    : getApiErrorMessage(err, 'Failed to unlink repository');
            toast.error(message);
        },
    });
}
