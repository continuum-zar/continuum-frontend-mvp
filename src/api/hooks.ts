import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    fetchProjects,
    fetchProject,
    fetchMilestones,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    fetchMembers,
    addMember,
    createProject,
    updateProject,
    deleteProject,
    projectKeys,
} from './projects';
export { projectKeys };
import { createClient, fetchClient, clientKeys } from './clients';
import type { ClientCreate } from './clients';
import {
    fetchTask,
    fetchProjectTasks,
    fetchAllTasks,
    updateTaskStatus,
    updateTask,
    deleteTask,
    fetchTaskComments,
    createTaskComment,
    fetchTaskAttachments,
    uploadTaskAttachment,
    addTaskAttachmentLink,
    deleteAttachment,
    fetchTaskTimeline,
    assignTask,
    addTaskLabel,
    removeTaskLabel,
} from './tasks';
import { fetchLoggedHours, createLoggedHour } from './loggedHours';
import type { CreateLoggedHourBody } from './loggedHours';
import type { Task, TaskStatus, ScopeWeight } from '@/types/task';

/** Normalize FastAPI error detail into a single message. */
export function getApiErrorMessage(err: unknown, fallback: string): string {
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


export function useProjects() {
    return useQuery({
        queryKey: projectKeys.list(),
        queryFn: fetchProjects,
        // Reference data: keep longer in cache and avoid refetch on window focus
        staleTime: 3 * 60 * 1000,
        refetchOnWindowFocus: false,
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
export function useAllTasks(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: projectKeys.allTasks(),
        queryFn: fetchAllTasks,
        enabled: options?.enabled,
    });
}

/** Logged hours for Recent Entries. Optional project_id; "all" / empty = no filter. Refetch after logging a new entry. */
export function useLoggedHours(projectId?: string | null, options?: { limit?: number; enabled?: boolean }) {
    const limit = options?.limit ?? 50;
    const projectIdParam = (projectId == null || projectId === '' || projectId === 'all') ? undefined : projectId;
    return useQuery({
        queryKey: projectKeys.loggedHours(projectIdParam),
        queryFn: () => fetchLoggedHours({
            ...(projectIdParam != null && { project_id: projectIdParam }),
            limit,
        }),
        enabled: options?.enabled,
    });
}

/** Create a logged hour (manual entry). Invalidates logged-hours so Recent Entries refetch. */
export function useCreateLoggedHour() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateLoggedHourBody) => createLoggedHour(body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['logged-hours'] });
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to log time. You may not have access to this project or task.'));
        },
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
        // Members are reference-ish data; keep slightly longer cached and avoid refetch on focus
        staleTime: 3 * 60 * 1000,
        refetchOnWindowFocus: false,
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

export function useDeleteProject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (projectId: number | string) => deleteProject(projectId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.list() });
            queryClient.invalidateQueries({ queryKey: projectKeys.all });
            toast.success('Project deleted');
        },
        onError: (err) => {
            const status = (err as { response?: { status?: number } })?.response?.status;
            const message = status === 403
                ? 'You do not have permission to delete projects.'
                : getApiErrorMessage(err, 'Failed to delete project');
            toast.error(message);
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
            queryClient.setQueryData(key, (old: Task[] | undefined) => {
                if (!old) return old;
                return old.map((t) => (t.id === taskId ? { ...t, status } : t));
            });
            return { prev };
        },
        onError: (err, _vars, ctx) => {
            if (key && ctx?.prev != null) queryClient.setQueryData(key, ctx.prev);
            toast.error(getApiErrorMessage(err, 'Failed to update task status. Please try again.'));
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

export function useUpdateMilestone(projectId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            milestoneId,
            body,
        }: {
            milestoneId: number | string;
            body: { name?: string; due_date?: string; description?: string };
        }) => updateMilestone(milestoneId, body),
        onSuccess: () => {
            if (projectId != null && projectId !== '')
                queryClient.invalidateQueries({ queryKey: projectKeys.milestones(projectId) });
            toast.success('Milestone updated successfully');
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to update milestone'));
        },
    });
}

export function useDeleteMilestone(projectId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (milestoneId: number | string) => deleteMilestone(milestoneId),
        onSuccess: () => {
            if (projectId != null && projectId !== '')
                queryClient.invalidateQueries({ queryKey: projectKeys.milestones(projectId) });
            toast.success('Milestone deleted');
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to delete milestone'));
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
            const status = (err as { response?: { status?: number } })?.response?.status;
            let fallback = 'Failed to add member';
            if (status === 404) fallback = 'User not found. They must have an account with this email.';
            else if (status === 409) fallback = 'User is already a member of this project.';
            toast.error(getApiErrorMessage(err, fallback));
        },
    });
}


export function useUpdateTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            taskId,
            status,
            scope_weight,
            due_date,
            linked_repo,
            linked_branch,
            checklists,
        }: {
            taskId: string | number;
            status?: TaskStatus;
            scope_weight?: ScopeWeight;
            due_date?: string | null;
            linked_repo?: string | null;
            linked_branch?: string | null;
            checklists?: Array<{ id?: string; text: string; done: boolean }>;
        }) => updateTask(taskId, { status, scope_weight, due_date, linked_repo, linked_branch, checklists }),
        onSuccess: (_data, { taskId }) => {
            // Show success toast
            toast.success('Task updated successfully');
            if (taskId) {
                queryClient.invalidateQueries({ queryKey: taskTimelineKey(taskId) });
                queryClient.invalidateQueries({ queryKey: taskDetailKey(taskId) });
            }
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to update task'));
        },
        onSettled: () => {
            // Refetch all project task lists to ensure consistency
            queryClient.invalidateQueries({ queryKey: projectKeys.all });
        },
    });
}
// Task detail key and hook
const taskDetailKey = (taskId: number | string) => ['tasks', 'detail', taskId] as const;

