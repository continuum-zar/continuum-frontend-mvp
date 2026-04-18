import {
    useQuery,
    useMutation,
    useQueryClient,
    useInfiniteQuery,
    type QueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    fetchProjectIntegrations,
    createProjectIntegration,
    updateIntegration,
    deleteIntegration,
    testIntegration,
    integrationKeys,
} from './integrations';
export { integrationKeys };
import type { IntegrationCreate, IntegrationUpdate } from '@/types/integration';
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
    fetchProjectKanbanBoard,
    updateProjectKanbanBoard,
    deleteProjectKanbanColumn,
    projectKeys,
    fetchProjectAttachments,
    uploadProjectAttachment,
    addProjectAttachmentLink,
    deleteProjectAttachment,
    normalizeProjectKeyId,
} from './projects';
export { projectKeys };
import {
    acceptInvitation,
    declineInvitation,
    fetchInvitationByToken,
    fetchPendingInvitations,
    invitationKeys,
} from './invitations';
export { invitationKeys };
import { createClient, fetchClient, clientKeys } from './clients';
import type { ClientCreate } from './clients';
import { fetchCursorMcpTaskDetail } from './cursorMcp';

import {
    fetchTask,
    fetchProjectTasks,
    fetchProjectTasksPage,
    fetchTaskTimelinePage,
    fetchTaskCommentsPage,
    fetchAllTasks,
    fetchTasksAssignedToUser,
    fetchTasksCreatedByUser,
    createTask,
    updateTaskStatus,
    updateTask,
    setTaskLinkedBranch,
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
import { fetchLoggedHours, createLoggedHour, sumLoggedHoursForTask } from './loggedHours';
import type { CreateLoggedHourBody } from './loggedHours';
import { submitIssueReport } from './feedback';
import type { SubmitIssueReportBody } from './feedback';
import type { KanbanBoardColumnApi } from '@/types/kanban';
import type { Task, TaskAPIResponse, ScopeWeight, TaskPriority } from '@/types/task';
import type { CreateTaskBody } from './tasks';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';
import {
    STALE_REFERENCE_MS,
    STALE_MODERATE_MS,
    STALE_TASK_LIST_MS,
    STALE_ASSIGNED_LIST_MS,
    TASK_DETAIL_STALE_MS,
    STALE_TIME_DATA_MS,
    STALE_SHORT_MS,
    LONG_GC_MS,
} from '@/lib/queryDefaults';

export { TASK_DETAIL_STALE_MS };

export const cursorMcpKeys = {
    taskDetail: (taskId: number | string) => ['cursor-mcp', 'task', taskId] as const,
};

const taskDetailKey = (taskId: number | string) => ['tasks', 'detail', taskId] as const;
const taskTimelineKey = (taskId: number | string) => ['taskTimeline', taskId] as const;

function invalidateDerivedTaskLists(queryClient: QueryClient) {
    void queryClient.invalidateQueries({ queryKey: projectKeys.allTasks() });
    void queryClient.invalidateQueries({ queryKey: [...projectKeys.all, 'assigned-tasks'] });
    void queryClient.invalidateQueries({ queryKey: [...projectKeys.all, 'created-tasks'] });
}

function invalidateTasksForCachedTaskProject(
    queryClient: QueryClient,
    taskId: number | string | undefined | null,
) {
    if (taskId == null || taskId === '') return;
    const task = queryClient.getQueryData<TaskAPIResponse>(taskDetailKey(taskId));
    const pid = task?.project_id;
    if (pid != null) {
        void queryClient.invalidateQueries({ queryKey: projectKeys.tasks(pid) });
    }
}

/** Normalize FastAPI error detail into a single message. */
export function getApiErrorMessage(err: unknown, fallback: string): string {
    if (axios.isAxiosError(err)) {
        const data = err.response?.data as { detail?: string | Array<{ msg?: string }> } | undefined;
        const detail = data?.detail;
        if (typeof detail === 'string') return detail;
        if (Array.isArray(detail) && detail.length > 0) {
            const messages = detail
                .map((d) => (d && typeof d.msg === 'string' ? d.msg : String(d)))
                .filter(Boolean);
            if (messages.length > 0) return messages.join('. ');
        }
        // No HTTP response: dropped connection, proxy/gateway timeout, DNS, CORS, client timeout, etc.
        // The server may still have completed the request — err.message explains the client-side failure.
        if (!err.response && err.message) return err.message;
    } else {
        const data = (err as { response?: { data?: { detail?: string | Array<{ msg?: string }> } } })?.response?.data;
        const detail = data?.detail;
        if (typeof detail === 'string') return detail;
        if (Array.isArray(detail) && detail.length > 0) {
            const messages = detail
                .map((d) => (d && typeof d.msg === 'string' ? d.msg : String(d)))
                .filter(Boolean);
            return messages.length > 0 ? messages.join('. ') : fallback;
        }
    }
    if (err instanceof Error && err.message) return err.message;
    return fallback;
}


export function useProjects(options?: { enabled?: boolean }) {
    const userId = useAuthStore((s) => s.user?.id);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const authReady = isAuthenticated && userId != null && userId !== '';
    const enabled =
        authReady && (options?.enabled !== undefined ? options.enabled : true);
    return useQuery({
        queryKey: projectKeys.listForUser(userId),
        queryFn: fetchProjects,
        enabled,
        staleTime: STALE_REFERENCE_MS,
        gcTime: LONG_GC_MS,
        refetchOnWindowFocus: false,
    });
}

export function useProject(projectId: number | string | undefined | null) {
    return useQuery({
        queryKey: projectKeys.detail(projectId!),
        queryFn: () => fetchProject(projectId!),
        enabled: projectId != null && projectId !== '',
        staleTime: STALE_MODERATE_MS,
        gcTime: LONG_GC_MS,
        refetchOnWindowFocus: false,
    });
}

export function useProjectTasks(projectId: number | string | undefined | null) {
    return useQuery({
        queryKey: projectKeys.tasks(projectId!),
        queryFn: () => fetchProjectTasks(projectId!),
        enabled: projectId != null && projectId !== '',
        staleTime: STALE_TASK_LIST_MS,
        gcTime: LONG_GC_MS,
        refetchOnWindowFocus: false,
    });
}

const PROJECT_TASKS_PAGE_SIZE = 80;

/** Project tasks with pagination — merges pages for kanban and large lists. */
export function useProjectTasksInfinite(projectId: number | string | undefined | null) {
    return useInfiniteQuery({
        queryKey: projectKeys.tasksInfinite(projectId!),
        queryFn: ({ pageParam }) =>
            fetchProjectTasksPage(projectId!, { limit: PROJECT_TASKS_PAGE_SIZE, skip: pageParam }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, _pages, lastPageParam) => {
            const skip = (lastPageParam as number) + lastPage.tasks.length;
            if (lastPage.tasks.length === 0) return undefined;
            return skip < lastPage.total ? skip : undefined;
        },
        enabled: projectId != null && projectId !== '',
        staleTime: STALE_TASK_LIST_MS,
        gcTime: LONG_GC_MS,
        refetchOnWindowFocus: false,
    });
}

/** All tasks across user's projects (for time-tracking task dropdown). No project_id filter. */
export function useAllTasks(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: projectKeys.allTasks(),
        queryFn: fetchAllTasks,
        enabled: options?.enabled,
        staleTime: STALE_TASK_LIST_MS,
        gcTime: LONG_GC_MS,
        refetchOnWindowFocus: false,
    });
}

