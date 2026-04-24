import api from '@/lib/api';

/** Body for PUT /users/me (partial update). */
export type UpdateCurrentUserBody = {
    first_name?: string;
    last_name?: string;
    display_name?: string;
    hourly_rate?: number;
    skills?: string[];
    /** Email used on Git commits when it differs from your Continuum login; omit or null to clear. */
    git_commit_email?: string | null;
    invoice_currency?: string;
    bank_account_name?: string | null;
    bank_account_number?: string | null;
    bank_name?: string | null;
    bank_iban?: string | null;
    bank_swift_bic?: string | null;
};

export type CurrentUserResponse = {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    display_name: string;
    hourly_rate: string | number;
    role: string;
    is_verified: boolean;
    skills: string[];
    git_commit_email?: string | null;
    created_at?: string;
    invoice_currency?: string;
    bank_account_name?: string | null;
    bank_account_number?: string | null;
    bank_name?: string | null;
    bank_iban?: string | null;
    bank_swift_bic?: string | null;
};

export async function updateCurrentUserProfile(body: UpdateCurrentUserBody): Promise<CurrentUserResponse> {
    const { data } = await api.put<CurrentUserResponse>('/users/me', body);
    return data;
}
