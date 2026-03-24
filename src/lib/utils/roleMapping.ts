import type { Role } from '@/app/context/RoleContext';

export function mapBackendRole(backendRole: string | undefined): Role {
    if (!backendRole) return 'Project Manager';

    switch (backendRole.toLowerCase()) {
        case 'admin':
            return 'Admin';
        case 'project_manager':
            return 'Project Manager';
        case 'backend':
        case 'frontend':
        case 'designer':
        case 'developer':
            return 'Developer';
        case 'client':
            return 'Client';
        default:
            return 'Project Manager';
    }
}

/**
 * Role for dashboard UI: global Client accounts stay Client; otherwise prefer the
 * current project's membership role (e.g. project-member client vs developer).
 */
export function effectiveDashboardRole(
    globalRole: Role,
    selectedProjectMemberRole: string | undefined
): Role {
    if (globalRole === 'Client') return 'Client';
    if (selectedProjectMemberRole) return mapBackendRole(selectedProjectMemberRole);
    return globalRole;
}
