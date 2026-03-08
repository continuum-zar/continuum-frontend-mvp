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

/** Fetch a single project by ID. Returns UI-shaped project detail. */
export async function fetchProject(id: number | string): Promise<ProjectDetail> {
    const { data } = await api.get<ProjectDetailAPIResponse>(`/projects/${id}`);
    return mapProjectDetail(data);
}

/** Fetch tasks for a project. Returns UI-shaped tasks. */
export async function fetchProjectTasks(projectId: number | string): Promise<Task[]> {
    const { data } = await api.get<TaskAPIResponse[]>(`/tasks/`, {
        params: { project_id: projectId },
    });
    return (data ?? []).map(mapTask);
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
