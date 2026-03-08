export interface ProjectAPIResponse {
    id: number;
    name: string;
    description?: string;
    status: string;
    /** Backend list endpoint returns progress (float); some endpoints may use progress_percentage */
    progress?: number;
    progress_percentage?: number;
    due_date?: string;
    team_size?: number;
    member_count?: number;
    /** Backend list endpoint returns last_active (datetime); some endpoints may use updated_at */
    last_active?: string;
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