export function useTask(taskId: number | string | undefined | null) {
    return useQuery({
        queryKey: taskDetailKey(taskId!),
        queryFn: () => fetchTask(taskId!),
        enabled: taskId != null && taskId !== '',
    });
}
export function useAssignTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, userId }: { taskId: string | number; userId: number | null }) => assignTask(taskId, userId),
        onSuccess: (_data, { taskId }) => {
            toast.success('Assignee updated');
            if (taskId) {
                queryClient.invalidateQueries({ queryKey: taskTimelineKey(taskId) });
                queryClient.invalidateQueries({ queryKey: taskDetailKey(taskId) });
            }
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to update assignee'));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all });
        },
    });
}

export function useDeleteTask(projectId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (taskId: number | string) => deleteTask(taskId),
        onSuccess: (_data, taskId) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.all });
            if (projectId != null && projectId !== '') {
                queryClient.invalidateQueries({ queryKey: projectKeys.tasks(projectId) });
            }
            queryClient.invalidateQueries({ queryKey: taskTimelineKey(taskId) });
            toast.success('Task deleted');
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to delete task'));
        },
    });
}

export function useAddTaskLabel(taskId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (label: string) => addTaskLabel(taskId!, label),
        onSuccess: () => {
            if (taskId != null && taskId !== '') {
                queryClient.invalidateQueries({ queryKey: taskTimelineKey(taskId) });
            }
            queryClient.invalidateQueries({ queryKey: projectKeys.all });
            toast.success('Label added');
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to add label'));
        },
    });
}

export function useRemoveTaskLabel(taskId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (label: string) => removeTaskLabel(taskId!, label),
        onSuccess: () => {
            if (taskId != null && taskId !== '') {
                queryClient.invalidateQueries({ queryKey: taskTimelineKey(taskId) });
            }
            queryClient.invalidateQueries({ queryKey: projectKeys.all });
            toast.success('Label removed');
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to remove label'));
        },
    });
}
// Comment keys
const taskCommentsKey = (taskId: number | string) => ['taskComments', taskId] as const;

export function useTaskComments(taskId: number | string | undefined | null) {
    return useQuery({
        queryKey: taskCommentsKey(taskId!),
        queryFn: () => fetchTaskComments(taskId!),
        enabled: taskId != null && taskId !== '',
    });
}

export function useCreateTaskComment(taskId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (content: string) => createTaskComment(taskId!, content),
        onSuccess: () => {
            if (taskId != null && taskId !== '') {
                queryClient.invalidateQueries({ queryKey: taskCommentsKey(taskId!) });
                queryClient.invalidateQueries({ queryKey: taskTimelineKey(taskId!) });
            }
            toast.success('Comment posted');
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to post comment'));
        },
    });
}

// Attachment keys
const taskAttachmentsKey = (taskId: number | string) => ['taskAttachments', taskId] as const;

export function useTaskAttachments(taskId: number | string | undefined | null) {
    return useQuery({
        queryKey: taskAttachmentsKey(taskId!),
        queryFn: () => fetchTaskAttachments(taskId!),
        enabled: taskId != null && taskId !== '',
    });
}

export function useUploadAttachment(taskId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (file: File) => uploadTaskAttachment(taskId!, file),
        onSuccess: () => {
            if (taskId != null && taskId !== '') {
                queryClient.invalidateQueries({ queryKey: taskAttachmentsKey(taskId!) });
                queryClient.invalidateQueries({ queryKey: taskTimelineKey(taskId!) });
            }
            toast.success('Attachment uploaded successfully');
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to upload attachment'));
        },
    });
}

export function useAddAttachmentLink(taskId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: { url: string; name?: string | null }) =>
            addTaskAttachmentLink(taskId!, payload),
        onSuccess: () => {
            if (taskId != null && taskId !== '') {
                queryClient.invalidateQueries({ queryKey: taskAttachmentsKey(taskId!) });
                queryClient.invalidateQueries({ queryKey: taskTimelineKey(taskId!) });
            }
            toast.success('Link added');
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to add link'));
        },
    });
}

export function useDeleteAttachment(taskId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (attachmentId: number | string) => deleteAttachment(attachmentId),
        onSuccess: () => {
            if (taskId != null && taskId !== '') {
                queryClient.invalidateQueries({ queryKey: taskAttachmentsKey(taskId!) });
                queryClient.invalidateQueries({ queryKey: taskTimelineKey(taskId!) });
            }
            toast.success('Attachment deleted successfully');
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to delete attachment'));
        },
    });
}

// Timeline keys
const taskTimelineKey = (taskId: number | string) => ['taskTimeline', taskId] as const;

export function useTaskTimeline(taskId: number | string | undefined | null) {
    return useQuery({
        queryKey: taskTimelineKey(taskId!),
        queryFn: () => fetchTaskTimeline(taskId!),
        enabled: taskId != null && taskId !== '',
    });
}

export function useCreateClient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: ClientCreate) => createClient(body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientKeys.all });
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to create client'));
        },
    });
}

export function useClientDetail(clientId: number | string | undefined | null) {
    return useQuery({
        queryKey: clientKeys.detail(clientId!),
        queryFn: () => fetchClient(clientId!),
        enabled: clientId != null && clientId !== '',
        staleTime: 3 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}