/** Tasks assigned to the current user (Sprint list on Assigned to Me). */
export function useAssignedToMeTasks(options?: { enabled?: boolean }) {
    const userId = useAuthStore((s) => s.user?.id);
    const numericUserId =
        userId != null && /^\d+$/.test(String(userId).trim()) ? Number(String(userId).trim()) : null;
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    return useQuery({
        queryKey: projectKeys.assignedToMeTasks(userId),
        queryFn: () => fetchTasksAssignedToUser(numericUserId!),
        enabled:
            (options?.enabled !== false) &&
            isAuthenticated &&
            numericUserId != null &&
            Number.isFinite(numericUserId),
        staleTime: STALE_ASSIGNED_LIST_MS,
        gcTime: LONG_GC_MS,
        refetchOnWindowFocus: false,
    });
}

/** Tasks created by the current user (Deliverables on Created by Me). */
export function useCreatedByMeTasks(options?: { enabled?: boolean }) {
    const userId = useAuthStore((s) => s.user?.id);
    const numericUserId =
        userId != null && /^\d+$/.test(String(userId).trim()) ? Number(String(userId).trim()) : null;
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    return useQuery({
        queryKey: projectKeys.createdByMeTasks(userId),
        queryFn: () => fetchTasksCreatedByUser(numericUserId!),
        enabled:
            (options?.enabled !== false) &&
            isAuthenticated &&
            numericUserId != null &&
            Number.isFinite(numericUserId),
        staleTime: STALE_ASSIGNED_LIST_MS,
        gcTime: LONG_GC_MS,
        refetchOnWindowFocus: false,
    });
}

