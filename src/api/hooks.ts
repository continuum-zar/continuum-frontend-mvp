import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    fetchProjects,
    fetchProject,
    fetchProjectTasks,
    fetchAllTasks,
    updateTaskStatus,
    fetchMilestones,
    createMilestone,
    fetchMembers,
    addMember,
    createProject,
    updateProject,
} from './projects';
import type { TaskStatus } from '@/types/task';

/** Normalize FastAPI error detail into a single message. */
function getApiErrorMessage(err: unknown, fallback: string): string {
    const data = (err as { response?: { data?: { detail?: string | Array<{ msg?: string }> } } })?.response?.data;
    const detail = data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
        const messages = detail
            .map((d) => (d && typeof d.msg === 'string' ? d.msg : String(d)))
            .filter(Boolean);
        return messages.length > 0 ? messages.join('. ') : fallback;
    }
    return fallback;
}

export const projectKeys = {
    all: ['projects'] as const,
    list: () => [...projectKeys.all, 'list'] as const,
    detail: (id: number | string) => [...projectKeys.all, 'detail', id] as const,
    tasks: (projectId: number | string) => [...projectKeys.all, 'detail', projectId, 'tasks'] as const,
    allTasks: () => ['tasks', 'all'] as const,
    milestones: (projectId: number | string) => [...projectKeys.all, 'detail', projectId, 'milestones'] as const,
    members: (projectId: number | string) => [...projectKeys.all, 'detail', projectId, 'members'] as const,
};

export function useProjects() {
    return useQuery({
        queryKey: projectKeys.list(),
        queryFn: fetchProjects,
    });
}

export function useProject(projectId: number | string | undefined | null) {
    return useQuery({
        queryKey: projectKeys.detail(projectId!),
        queryFn: () => fetchProject(projectId!),
        enabled: projectId != null && projectId !== '',
    });
}

export function useProjectTasks(projectId: number | string | undefined | null) {
    return useQuery({
        queryKey: projectKeys.tasks(projectId!),
        queryFn: () => fetchProjectTasks(projectId!),
        enabled: projectId != null && projectId !== '',
    });
}

/** All tasks across user's projects (for time-tracking task dropdown). No project_id filter. */
export function useAllTasks() {
    return useQuery({
        queryKey: projectKeys.allTasks(),
        queryFn: fetchAllTasks,
    });
}

export function useProjectMilestones(projectId: number | string | undefined | null) {
    return useQuery({
        queryKey: projectKeys.milestones(projectId!),
        queryFn: () => fetchMilestones(projectId!),
        enabled: projectId != null && projectId !== '',
    });
}

export function useProjectMembers(projectId: number | string | undefined | null, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: projectKeys.members(projectId!),
        queryFn: () => fetchMembers(projectId!),
        enabled: (projectId != null && projectId !== '' && options?.enabled !== false) ?? false,
    });
}

export function useCreateProject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: { name: string; description?: string; due_date?: string | null }) => createProject(body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.list() });
            toast.success('Project created successfully');
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to create project'));
        },
    });
}

export function useUpdateProject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            projectId,
            body,
        }: {
            projectId: number | string;
            body: { name?: string; description?: string; due_date?: string | null; status?: string };
        }) => updateProject(projectId, body),
        onSuccess: (_data, { projectId }) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.list() });
            queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
            toast.success('Project updated successfully');
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to update project'));
        },
    });
}

export function useUpdateTaskStatus(projectId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    const key = projectId != null && projectId !== '' ? projectKeys.tasks(projectId) : null;
    return useMutation({
        mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) => updateTaskStatus(taskId, status),
        onMutate: async ({ taskId, status }) => {
            if (!key) return {};
            await queryClient.cancelQueries({ queryKey: key });
            const prev = queryClient.getQueryData(key);
            queryClient.setQueryData(key, (old: Awaited<ReturnType<typeof fetchProjectTasks>> | undefined) => {
                if (!old) return old;
                return old.map((t) => (t.id === taskId ? { ...t, status } : t));
            });
            return { prev };
        },
        onError: (_err, _vars, ctx) => {
            if (key && ctx?.prev != null) queryClient.setQueryData(key, ctx.prev);
            toast.error('Failed to update task status. Please try again.');
        },
        onSettled: () => {
            if (key) queryClient.invalidateQueries({ queryKey: key });
        },
    });
}

export function useCreateMilestone(projectId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: { name: string; due_date: string; description?: string }) =>
            createMilestone({ project_id: Number(projectId), ...body }),
        onSuccess: () => {
            if (projectId != null && projectId !== '')
                queryClient.invalidateQueries({ queryKey: projectKeys.milestones(projectId) });
            toast.success('Milestone created successfully');
        },
        onError: (err) => {
            const msg = getApiErrorMessage(err, 'Failed to create milestone');
            toast.error(msg);
        },
    });
}

export function useAddMember(projectId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: { email: string; role?: string }) => addMember(projectId!, body),
        onSuccess: () => {
            if (projectId != null && projectId !== '')
                queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId) });
            toast.success('Member added to project');
        },
        onError: (err: unknown) => {
            const res = (err as { response?: { data?: { detail?: string }; status?: number } })?.response;
            const detail = res?.data?.detail;
            const status = res?.status;
            let message = typeof detail === 'string' ? detail : (err as { message?: string })?.message ?? 'Failed to add member';
            if (status === 404) message = 'User not found. They must have an account with this email.';
            else if (status === 409) message = 'User is already a member of this project.';
            toast.error(message);
        },
    });
}
