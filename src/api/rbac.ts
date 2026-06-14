/**
 * RBAC API client — talks to the backend RBAC endpoints
 * (continuum-backend `app/api/v1/routes/rbac.py`).
 */
import api from '@/lib/api';
import type {
    EffectivePermissions,
    MemberRolesResponse,
    PermissionCatalog,
    RbacRole,
} from '@/types/rbac';

type Id = number | string;

export const rbacKeys = {
    all: ['rbac'] as const,
    catalog: () => [...rbacKeys.all, 'catalog'] as const,
    roles: (projectId: Id) => [...rbacKeys.all, 'roles', String(projectId)] as const,
    memberRoles: (projectId: Id, userId: Id) =>
        [...rbacKeys.all, 'member-roles', String(projectId), String(userId)] as const,
    myPermissions: (projectId: Id) =>
        [...rbacKeys.all, 'my-permissions', String(projectId)] as const,
};

/** GET /rbac/permissions — the full permission catalog grouped by section. */
export async function fetchPermissionCatalog(): Promise<PermissionCatalog> {
    const { data } = await api.get<PermissionCatalog>('/rbac/permissions');
    return data;
}

/** GET /projects/{id}/roles — seeds the six default roles on first access. */
export async function fetchProjectRoles(projectId: Id): Promise<RbacRole[]> {
    const { data } = await api.get<RbacRole[]>(`/projects/${projectId}/roles`);
    return Array.isArray(data) ? data : [];
}

export interface CreateRoleBody {
    name: string;
    description?: string | null;
    permissions: string[];
    duplicate_from_role_id?: number | null;
}

export async function createRole(projectId: Id, body: CreateRoleBody): Promise<RbacRole> {
    const { data } = await api.post<RbacRole>(`/projects/${projectId}/roles`, {
        name: body.name,
        description: body.description ?? null,
        permissions: body.permissions,
        duplicate_from_role_id: body.duplicate_from_role_id ?? null,
    });
    return data;
}

export interface UpdateRoleBody {
    name?: string;
    description?: string | null;
    permissions?: string[];
}

export async function updateRole(
    projectId: Id,
    roleId: Id,
    body: UpdateRoleBody,
): Promise<RbacRole> {
    const { data } = await api.put<RbacRole>(`/projects/${projectId}/roles/${roleId}`, body);
    return data;
}

export async function deleteRole(
    projectId: Id,
    roleId: Id,
    reassignToRoleId?: number | null,
): Promise<void> {
    const qs =
        reassignToRoleId != null ? `?reassign_to_role_id=${reassignToRoleId}` : '';
    await api.delete(`/projects/${projectId}/roles/${roleId}${qs}`);
}

/** Restore a default role's packaged bundle and clear all overrides. */
export async function resetRole(projectId: Id, roleId: Id): Promise<RbacRole> {
    const { data } = await api.post<RbacRole>(
        `/projects/${projectId}/roles/${roleId}/reset`,
    );
    return data;
}

export async function setRoleOverrides(
    projectId: Id,
    roleId: Id,
    overrides: Record<string, boolean>,
): Promise<RbacRole> {
    const { data } = await api.put<RbacRole>(
        `/projects/${projectId}/roles/${roleId}/overrides`,
        { overrides },
    );
    return data;
}

export async function fetchMemberRoles(
    projectId: Id,
    userId: Id,
): Promise<MemberRolesResponse> {
    const { data } = await api.get<MemberRolesResponse>(
        `/projects/${projectId}/members/${userId}/roles`,
    );
    return data;
}

export async function assignMemberRole(
    projectId: Id,
    userId: Id,
    roleId: number,
): Promise<MemberRolesResponse> {
    const { data } = await api.post<MemberRolesResponse>(
        `/projects/${projectId}/members/${userId}/roles`,
        { role_id: roleId },
    );
    return data;
}

export async function unassignMemberRole(
    projectId: Id,
    userId: Id,
    roleId: Id,
): Promise<MemberRolesResponse> {
    const { data } = await api.delete<MemberRolesResponse>(
        `/projects/${projectId}/members/${userId}/roles/${roleId}`,
    );
    return data;
}

/** GET /projects/{id}/me/permissions — the caller's effective permission set. */
export async function fetchMyPermissions(projectId: Id): Promise<EffectivePermissions> {
    const { data } = await api.get<EffectivePermissions>(
        `/projects/${projectId}/me/permissions`,
    );
    return data;
}

export async function transferOwnership(
    projectId: Id,
    newOwnerUserId: number,
): Promise<void> {
    await api.post(`/projects/${projectId}/transfer-ownership`, {
        new_owner_user_id: newOwnerUserId,
    });
}
