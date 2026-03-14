import api from '@/lib/api';
import type { RepositoryAPIResponse, Repository, RepositoryCreateBody } from '@/types/repository';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { projectKeys, getApiErrorMessage } from './hooks';

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
    };
}

/** Fetch repositories linked to a project. GET /projects/:id/repositories */
export async function fetchRepositories(projectId: number | string): Promise<Repository[]> {
    const { data } = await api.get<RepositoryAPIResponse[]>(`/projects/${projectId}/repositories`);
    return (data ?? []).map(mapRepository);
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

export function useProjectRepositories(projectId: number | string | undefined | null) {
    return useQuery({
        queryKey: projectKeys.repositories(projectId!),
        queryFn: () => fetchRepositories(projectId!),
        enabled: projectId != null && projectId !== '',
    });
}

export function useLinkRepository(projectId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: Omit<RepositoryCreateBody, 'project_id'>) =>
            linkRepository(projectId!, body),
        onSuccess: (_data, _variables, _context) => {
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
        onSuccess: (_data, _variables, _context) => {
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
