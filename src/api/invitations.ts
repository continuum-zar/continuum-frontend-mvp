import api from '@/lib/api';
import type { ProjectInvitation, ProjectInvitationByToken } from '@/types/invitation';

export const invitationKeys = {
    all: ['invitations'] as const,
    pending: () => [...invitationKeys.all, 'pending'] as const,
    byToken: (token: string) => [...invitationKeys.all, 'by-token', token] as const,
};

export async function fetchPendingInvitations(): Promise<ProjectInvitation[]> {
    const { data } = await api.get<ProjectInvitation[]>('/invitations/pending');
    return data ?? [];
}

export async function fetchInvitationByToken(token: string): Promise<ProjectInvitationByToken> {
    const { data } = await api.get<ProjectInvitationByToken>(`/invitations/by-token/${encodeURIComponent(token)}`);
    return data;
}

export async function acceptInvitation(invitationId: number): Promise<void> {
    await api.post(`/invitations/${invitationId}/accept`);
}

export async function declineInvitation(invitationId: number): Promise<void> {
    await api.post(`/invitations/${invitationId}/decline`);
}
