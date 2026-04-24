export interface RegisterPayload {
    first_name: string;
    last_name: string;
    email: string;
    password?: string;
}

export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role?: string;
    /** When set, webhook commit attribution matches this email if it differs from `email`. */
    git_commit_email?: string | null;
    hourly_rate?: number | string;
    invoice_currency?: string;
    bank_account_name?: string | null;
    bank_account_number?: string | null;
    bank_name?: string | null;
    bank_iban?: string | null;
    bank_swift_bic?: string | null;
}
