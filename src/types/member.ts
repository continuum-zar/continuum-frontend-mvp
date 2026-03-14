/** Raw project member from API (GET /projects/:id/members, POST /projects/:id/members) */
export interface MemberAPIResponse {
    id: number;
    user_id: number;
    role: string;
    added_at?: string;
    user?: {
        first_name?: string;
        last_name?: string;
        email?: string;
        role?: string;
    } | null;
    first_name?: string;
    last_name?: string;
    email?: string;
}

/** Member shape used by UI (e.g. ProjectBoard Team modal) */
export interface Member {
    id: number;
    userId: number;
    name: string;
    email: string;
    role: string;
    /** Global user role (e.g. backend = Developer, project_manager = PM) for filtering */
    userRole?: string;
    initials: string;
}
