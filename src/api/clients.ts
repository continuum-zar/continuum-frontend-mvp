import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { ProjectAPIResponse } from '@/types/project';
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
            const [clients, invoices, projectsRes] = await Promise.all([
                fetchClients(),
                fetchInvoices(),
                api.get<ProjectAPIResponse[]>('/projects/'),
            ]);
            const projects = projectsRes.data ?? [];

            return clients.map((c) => {
                // If backend already provides stats (Ticket 13), use them.
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

                // Aggregate on the frontend: projects have client_id; sum invoice totals per client.
                const projectIdsForClient = new Set(
                    projects
                        .filter((p) => p.client_id != null && p.client_id === c.id)
                        .map((p) => p.id)
                );
                const clientInvoices =
                    projectIdsForClient.size > 0
                        ? invoices.filter((inv) => projectIdsForClient.has(inv.project_id))
                        : invoices.filter((inv) => inv.client_name === c.name);
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