export function useCreateTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateTaskBody) => createTask(body),
        onSuccess: (_data, body) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.tasks(body.project_id) });
            queryClient.invalidateQueries({ queryKey: projectKeys.allTasks() });
            queryClient.invalidateQueries({ queryKey: [...projectKeys.all, 'assigned-tasks'] });
            queryClient.invalidateQueries({ queryKey: [...projectKeys.all, 'created-tasks'] });
            toast.success('Task created');
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to create task'));
        },
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
        staleTime: STALE_TIME_DATA_MS,
        refetchOnWindowFocus: false,
    });
}

/**
 * Sum of logged hours for a single task (GET /logged-hours with project_id + task_id).
 * Refetches when `useCreateLoggedHour` invalidates the `logged-hours` query prefix.
 */
export function useTaskLoggedHoursTotal(
    projectId: number | string | null | undefined,
    taskId: string | number | null | undefined,
    options?: { enabled?: boolean },
) {
    const pidRaw = projectId != null && projectId !== '' ? String(projectId).trim() : '';
    const tidRaw = taskId != null && taskId !== '' ? String(taskId).trim() : '';
    const validProject = /^\d+$/.test(pidRaw);
    const validTask = /^\d+$/.test(tidRaw);
    const enabled =
        (options?.enabled !== false) &&
        validProject &&
        validTask;

    return useQuery({
        queryKey: ['logged-hours', 'task-total', normalizeProjectKeyId(pidRaw), tidRaw] as const,
        queryFn: () => sumLoggedHoursForTask({ project_id: pidRaw, task_id: tidRaw }),
        enabled,
        staleTime: STALE_TIME_DATA_MS,
        refetchOnWindowFocus: false,
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

/** Submit feedback / issue report (POST /issue-reports). Inline error UI is handled by the caller. */
export function useSubmitIssueReport() {
    return useMutation({
        mutationFn: (body: SubmitIssueReportBody) => submitIssueReport(body),
    });
}

export function useProjectMilestones(projectId: number | string | undefined | null) {
    return useQuery({
        queryKey: projectKeys.milestones(projectId!),
        queryFn: () => fetchMilestones(projectId!),
        enabled: projectId != null && projectId !== '',
        staleTime: STALE_REFERENCE_MS,
        gcTime: LONG_GC_MS,
        refetchOnWindowFocus: false,
    });
}

export function useProjectMembers(projectId: number | string | undefined | null, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: projectKeys.members(projectId!),
        queryFn: () => fetchMembers(projectId!),
        enabled: (projectId != null && projectId !== '' && options?.enabled !== false) ?? false,
        staleTime: STALE_REFERENCE_MS,
        gcTime: LONG_GC_MS,
        refetchOnWindowFocus: false,
    });
}

export function useProjectKanbanBoard(projectId: number | string | undefined | null) {
    return useQuery({
        queryKey: projectKeys.kanbanBoard(projectId!),
        queryFn: () => fetchProjectKanbanBoard(projectId!),
        enabled: projectId != null && projectId !== '',
        staleTime: STALE_REFERENCE_MS,
        gcTime: LONG_GC_MS,
        refetchOnWindowFocus: false,
    });
}

export function useUpdateProjectKanbanBoard(projectId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (columns: KanbanBoardColumnApi[]) => updateProjectKanbanBoard(projectId!, columns),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: projectKeys.kanbanBoard(projectId!) });
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to save Kanban board'));
        },
    });
}

