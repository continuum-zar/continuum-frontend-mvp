import type { Role } from '@/app/context/RoleContext';

export function mapBackendRole(backendRole: string | undefined): Role {
    if (!backendRole) return 'Project Manager';

    switch (backendRole.toLowerCase()) {
        case 'admin':
            return 'Admin';
        case 'project_manager':
            return 'Project Manager';
        case 'backend':
        case 'developer':
            return 'Developer';
        case 'client':
            return 'Client';
        default:
            return 'Project Manager';
    }
}
