import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { InvoiceAPIResponse } from '@/types/invoice';
import { mapInvoice } from './mappers';
import { fetchProjects } from './projects';

export async function fetchInvoices(params?: { project_id?: number | string }): Promise<InvoiceAPIResponse[]> {
    const res = await api.get<InvoiceAPIResponse[]>('/invoices/', { params });
    return res.data;
}

export async function downloadInvoice(invoiceId: number | string): Promise<Blob> {
    const res = await api.get(`/invoices/${invoiceId}/download`, {
        responseType: 'blob',
    });
    return res.data;
}

export async function generateInvoicePDF(invoiceId: number | string): Promise<void> {
    await api.post(`/invoices/${invoiceId}/generate-pdf`);
}

export const invoiceKeys = {
    all: ['invoices'] as const,
    list: (params?: { project_id?: number | string }) => [...invoiceKeys.all, 'list', params ?? 'all'] as const,
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
