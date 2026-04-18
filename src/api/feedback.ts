import api from '@/lib/api';

export type SubmitIssueReportBody = {
    message: string;
    contact_email?: string | null;
};

/** Response from POST /issue-reports (201). */
export type IssueReportResponse = {
    id: number;
    message: string;
    user_id: number | null;
    contact_email: string | null;
    created_at: string;
};

/**
 * POST /issue-reports — submit an issue report (optional auth links the row to the current user).
 */
export async function submitIssueReport(body: SubmitIssueReportBody): Promise<IssueReportResponse> {
    const payload: Record<string, unknown> = {
        message: body.message.trim(),
    };
    const contact = body.contact_email?.trim();
    if (contact) {
        payload.contact_email = contact;
    }
    const { data } = await api.post<IssueReportResponse>('/issue-reports', payload);
    return data;
}