export function useDeleteProjectKanbanColumn(projectId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (columnId: string) => deleteProjectKanbanColumn(projectId!, columnId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: projectKeys.kanbanBoard(projectId!) });
            void queryClient.invalidateQueries({ queryKey: projectKeys.tasks(projectId!) });
            invalidateDerivedTaskLists(queryClient);
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to delete column'));
        },
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
        onSuccess: (_data, projectId) => {
            queryClient.invalidateQueries({ queryKey: projectKeys.list() });
            invalidateDerivedTaskLists(queryClient);
            queryClient.removeQueries({ queryKey: projectKeys.detail(projectId) });
            queryClient.removeQueries({ queryKey: projectKeys.tasks(projectId) });
            queryClient.removeQueries({ queryKey: projectKeys.milestones(projectId) });
            queryClient.removeQueries({ queryKey: projectKeys.members(projectId) });
            queryClient.removeQueries({ queryKey: projectKeys.repositories(projectId) });
            queryClient.removeQueries({ queryKey: projectKeys.projectAttachments(projectId) });
            queryClient.removeQueries({ queryKey: projectKeys.kanbanBoard(projectId) });
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
        mutationFn: ({ taskId, status }: { taskId: string; status: string }) => updateTaskStatus(taskId, status),
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
            queryClient.invalidateQueries({ queryKey: [...projectKeys.all, 'assigned-tasks'] });
            queryClient.invalidateQueries({ queryKey: [...projectKeys.all, 'created-tasks'] });
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
            void queryClient.invalidateQueries({ queryKey: invitationKeys.pending() });
            toast.success('Invitation sent');
        },
        onError: (err: unknown) => {
            const status = (err as { response?: { status?: number } })?.response?.status;
            let fallback = 'Failed to send invitation';
            if (status === 409) fallback = 'User is already a member or an invitation is already pending.';
            toast.error(getApiErrorMessage(err, fallback));
        },
    });
}

export function usePendingInvitations(options?: { enabled?: boolean }) {
    const userId = useAuthStore((s) => s.user?.id);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const enabled =
        Boolean(isAuthenticated && userId != null && userId !== '') &&
        (options?.enabled !== undefined ? options.enabled : true);
    return useQuery({
        queryKey: [...invitationKeys.pending(), userId ?? 'signed-out'],
        queryFn: fetchPendingInvitations,
        enabled,
        staleTime: STALE_MODERATE_MS,
        refetchOnWindowFocus: false,
    });
}

export function useInvitationByToken(token: string | null | undefined, options?: { enabled?: boolean }) {
    const t = token?.trim() ?? '';
    const enabled = Boolean(t) && (options?.enabled !== undefined ? options.enabled : true);
    return useQuery({
        queryKey: invitationKeys.byToken(t),
        queryFn: () => fetchInvitationByToken(t),
        enabled,
        staleTime: STALE_MODERATE_MS,
        refetchOnWindowFocus: false,
    });
}

export function useAcceptInvitation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (invitationId: number) => acceptInvitation(invitationId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: invitationKeys.pending() });
            void queryClient.invalidateQueries({ queryKey: projectKeys.list() });
        },
    });
}

export function useDeclineInvitation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (invitationId: number) => declineInvitation(invitationId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: invitationKeys.pending() });
        },
    });
}


export function useUpdateTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            taskId,
            title,
            description,
            status,
            scope_weight,
            priority,
            due_date,
            estimated_hours,
            linked_repo,
            linked_branch,
            checklists,
        }: {
            taskId: string | number;
            title?: string;
            description?: string | null;
            status?: string;
            scope_weight?: ScopeWeight;
            priority?: TaskPriority;
            due_date?: string | null;
            estimated_hours?: number | null;
            linked_repo?: string | null;
            linked_branch?: string | null;
            checklists?: Array<{ id?: string; text: string; done: boolean }>;
        }) =>
            updateTask(taskId, {
                title,
                description,
                status,
                scope_weight,
                priority,
                due_date,
                estimated_hours,
                linked_repo,
                linked_branch,
                checklists,
            }),
        onSuccess: (data, { taskId }) => {
            toast.success('Task updated successfully');
            if (taskId && data) {
                queryClient.setQueryData(taskDetailKey(taskId), data);
            }
            if (taskId) {
                queryClient.invalidateQueries({ queryKey: taskTimelineKey(taskId) });
            }
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to update task'));
        },
        onSettled: (_data, _err, variables) => {
            invalidateTasksForCachedTaskProject(queryClient, variables.taskId);
            invalidateDerivedTaskLists(queryClient);
        },
    });
}

