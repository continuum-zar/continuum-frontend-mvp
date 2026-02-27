import { Role } from '@/app/context/RoleContext';

export function mapBackendRole(backendRole: string | undefined): Role {
    if (!backendRole) return 'Project Manager';

    switch (backendRole.toLowerCase()) {
        case 'project_manager':
            return 'Project Manager';
        case 'developer':
            return 'Developer';
        case 'client':
            return 'Client';
        default:
            return 'Project Manager';
    }
}
