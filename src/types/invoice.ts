export interface InvoiceAPIResponse {
    id: number;
    invoice_number: string;
    project_id: number;
    project_name?: string;
    client_name?: string;
    billing_period_start: string;
    billing_period_end: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    subtotal: number;
    tax_amount: number;
    total: number;
    created_at: string;
    updated_at?: string;
}

export interface Invoice {
    id: string;
    number: string;
    client: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue' | 'draft';
    dueDate: string;
    issueDate: string;
}
