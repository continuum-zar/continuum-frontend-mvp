/**
 * TanStack Query hooks for the RBAC subsystem. Mirrors the conventions in
 * `src/api/hooks.ts` (query keys, toast on mutation error).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
    assignMemberRole,
    createRole,
    deleteRole,
    fetchMemberRoles,
    fetchMyPermissions,
    fetchPermissionCatalog,
    fetchProjectRoles,
    rbacKeys,
    resetRole,
    setRoleOverrides,
    transferOwnership,
    unassignMemberRole,
    updateRole,
    type CreateRoleBody,
    type UpdateRoleBody,
} from '@/api/rbac';
import { getApiErrorMessage } from '@/api/hooks';

type Id = number | string;

const FIVE_MIN = 5 * 60 * 1000;

/** The permission catalog is static reference data — cache it aggressively. */
export function usePermissionCatalog(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: rbacKeys.catalog(),
        queryFn: fetchPermissionCatalog,
        enabled: options?.enabled !== false,
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnWindowFocus: false,
    });
}

export function useProjectRoles(
    projectId: Id | undefined | null,
    options?: { enabled?: boolean },
) {
    const enabled =
        projectId != null && projectId !== '' && options?.enabled !== false;
    return useQuery({
        queryKey: rbacKeys.roles(projectId ?? 'none'),
        queryFn: () => fetchProjectRoles(projectId!),
        enabled,
        staleTime: FIVE_MIN,
        refetchOnWindowFocus: false,
    });
}

export function useMyProjectPermissions(
    projectId: Id | undefined | null,
    options?: { enabled?: boolean },
) {
    const enabled =
        projectId != null && projectId !== '' && options?.enabled !== false;
    return useQuery({
        queryKey: rbacKeys.myPermissions(projectId ?? 'none'),
        queryFn: () => fetchMyPermissions(projectId!),
        enabled,
        staleTime: FIVE_MIN,
        refetchOnWindowFocus: false,
    });
}

export function useMemberRoles(
    projectId: Id | undefined | null,
    userId: Id | undefined | null,
    options?: { enabled?: boolean },
) {
    const enabled =
        projectId != null &&
        projectId !== '' &&
        userId != null &&
        userId !== '' &&
        options?.enabled !== false;
    return useQuery({
        queryKey: rbacKeys.memberRoles(projectId ?? 'none', userId ?? 'none'),
        queryFn: () => fetchMemberRoles(projectId!, userId!),
        enabled,
        staleTime: FIVE_MIN,
        refetchOnWindowFocus: false,
    });
}

/** Invalidate every RBAC query for a project (roles + effective perms). */
function invalidateRoles(queryClient: ReturnType<typeof useQueryClient>, projectId: Id) {
    void queryClient.invalidateQueries({ queryKey: rbacKeys.roles(projectId) });
    void queryClient.invalidateQueries({ queryKey: rbacKeys.myPermissions(projectId) });
    void queryClient.invalidateQueries({
        queryKey: [...rbacKeys.all, 'member-roles', String(projectId)],
    });
}

export function useCreateRole(projectId: Id) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateRoleBody) => createRole(projectId, body),
        onSuccess: () => {
            invalidateRoles(queryClient, projectId);
            toast.success('Role created');
        },
        onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to create role')),
    });
}

export function useUpdateRole(projectId: Id) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ roleId, body }: { roleId: number; body: UpdateRoleBody }) =>
            updateRole(projectId, roleId, body),
        // Optimistically flip the toggle immediately so the UI feels instant; the
        // controlled <Switch> reads `effective_permissions`, so patch both lists.
        onMutate: async ({ roleId, body }) => {
            const key = rbacKeys.roles(projectId);
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData<import('@/types/rbac').RbacRole[]>(key);
            if (previous && body.permissions) {
                queryClient.setQueryData<import('@/types/rbac').RbacRole[]>(
                    key,
                    previous.map((r) =>
                        r.id === roleId
                            ? {
                                  ...r,
                                  permissions: body.permissions!,
                                  effective_permissions: body.permissions!,
                              }
                            : r,
                    ),
                );
            }
            return { previous };
        },
        onError: (err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(rbacKeys.roles(projectId), context.previous);
            }
            toast.error(getApiErrorMessage(err, 'Failed to update role'));
        },
        onSettled: () => invalidateRoles(queryClient, projectId),
    });
}

export function useResetRole(projectId: Id) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (roleId: number) => resetRole(projectId, roleId),
        onSuccess: () => {
            invalidateRoles(queryClient, projectId);
            toast.success('Role reset to default');
        },
        onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to reset role')),
    });
}

export function useSetRoleOverrides(projectId: Id) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            roleId,
            overrides,
        }: {
            roleId: number;
            overrides: Record<string, boolean>;
        }) => setRoleOverrides(projectId, roleId, overrides),
        onSuccess: () => invalidateRoles(queryClient, projectId),
        onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to apply override')),
    });
}

export function useDeleteRole(projectId: Id) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            roleId,
            reassignToRoleId,
        }: {
            roleId: number;
            reassignToRoleId?: number | null;
        }) => deleteRole(projectId, roleId, reassignToRoleId),
        onSuccess: () => {
            invalidateRoles(queryClient, projectId);
            toast.success('Role deleted');
        },
        onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to delete role')),
    });
}

export function useAssignMemberRole(projectId: Id) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
            assignMemberRole(projectId, userId, roleId),
        onSuccess: () => {
            invalidateRoles(queryClient, projectId);
            toast.success('Role assigned');
        },
        onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to assign role')),
    });
}

export function useUnassignMemberRole(projectId: Id) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
            unassignMemberRole(projectId, userId, roleId),
        onSuccess: () => invalidateRoles(queryClient, projectId),
        onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to remove role')),
    });
}

export function useTransferOwnership(projectId: Id) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newOwnerUserId: number) =>
            transferOwnership(projectId, newOwnerUserId),
        onSuccess: () => {
            invalidateRoles(queryClient, projectId);
            toast.success('Ownership transferred');
        },
        onError: (err) =>
            toast.error(getApiErrorMessage(err, 'Failed to transfer ownership')),
    });
}