export function useSetTaskLinkedBranch() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            taskId,
            linked_repo,
            linked_branch,
            linked_branch_full_ref,
        }: {
            taskId: string | number;
            linked_repo: string;
            linked_branch: string;
            linked_branch_full_ref?: string | null;
        }) => setTaskLinkedBranch(taskId, { linked_repo, linked_branch, linked_branch_full_ref }),
        onSuccess: (_data, { taskId }) => {
            toast.success('Branch linked to task');
            if (taskId) {
                queryClient.invalidateQueries({ queryKey: taskTimelineKey(taskId) });
                queryClient.invalidateQueries({ queryKey: taskDetailKey(taskId) });
            }
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to link branch'));
        },
        onSettled: (_data, _err, variables) => {
            invalidateTasksForCachedTaskProject(queryClient, variables.taskId);
            invalidateDerivedTaskLists(queryClient);
        },
    });
}

export function useTask(taskId: number | string | undefined | null) {
    return useQuery({
        queryKey: taskDetailKey(taskId!),
        queryFn: () => fetchTask(taskId!),
        enabled: taskId != null && taskId !== '',
        staleTime: TASK_DETAIL_STALE_MS,
        gcTime: LONG_GC_MS,
        refetchOnWindowFocus: false,
    });
}

export function useCursorMcpTaskDetail(taskId: number | string | undefined | null) {
    return useQuery({
        queryKey: cursorMcpKeys.taskDetail(String(taskId)),
        queryFn: () => fetchCursorMcpTaskDetail(taskId!),
        enabled: taskId != null && taskId !== '',
        staleTime: STALE_REFERENCE_MS,
        refetchOnWindowFocus: false,
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
        onSettled: (_data, _err, { taskId }) => {
            invalidateTasksForCachedTaskProject(queryClient, taskId);
            invalidateDerivedTaskLists(queryClient);
        },
    });
}

export function useDeleteTask(projectId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (taskId: number | string) => deleteTask(taskId),
        onSuccess: (_data, taskId) => {
            if (projectId != null && projectId !== '') {
                void queryClient.invalidateQueries({ queryKey: projectKeys.tasks(projectId) });
            } else {
                invalidateTasksForCachedTaskProject(queryClient, taskId);
            }
            invalidateDerivedTaskLists(queryClient);
            void queryClient.invalidateQueries({ queryKey: taskTimelineKey(taskId) });
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
                void queryClient.invalidateQueries({ queryKey: taskTimelineKey(taskId) });
            }
            invalidateTasksForCachedTaskProject(queryClient, taskId);
            invalidateDerivedTaskLists(queryClient);
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
                void queryClient.invalidateQueries({ queryKey: taskTimelineKey(taskId) });
            }
            invalidateTasksForCachedTaskProject(queryClient, taskId);
            invalidateDerivedTaskLists(queryClient);
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
        staleTime: STALE_SHORT_MS,
        refetchOnWindowFocus: false,
    });
}

const TASK_COMMENTS_PAGE_SIZE = 40;

export function useTaskCommentsInfinite(taskId: number | string | undefined | null) {
    return useInfiniteQuery({
        queryKey: [...taskCommentsKey(taskId!), 'infinite'] as const,
        queryFn: ({ pageParam }) =>
            fetchTaskCommentsPage(taskId!, { limit: TASK_COMMENTS_PAGE_SIZE, skip: pageParam }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, _pages, lastPageParam) => {
            if (!lastPage.hasMore) return undefined;
            return (lastPageParam as number) + lastPage.comments.length;
        },
        enabled: taskId != null && taskId !== '',
        staleTime: STALE_SHORT_MS,
        refetchOnWindowFocus: false,
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
        staleTime: STALE_TIME_DATA_MS,
        refetchOnWindowFocus: false,
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

// ---------------------------------------------------------------------------
// Project attachment hooks
// ---------------------------------------------------------------------------
const projectAttachmentsKey = (projectId: number | string) =>
    ['projectAttachments', projectId] as const;

export function useProjectAttachments(projectId: number | string | undefined | null) {
    return useQuery({
        queryKey: projectAttachmentsKey(projectId!),
        queryFn: () => fetchProjectAttachments(projectId!),
        enabled: projectId != null && projectId !== '',
        staleTime: STALE_TIME_DATA_MS,
        refetchOnWindowFocus: false,
    });
}

export function useUploadProjectAttachment(projectId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (file: File) => uploadProjectAttachment(projectId!, file),
        onSuccess: () => {
            if (projectId != null && projectId !== '')
                queryClient.invalidateQueries({ queryKey: projectAttachmentsKey(projectId!) });
            toast.success('Attachment uploaded successfully');
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to upload attachment'));
        },
    });
}

export function useAddProjectAttachmentLink(projectId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: { url: string; name?: string | null }) =>
            addProjectAttachmentLink(projectId!, payload),
        onSuccess: () => {
            if (projectId != null && projectId !== '')
                queryClient.invalidateQueries({ queryKey: projectAttachmentsKey(projectId!) });
            toast.success('Link added');
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to add link'));
        },
    });
}

