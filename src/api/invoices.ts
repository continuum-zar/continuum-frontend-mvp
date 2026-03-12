import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { InvoiceAPIResponse, InvoiceWithItems } from '@/types/invoice';
import { mapInvoice } from './mappers';
import { fetchProjects } from './projects';

export async function fetchInvoices(params?: { project_id?: number | string; status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' }): Promise<InvoiceAPIResponse[]> {
    const res = await api.get<InvoiceAPIResponse[]>('/invoices/', { params });
    return res.data;
}

export async function fetchInvoice(invoiceId: number | string): Promise<InvoiceWithItems> {
    const res = await api.get<InvoiceWithItems>(`/invoices/${invoiceId}`);
    return res.data;
}

export async function downloadInvoicePdf(invoiceId: number | string): Promise<Blob> {
    const res = await api.get(`/invoices/${invoiceId}/download`, {
        responseType: 'blob',
    });
    return res.data;
}

export async function generateInvoicePdf(invoiceId: number | string): Promise<void> {
    await api.post(`/invoices/${invoiceId}/generate-pdf`);
}

export interface InvoiceGenerate {
    project_id: number | string;
    billing_period_start: string;
    billing_period_end: string;
    status: string;
    tax_rate: number;
    hourly_rate_override?: number;
}

export async function generateInvoice(body: InvoiceGenerate): Promise<InvoiceAPIResponse> {
    const res = await api.post<InvoiceAPIResponse>('/invoices/generate', body);
    return res.data;
}

export async function updateInvoiceStatus(
    invoiceId: number | string,
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
): Promise<InvoiceAPIResponse> {
    const res = await api.put<InvoiceAPIResponse>(`/invoices/${invoiceId}`, { status });
    return res.data;
}

export const invoiceKeys = {
    all: ['invoices'] as const,
    list: (params?: { project_id?: number | string; status?: string }) => [...invoiceKeys.all, 'list', params ?? 'all'] as const,
    detail: (id: number | string) => [...invoiceKeys.all, 'detail', id] as const,
};

export function useInvoices(params?: { project_id?: number | string }) {
    return useQuery({
        queryKey: invoiceKeys.list(params),
        queryFn: async () => {
            const [invoices, projects] = await Promise.all([
                fetchInvoices(params),
                fetchProjects(),
            ]);

            const projectNameMap = new Map<number, string>(
                projects.map((p) => [p.apiId, p.title])
            );

            return invoices.map((inv) => mapInvoice(inv, projectNameMap));
        },
    });
}
