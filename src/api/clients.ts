import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { fetchInvoices } from './invoices';

export interface ClientAPIResponse {
    id: number;
    name: string;
    email: string;
    contact?: string;
    phone?: string;
    // Possible future stats from backend (Ticket 13)
    total_invoiced?: number;
    invoice_count?: number;
}

export interface Client {
    id: string;
    name: string;
    email: string;
    contact: string;
    phone: string;
    totalInvoiced: number;
    invoiceCount: number;
}

export async function fetchClients(): Promise<ClientAPIResponse[]> {
    const { data } = await api.get<ClientAPIResponse[]>('/clients/');
    return data ?? [];
}

export const clientKeys = {
    all: ['clients'] as const,
};

export function useClients() {
    return useQuery({
        queryKey: clientKeys.all,
        queryFn: async () => {
            const [clients, invoices] = await Promise.all([
                fetchClients(),
                fetchInvoices(),
            ]);

            // Aggregation logic if stats not in backend
            // Note: Currently ProjectAPIResponse doesn't have client_id in our local types,
            // but the TODO.md says "project has client_id".
            // Let's assume the backend returns it now.

            return clients.map((c) => {
                // If backend already provides them, use them.
                if (c.total_invoiced !== undefined && c.invoice_count !== undefined) {
                    return {
                        id: String(c.id),
                        name: c.name,
                        email: c.email,
                        contact: c.contact ?? 'N/A',
                        phone: c.phone ?? 'N/A',
                        totalInvoiced: c.total_invoiced,
                        invoiceCount: c.invoice_count,
                    };
                }

                // Otherwise, aggregate on the frontend
                // 1. Get projects for this client
                // We need to know which projects belong to this client.
                // If ProjectAPIResponse has client_id, we can filter.
                
                // For now, let's use InvoiceAPIResponse.client_name to match if possible,
                // or just default to 0 if we can't reliably aggregate.
                
                const clientInvoices = invoices.filter(inv => inv.client_name === c.name);
                const totalInvoiced = clientInvoices.reduce((sum, inv) => sum + inv.total, 0);
                const invoiceCount = clientInvoices.length;

                return {
                    id: String(c.id),
                    name: c.name,
                    email: c.email,
                    contact: c.contact ?? 'N/A',
                    phone: c.phone ?? 'N/A',
                    totalInvoiced,
                    invoiceCount,
                };
            });
        },
    });
}