export function useDeleteProjectAttachment(projectId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (attachmentId: number | string) => deleteProjectAttachment(attachmentId),
        onSuccess: () => {
            if (projectId != null && projectId !== '')
                queryClient.invalidateQueries({ queryKey: projectAttachmentsKey(projectId!) });
            toast.success('Attachment deleted');
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to delete attachment'));
        },
    });
}

export function useTaskTimeline(taskId: number | string | undefined | null) {
    return useQuery({
        queryKey: taskTimelineKey(taskId!),
        queryFn: () => fetchTaskTimeline(taskId!),
        enabled: taskId != null && taskId !== '',
        staleTime: STALE_SHORT_MS,
        refetchOnWindowFocus: false,
    });
}

const TASK_TIMELINE_PAGE_SIZE = 25;

export function useTaskTimelineInfinite(taskId: number | string | undefined | null) {
    return useInfiniteQuery({
        queryKey: [...taskTimelineKey(taskId!), 'infinite'] as const,
        queryFn: ({ pageParam }) =>
            fetchTaskTimelinePage(taskId!, { limit: TASK_TIMELINE_PAGE_SIZE, skip: pageParam }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, _pages, lastPageParam) => {
            if (!lastPage.hasMore) return undefined;
            return (lastPageParam as number) + lastPage.entries.length;
        },
        enabled: taskId != null && taskId !== '',
        staleTime: STALE_SHORT_MS,
        refetchOnWindowFocus: false,
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
        staleTime: STALE_REFERENCE_MS,
        gcTime: LONG_GC_MS,
        refetchOnWindowFocus: false,
    });
}

// Integrations

export function useProjectIntegrations(projectId: number | string | undefined | null) {
    return useQuery({
        queryKey: integrationKeys.list(projectId!),
        queryFn: () => fetchProjectIntegrations(projectId!),
        enabled: projectId != null && projectId !== '',
        staleTime: STALE_REFERENCE_MS,
        refetchOnWindowFocus: false,
    });
}

export function useCreateIntegration(projectId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: IntegrationCreate) => createProjectIntegration(projectId!, body),
        onSuccess: () => {
            if (projectId != null && projectId !== '') {
                queryClient.invalidateQueries({ queryKey: integrationKeys.list(projectId) });
            }
            toast.success('Integration added successfully');
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to add integration'));
        },
    });
}

export function useUpdateIntegration(projectId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ integrationId, body }: { integrationId: number | string; body: IntegrationUpdate }) =>
            updateIntegration(projectId!, integrationId, body),
        onSuccess: () => {
             if (projectId != null && projectId !== '') {
                queryClient.invalidateQueries({ queryKey: integrationKeys.list(projectId) });
            }
            toast.success('Integration updated successfully');
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to update integration'));
        },
    });
}

export function useDeleteIntegration(projectId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (integrationId: number | string) => deleteIntegration(projectId!, integrationId),
        onSuccess: () => {
            if (projectId != null && projectId !== '') {
                queryClient.invalidateQueries({ queryKey: integrationKeys.list(projectId) });
            }
            toast.success('Integration removed successfully');
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to remove integration'));
        },
    });
}

export function useTestIntegration(projectId: number | string | undefined | null) {
    return useMutation({
        mutationFn: (integrationId: number | string) => testIntegration(projectId!, integrationId),
        onSuccess: () => {
            toast.success('Test message sent successfully');
        },
        onError: (err) => {
            toast.error(getApiErrorMessage(err, 'Failed to send test message'));
        },
    });
}
