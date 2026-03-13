export interface ProjectAPIResponse {
    id: number;
    name: string;
    description?: string;
    status: string;
    /** Backend: project belongs to this client (for client stats aggregation). */
    client_id?: number;
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

/** Raw project detail from API (GET /projects/:id) */
export interface ProjectDetailAPIResponse {
    id: number;
    name: string;
    description?: string | null;
    status: string;
    due_date?: string | null;
    created_at?: string;
    updated_at?: string | null;
    progress_percentage?: number;
    total_logged_hours?: number;
    members?: unknown[];
    tasks?: unknown[];
}

/** Project detail shape used by UI (e.g. ProjectBoard header) */
export interface ProjectDetail {
    id: number;
    name: string;
    description: string;
}
