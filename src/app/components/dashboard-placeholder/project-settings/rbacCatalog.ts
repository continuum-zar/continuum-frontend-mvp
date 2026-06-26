/**
 * Static grouping that maps the Permissions tab's category tabs
 * (Project / Milestones / Tasks / Timesheet & Invoice) onto the backend
 * catalog section titles. Section strings must match
 * `app/rbac/catalog.py` SECTIONS exactly.
 */

import type { RbacRole } from '@/types/rbac';

export type PermissionCategory = 'project' | 'milestones' | 'tasks' | 'invoicing';

/** Canonical display order for the default roles; custom roles sort after. */
const ROLE_ORDER = [
    'owner',
    'admin',
    'project_manager',
    'developer',
    'view_only',
    'contractor',
];

export function sortRoles(roles: RbacRole[]): RbacRole[] {
    return [...roles].sort((a, b) => {
        const ai = a.default_key ? ROLE_ORDER.indexOf(a.default_key) : ROLE_ORDER.length;
        const bi = b.default_key ? ROLE_ORDER.indexOf(b.default_key) : ROLE_ORDER.length;
        if (ai !== bi) return ai - bi;
        return a.name.localeCompare(b.name);
    });
}

export const PERMISSION_CATEGORIES: { key: PermissionCategory; label: string; sections: string[] }[] = [
    {
        key: 'project',
        label: 'Project',
        sections: [
            'Role & Member Management',
            'Project Details',
            'Recent Activity',
            'Resources (project level)',
            'Milestones & Sprints (project overview)',
            'Repositories',
            'Team',
        ],
    },
    {
        key: 'milestones',
        label: 'Milestones',
        sections: [
            'Sprint Visibility & Status',
            'Sprint Management',
            'Sprint Views',
            'Board Management',
            'Task Movement',
            'Time Logging (sprint level)',
        ],
    },
    {
        key: 'tasks',
        label: 'Tasks',
        sections: [
            'Task Creation',
            'Task Field Editing',
            'Checklist',
            'Comments',
            'Activity Log',
            'Resources (task level)',
            'Dependencies',
            'Time Logging (task level)',
            'AI Assistant',
            'Task Deletion',
        ],
    },
    {
        key: 'invoicing',
        label: 'Timesheet & Invoice',
        sections: ['Invoices', 'Timesheets'],
    },
];

/** Short, human descriptions for each section header (matches the design's subtitles). */
export const SECTION_SUBTITLES: Record<string, string> = {
    'Role & Member Management': 'Control who belongs to the project and what roles they hold',
    'Project Details': "Edit the project's name, description, dates, and core settings",
    'Recent Activity': 'See the recent activity feed on the project view',
    'Resources (project level)': 'Manage links and files attached to the project',
    'Milestones & Sprints (project overview)': 'View and create milestones from the project view',
    Repositories: 'Connect, index, and manage linked repositories',
    Team: 'See teammates, their hours, and task completion counts',
    'Sprint Visibility & Status': 'Control sprint visibility and status indicators',
    'Sprint Management': 'Create, rename, and delete sprints',
    'Sprint Views': 'Access the Kanban, List, Gantt, and Calendar views',
    'Board Management': 'Reorder, add, and remove Kanban boards',
    'Task Movement': 'Move tasks within and across sprints',
    'Time Logging (sprint level)': 'Log time manually or with the timer on sprint tasks',
    'Task Creation': 'Create new tasks within a sprint',
    'Task Field Editing': 'Edit task status, priority, tags, effort, assignees, and branches',
    Checklist: 'View, add, edit, and delete task checklists',
    Comments: 'View, post, edit, and moderate task comments',
    'Activity Log': "View a task's activity history",
    'Resources (task level)': 'Attach and remove links and files on tasks',
    Dependencies: 'View, add, and remove task dependencies',
    'Time Logging (task level)': 'Log time manually or with the timer on tasks',
    'AI Assistant': 'View and interact with the in-ticket AI assistant',
    'Task Deletion': 'Delete tasks and tickets',
    Invoices: 'Create, edit, delete, export, and send invoices',
    Timesheets: 'View, edit, approve, and export timesheets',
};
