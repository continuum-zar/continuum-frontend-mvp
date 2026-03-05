export interface ProjectAPIResponse {
    id: number;
    name: string;
    description: string;
    status: string;
    progress_percentage?: number;
    due_date?: string;
    team_size?: number;
    member_count?: number;
    updated_at?: string;
}

export interface Project {
    id: string; // Internal frontend ID (string to match existing UI)
    apiId: number; // Numeric ID from backend
    title: string;
    description: string;
    status: 'active' | 'completed' | 'on-hold' | string;
    progress: number;
    dueDate: string;
    teamSize: number;
    lastActive: string;
}
