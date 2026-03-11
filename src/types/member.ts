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
    initials: string;
}

