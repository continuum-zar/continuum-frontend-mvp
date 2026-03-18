import api from '@/lib/api';
import type { ProjectAPIResponse, ProjectDetailAPIResponse } from '@/types/project';
import type { MilestoneAPIResponse } from '@/types/milestone';
import type { MemberAPIResponse } from '@/types/member';
import {
    mapProjectListItem,
    mapProjectDetail,
    mapMilestone,
    mapMember,
} from '@/api/mappers';
import type { Project, ProjectDetail } from '@/types/project';
import type { Milestone } from '@/types/milestone';
import type { Member } from '@/types/member';

export type { Project, ProjectDetail, ProjectAPIResponse };
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

/** Delete a project permanently. DELETE /api/v1/projects/{id}. Requires admin. */
export async function deleteProject(projectId: number | string): Promise<void> {
    await api.delete(`/projects/${projectId}`);
}

/** Fetch a single project by ID. Returns UI-shaped project detail. */
export async function fetchProject(id: number | string): Promise<ProjectDetail> {
    const { data } = await api.get<ProjectDetailAPIResponse>(`/projects/${id}`);
    return mapProjectDetail(data);
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

/** Update a milestone. PUT /api/v1/milestones/{id}. */
export async function updateMilestone(
    milestoneId: number | string,
    body: { name?: string; due_date?: string; description?: string }
): Promise<MilestoneAPIResponse> {
    const payload: Record<string, string | undefined> = {};
    if (body.name !== undefined) payload.name = body.name;
    if (body.due_date !== undefined) payload.due_date = body.due_date;
    if (body.description !== undefined) payload.description = body.description;
    const { data } = await api.put<MilestoneAPIResponse>(`/milestones/${milestoneId}`, payload);
    return data;
}

/** Delete a milestone. DELETE /api/v1/milestones/{id}. */
export async function deleteMilestone(milestoneId: number | string): Promise<void> {
    await api.delete(`/milestones/${milestoneId}`);
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

export const projectKeys = {
    all: ['projects'] as const,
    list: () => [...projectKeys.all, 'list'] as const,
    detail: (id: number | string) => [...projectKeys.all, 'detail', id] as const,
    tasks: (projectId: number | string) => [...projectKeys.all, 'detail', projectId, 'tasks'] as const,
    allTasks: () => ['tasks', 'all'] as const,
    milestones: (projectId: number | string) => [...projectKeys.all, 'detail', projectId, 'milestones'] as const,
    members: (projectId: number | string) => [...projectKeys.all, 'detail', projectId, 'members'] as const,
    repositories: (projectId: number | string) => [...projectKeys.all, 'detail', projectId, 'repositories'] as const,
    loggedHours: (projectId?: string | null) => ['logged-hours', projectId ?? 'all'] as const,
};
