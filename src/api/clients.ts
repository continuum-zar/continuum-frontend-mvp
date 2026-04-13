import api from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchInvoices } from './invoices';
import { fetchProjects, projectKeys } from './projects';
import { useAuthStore } from '@/store/authStore';

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

export interface ClientCreate {
    name: string;
    email: string;
    contact?: string;
    phone?: string;
}

export async function fetchClients(): Promise<ClientAPIResponse[]> {
    const { data } = await api.get<ClientAPIResponse[]>('/clients/');
    return data ?? [];
}

export async function createClient(client: ClientCreate): Promise<ClientAPIResponse> {
    const { data } = await api.post<ClientAPIResponse>('/clients/', client);
    return data;
}

export async function fetchClient(clientId: number | string): Promise<ClientAPIResponse> {
    const { data } = await api.get<ClientAPIResponse>(`/clients/${clientId}`);
    return data;
}

export const clientKeys = {
    all: ['clients'] as const,
    detail: (id: string | number) => [...clientKeys.all, 'detail', id] as const,
};

export function useClients() {
    const queryClient = useQueryClient();
    const userId = useAuthStore((s) => s.user?.id);
    return useQuery({
        queryKey: clientKeys.all,
        queryFn: async () => {
            const [clients, invoices] = await Promise.all([fetchClients(), fetchInvoices()]);
            const projects =
                userId != null && userId !== ''
                    ? await queryClient.ensureQueryData({
                          queryKey: projectKeys.listForUser(userId),
                          queryFn: fetchProjects,
                      })
                    : [];

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
                        .filter((p) => p.clientId != null && p.clientId === c.id)
                        .map((p) => p.apiId)
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
        // Reference data: keep longer in cache and avoid refetch on window focus
        staleTime: 3 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}
