export interface InvoiceItem {
    id: number;
    invoice_id: number;
    description?: string;
    hours: number;
    hourly_rate: number;
    line_total: number;
    work_date: string;
    user_id: number;
    task_id?: number;
    logged_hour_id?: number;
    created_at: string;
}

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
    pdf_path?: string;
    paid_at?: string;
    created_by?: number;
}

export interface InvoiceWithItems extends InvoiceAPIResponse {
    items: InvoiceItem[];
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
