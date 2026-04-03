import api from '@/lib/api';
import type { PaginatedResponse } from '@/types/api';
import type { ProjectAPIResponse, ProjectDetailAPIResponse } from '@/types/project';
import type { MilestoneAPIResponse } from '@/types/milestone';
import type { MemberAPIResponse } from '@/types/member';
import type { AttachmentAPIResponse } from '@/types/attachment';
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
    const { data } = await api.get<PaginatedResponse<ProjectAPIResponse>>('/projects/');
    return (data.data ?? []).map(mapProjectListItem);
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
        role: body.role ?? 'developer',
    });
    return data;
}

/**
 * Unify `useParams()` string ids and `Number(id)` so React Query keys match; otherwise
 * invalidateQueries from mutations (number) does not refresh queries subscribed with a string id.
 */
export function normalizeProjectKeyId(projectId: number | string): number | string {
    if (typeof projectId === 'number' && Number.isFinite(projectId)) return projectId;
    if (typeof projectId === 'string' && /^\d+$/.test(projectId)) return Number(projectId);
    return projectId;
}

export const projectKeys = {
    all: ['projects'] as const,
    list: () => [...projectKeys.all, 'list'] as const,
    /** List key scoped to the signed-in user so cache is never reused across accounts. */
    listForUser: (userId: string | number | undefined | null) =>
        [...projectKeys.list(), userId ?? 'signed-out'] as const,
    detail: (id: number | string) => [...projectKeys.all, 'detail', normalizeProjectKeyId(id)] as const,
    tasks: (projectId: number | string) => [...projectKeys.all, 'detail', normalizeProjectKeyId(projectId), 'tasks'] as const,
    allTasks: () => ['tasks', 'all'] as const,
    milestones: (projectId: number | string) => [...projectKeys.all, 'detail', normalizeProjectKeyId(projectId), 'milestones'] as const,
    members: (projectId: number | string) => [...projectKeys.all, 'detail', normalizeProjectKeyId(projectId), 'members'] as const,
    repositories: (projectId: number | string) => [...projectKeys.all, 'detail', normalizeProjectKeyId(projectId), 'repositories'] as const,
    loggedHours: (projectId?: string | null) => ['logged-hours', projectId ?? 'all'] as const,
    projectAttachments: (projectId: number | string) =>
        [...projectKeys.all, 'detail', normalizeProjectKeyId(projectId), 'attachments'] as const,
};

// ---------------------------------------------------------------------------
// Project-level attachments
// ---------------------------------------------------------------------------

interface ProjectAttachmentsListResponse {
    attachments: AttachmentAPIResponse[];
    total: number;
}

/** Fetch all attachments for a project. */
export async function fetchProjectAttachments(projectId: number | string): Promise<AttachmentAPIResponse[]> {
    const { data } = await api.get<ProjectAttachmentsListResponse>(`/projects/${projectId}/attachments`);
    return data?.attachments ?? [];
}

/** Upload a file attachment to a project. */
export async function uploadProjectAttachment(projectId: number | string, file: File): Promise<AttachmentAPIResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<AttachmentAPIResponse>(`/projects/${projectId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
}

/** Add a URL link attachment to a project. */
export async function addProjectAttachmentLink(
    projectId: number | string,
    payload: { url: string; name?: string | null }
): Promise<AttachmentAPIResponse> {
    const { data } = await api.post<AttachmentAPIResponse>(`/projects/${projectId}/attachments/link`, {
        url: payload.url,
        name: payload.name ?? payload.url,
    });
    return data;
}

/** Delete a project attachment. */
export async function deleteProjectAttachment(attachmentId: number | string): Promise<void> {
    await api.delete(`/projects/attachments/${attachmentId}`);
}

/** Get the download URL for a project attachment. */
export function getProjectAttachmentDownloadUrl(attachmentId: number | string): string {
    return `/api/v1/projects/attachments/${attachmentId}/download`;
}

function parseContentDispositionFilename(headers: Record<string, unknown>): string {
    const contentDisposition = headers?.['content-disposition'];
    let filename = 'attachment';
    if (typeof contentDisposition === 'string') {
        const match =
            contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"'\s;]+)["']?/i) ??
            contentDisposition.match(/filename=["']?([^"'\s;]+)["']?/i);
        if (match?.[1]) filename = decodeURIComponent(match[1].trim());
    }
    return filename;
}

/** Result of downloading a project attachment (blob + suggested filename). */
export interface DownloadProjectAttachmentResult {
    blob: Blob;
    filename: string;
}

/**
 * Download a project attachment via axios (sends `Authorization`).
 * Plain `<a href={getProjectAttachmentDownloadUrl(...)}>` does not send the bearer token — use this instead.
 */
export async function downloadProjectAttachment(
    attachmentId: number | string
): Promise<DownloadProjectAttachmentResult> {
    const res = await api.get<Blob>(`/projects/attachments/${attachmentId}/download`, {
        responseType: 'blob',
    });
    const filename = parseContentDispositionFilename(res.headers as Record<string, unknown>);
    return { blob: res.data, filename };
}
