import api from '@/lib/api';
import type { ProjectAPIResponse, ProjectDetailAPIResponse } from '@/types/project';
import type { TaskAPIResponse } from '@/types/task';
import type { MilestoneAPIResponse } from '@/types/milestone';
import type { MemberAPIResponse } from '@/types/member';
import {
    mapProjectListItem,
    mapProjectDetail,
    mapTask,
    mapMilestone,
    mapMember,
} from '@/api/mappers';
import type { Project, ProjectDetail } from '@/types/project';
import type { Task, TaskStatus } from '@/types/task';
import type { Milestone } from '@/types/milestone';
import type { Member } from '@/types/member';

export type { Project, ProjectDetail, ProjectAPIResponse };
export type { Task, TaskStatus };
export type { Milestone };
export type { Member };

/** Fetch all projects (list). Returns UI-shaped projects. */
export async function fetchProjects(): Promise<Project[]> {
    const { data } = await api.get<ProjectAPIResponse[]>('/projects/');
    return (data ?? []).map(mapProjectListItem);
}

/** Create a project. Returns raw API response; call fetchProjects() to refresh list. */
export async function createProject(body: {
    name: string;
    description?: string;
    due_date?: string | null;
    status?: string;
}): Promise<ProjectAPIResponse> {
    const { data } = await api.post<ProjectAPIResponse>('/projects/', {
        name: body.name,
        description: body.description ?? null,
        due_date: body.due_date ?? null,
        status: body.status ?? 'active',
    });
    return data;
}

/** Update a project. PUT /api/v1/projects/{id}. Refetch list after success. */
export async function updateProject(
    projectId: number | string,
    body: { name?: string; description?: string; due_date?: string | null; status?: string }
): Promise<ProjectAPIResponse> {
    const { data } = await api.put<ProjectAPIResponse>(`/projects/${projectId}`, {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description ?? null }),
        ...(body.due_date !== undefined && { due_date: body.due_date ?? null }),
        ...(body.status !== undefined && { status: body.status }),
    });
    return data;
}

/** Fetch a single project by ID. Returns UI-shaped project detail. */
export async function fetchProject(id: number | string): Promise<ProjectDetail> {
    const { data } = await api.get<ProjectDetailAPIResponse>(`/projects/${id}`);
    return mapProjectDetail(data);
}

/** Dropdown task shape for time-tracking / task selector (id as string for Select value). */
export interface TaskOption {
    id: string;
    title: string;
    project: string;
    project_id: number;
}

/** Fetch all tasks for the current user's projects (no project_id). For time log task dropdown. */
export async function fetchAllTasks(): Promise<TaskOption[]> {
    const { data } = await api.get<TaskAPIResponse[]>('/tasks/');
    return (data ?? []).map((t) => ({
        id: String(t.id),
        title: t.title ?? '',
        project: t.project_name ?? '',
        project_id: t.project_id,
    }));
}

/** Fetch tasks for a project. Returns UI-shaped tasks. */
export async function fetchProjectTasks(projectId: number | string): Promise<Task[]> {
    const { data } = await api.get<TaskAPIResponse[]>(`/tasks/`, {
        params: { project_id: projectId },
    });
    return (data ?? []).map(mapTask);
}

/** Fetch a single task by ID. Returns raw API response (includes checklists). */
export async function fetchTask(taskId: number | string): Promise<TaskAPIResponse> {
    const { data } = await api.get<TaskAPIResponse>(`/tasks/${taskId}`);
    return data;
}

/** Update task status. Returns updated task from API (use mapTask if you need UI shape). */
export async function updateTaskStatus(
    taskId: number | string,
    status: TaskStatus
): Promise<TaskAPIResponse> {
    const backendStatus = status === 'in-progress' ? 'in_progress' : status;
    const { data } = await api.patch<TaskAPIResponse>(`/tasks/${taskId}/status`, {
        status: backendStatus,
    });
    return data;
}

/** Fetch milestones for a project. Returns UI-shaped milestones. */
export async function fetchMilestones(projectId: number | string): Promise<Milestone[]> {
    const { data } = await api.get<MilestoneAPIResponse[]>(`/projects/${projectId}/milestones`);
    return (data ?? []).map(mapMilestone);
}

/** Create a milestone. Returns raw API response; call fetchMilestones(projectId) to refresh. */
export async function createMilestone(body: {
    project_id: number;
    name: string;
    due_date: string;
    description?: string;
}): Promise<MilestoneAPIResponse> {
    const { data } = await api.post<MilestoneAPIResponse>('/milestones/', {
        project_id: body.project_id,
        name: body.name,
        due_date: body.due_date,
        description: body.description ?? undefined,
    });
    return data;
}

/** Fetch members for a project. Returns UI-shaped members. */
export async function fetchMembers(projectId: number | string): Promise<Member[]> {
    const { data } = await api.get<MemberAPIResponse[]>(`/projects/${projectId}/members`);
    return (data ?? []).map(mapMember);
}

/** Add a member to a project. Returns raw API response; call fetchMembers(projectId) to refresh. */
export async function addMember(
    projectId: number | string,
    body: { email: string; role?: string }
): Promise<MemberAPIResponse> {
    const { data } = await api.post<MemberAPIResponse>(`/projects/${projectId}/members`, {
        email: body.email,
        role: body.role ?? 'member',
    });
    return data;
}

/** Response shape for a single attachment (backend may vary). */
export interface TaskAttachmentAPIResponse {
    id: number;
    name?: string;
    file_name?: string;
    size?: number;
    size_bytes?: number;
    url?: string;
}

/** Fetch attachments for a task. Returns empty array if endpoint not available (e.g. 404). */
export async function fetchTaskAttachments(taskId: number | string): Promise<TaskAttachmentAPIResponse[]> {
    try {
        const { data } = await api.get<TaskAttachmentAPIResponse[]>(`/tasks/${taskId}/attachments`);
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

/** Format file size for display. */
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Map API attachment to UI shape. */
export function mapTaskAttachment(a: TaskAttachmentAPIResponse): { id: number | string; name: string; size: string; url?: string } {
    const name = a.name ?? a.file_name ?? 'Attachment';
    const size = a.size ?? a.size_bytes ?? 0;
    return { id: a.id, name, size: formatFileSize(size), url: a.url };
}

/** Upload a file as a task attachment. POST /api/v1/tasks/{taskId}/attachments (multipart). */
export async function uploadTaskAttachment(taskId: number | string, file: File): Promise<TaskAttachmentAPIResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<TaskAttachmentAPIResponse>(`/tasks/${taskId}/attachments`, formData);
    return data;
}
