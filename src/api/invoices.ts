import api from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { InvoiceAPIResponse, InvoiceWithItems } from '@/types/invoice';
import { mapInvoice } from './mappers';
import { fetchProjects, projectKeys } from './projects';
import { useAuthStore } from '@/store/authStore';
import { STALE_MODERATE_MS, LONG_GC_MS } from '@/lib/queryDefaults';

export async function fetchInvoices(params?: { project_id?: number | string; status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' }): Promise<InvoiceAPIResponse[]> {
    const res = await api.get<InvoiceAPIResponse[]>('/invoices/', { params });
    return res.data;
}

export async function fetchInvoice(invoiceId: number | string): Promise<InvoiceWithItems> {
    const res = await api.get<InvoiceWithItems>(`/invoices/${invoiceId}`);
    return res.data;
}

export interface DownloadInvoiceResult {
    blob: Blob;
    filename: string;
}

function parseContentDispositionFilename(headers: Record<string, unknown>): string {
    const contentDisposition = headers?.['content-disposition'];
    let filename = 'invoice.pdf';
    if (typeof contentDisposition === 'string') {
        const match =
            contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"'\s;]+)["']?/i) ??
            contentDisposition.match(/filename=["']?([^"'\s;]+)["']?/i);
        if (match?.[1]) filename = decodeURIComponent(match[1].trim());
    }
    return filename;
}

export async function downloadInvoice(invoiceId: number | string): Promise<DownloadInvoiceResult> {
    const res = await api.get<Blob>(`/invoices/${invoiceId}/download`, {
        responseType: 'blob',
    });
    const filename = parseContentDispositionFilename(res.headers as Record<string, unknown>);
    return { blob: res.data, filename };
}

export async function generateInvoicePdf(invoiceId: number | string): Promise<void> {
    await api.post(`/invoices/${invoiceId}/generate-pdf`);
}

export type InvoiceExportPdfBody = {
    invoice_number: string;
    issued_on: string;
    project_id?: number;
    line_items: { description: string; quantity: number; rate: number }[];
    tax_rate?: number;
    currency?: string | null;
    due_terms?: string | null;
};

/** POST /invoices/export-pdf — HTML template PDF (preview / modal export). */
export async function exportInvoicePreviewPdf(body: InvoiceExportPdfBody): Promise<DownloadInvoiceResult> {
    const res = await api.post<Blob>('/invoices/export-pdf', body, {
        responseType: 'blob',
    });
    const filename = parseContentDispositionFilename(res.headers as Record<string, unknown>);
    return { blob: res.data, filename };
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
    const payload = {
        ...body,
        project_id: typeof body.project_id === 'string' ? Number(body.project_id) : body.project_id,
        ...(body.hourly_rate_override != null && { hourly_rate_override: body.hourly_rate_override }),
    };
    const res = await api.post<InvoiceAPIResponse>('/invoices/generate', payload);
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
    const queryClient = useQueryClient();
    const userId = useAuthStore((s) => s.user?.id);
    return useQuery({
        queryKey: invoiceKeys.list(params),
        queryFn: async () => {
            const invoices = await fetchInvoices(params);
            const projects =
                userId != null && userId !== ''
                    ? await queryClient.ensureQueryData({
                          queryKey: projectKeys.listForUser(userId),
                          queryFn: fetchProjects,
                      })
                    : [];

            const projectNameMap = new Map<number, string>(
                projects.map((p) => [p.apiId, p.title])
            );

            return invoices.map((inv) => mapInvoice(inv, projectNameMap));
        },
        staleTime: STALE_MODERATE_MS,
        gcTime: LONG_GC_MS,
        refetchOnWindowFocus: false,
    });
}
