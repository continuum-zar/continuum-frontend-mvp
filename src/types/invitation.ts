/** Project invitation (API shape). */
export interface ProjectInvitation {
    id: number;
    project_id: number;
    project_name: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
    inviter_name?: string | null;
}

/** Invitation resolved by email link token (GET /invitations/by-token/:token). */
export interface ProjectInvitationByToken extends ProjectInvitation {
    inviter_email?: string | null;
}
