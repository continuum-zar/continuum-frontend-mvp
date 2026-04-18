import api from '@/lib/api';

export type SubmitIssueReportBody = {
    message: string;
    contact_email?: string | null;
};

/**
 * POST /users/me/feedback — submit an issue report from the feedback modal (authenticated).
 */
export async function submitIssueReport(body: SubmitIssueReportBody): Promise<void> {
    const payload: Record<string, unknown> = {
        message: body.message.trim(),
    };
    const contact = body.contact_email?.trim();
    if (contact) {
        payload.contact_email = contact;
    }
    await api.post('/users/me/feedback', payload);
}
