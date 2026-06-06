import api, { resolveApiBaseURL } from '@/lib/api';
import { getSseTicket } from '@/api/sseTicket';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from './hooks';
import type {
    MigrationApplyRequest,
    MigrationApplyResult,
    MigrationJobDetail,
    MigrationListResponse,
    MigrationMappingPatch,
    MigrationUploadResponse,
    SourceHintOption,
} from '@/types/migration';

// ---------------------------------------------------------------------------
// Plain fetchers
// ---------------------------------------------------------------------------

export async function fetchMigration(jobId: number | string): Promise<MigrationJobDetail> {
    const { data } = await api.get<MigrationJobDetail>(`/migrations/${jobId}`);
    return data;
}

export async function listMigrations(params?: { limit?: number }): Promise<MigrationListResponse> {
    const { data } = await api.get<MigrationListResponse>('/migrations', { params });
    return data;
}

/**
 * Upload a PM-tool export as multipart. ``sourceHint === 'auto'`` is encoded
 * by simply omitting the field — the backend's Pydantic Literal only accepts
 * the four real source names and treats a missing hint as "auto-detect".
 *
 * Long timeout because parse runs server-side and we'd rather wait for the
 * real ready/failed result than time out at the network layer.
 */
export async function uploadMigration(args: {
    file: File;
    sourceHint?: SourceHintOption;
    autoGroupMilestones?: boolean;
}): Promise<MigrationUploadResponse> {
    const formData = new FormData();
    formData.append('file', args.file);
    if (args.sourceHint && args.sourceHint !== 'auto') {
        formData.append('source_hint', args.sourceHint);
    }
    if (args.autoGroupMilestones) {
        formData.append('auto_group_milestones', 'true');
    }
    const { data } = await api.post<MigrationUploadResponse>('/migrations/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600_000,
    });
    return data;
}

export async function patchMigrationMapping(
    jobId: number | string,
    body: MigrationMappingPatch,
): Promise<MigrationJobDetail> {
    const { data } = await api.patch<MigrationJobDetail>(`/migrations/${jobId}/mapping`, body);
    return data;
}

export async function applyMigration(
    jobId: number | string,
    body: MigrationApplyRequest,
): Promise<MigrationApplyResult> {
    const { data } = await api.post<MigrationApplyResult>(`/migrations/${jobId}/apply`, body);
    return data;
}

export async function cancelMigration(jobId: number | string): Promise<void> {
    await api.delete(`/migrations/${jobId}`);
}

/**
 * SSE stream URL for a migration job.
 *
 * EventSource cannot send custom headers, so we mint a short-lived single-use
 * ticket via `POST /events/sse-ticket` and pass it via `?ticket=` rather
 * than embedding the JWT in the URL (avoids leaks into access logs and
 * browser history). Mirrors `agentRunEventsStreamUrl` in `api/agent.ts`.
 */
export async function migrationEventsStreamUrl(jobId: number | string): Promise<string> {
    const base = resolveApiBaseURL().replace(/\/$/, '');
    const ticket = await getSseTicket();
    const qs = new URLSearchParams({ ticket }).toString();
    const path = `${base}/migrations/${jobId}/events`;
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return `${path}?${qs}`;
    }
    if (typeof window === 'undefined') {
        return `${path}?${qs}`;
    }
    return `${window.location.origin}${path}?${qs}`;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const migrationKeys = {
    all: ['migrations'] as const,
    list: () => [...migrationKeys.all, 'list'] as const,
    detail: (jobId: number | string) => [...migrationKeys.all, 'detail', String(jobId)] as const,
};

// ---------------------------------------------------------------------------
// TanStack hooks
// ---------------------------------------------------------------------------

export function useMigration(jobId: number | string | undefined, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: jobId !== undefined ? migrationKeys.detail(jobId) : migrationKeys.detail('pending'),
        queryFn: () => fetchMigration(jobId as number | string),
        enabled: jobId !== undefined && (options?.enabled ?? true),
    });
}

export function useRecentMigrations(options?: { limit?: number }) {
    return useQuery({
        queryKey: [...migrationKeys.list(), options?.limit ?? 20] as const,
        queryFn: () => listMigrations({ limit: options?.limit ?? 20 }),
    });
}

export function useUploadMigration() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: uploadMigration,
        onSuccess: (res) => {
            // Seed the detail cache so the preview page renders without a flicker.
            qc.invalidateQueries({ queryKey: migrationKeys.detail(res.job_id) });
            qc.invalidateQueries({ queryKey: migrationKeys.list() });
        },
        onError: (err: unknown) => {
            toast.error(getApiErrorMessage(err, 'Failed to upload export'));
        },
    });
}

export function usePatchMigrationMapping(jobId: number | string | undefined) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: MigrationMappingPatch) => {
            if (jobId === undefined) throw new Error('jobId required');
            return patchMigrationMapping(jobId, body);
        },
        onSuccess: () => {
            if (jobId !== undefined) {
                qc.invalidateQueries({ queryKey: migrationKeys.detail(jobId) });
            }
        },
        onError: (err: unknown) => {
            toast.error(getApiErrorMessage(err, 'Failed to save mapping'));
        },
    });
}

export function useApplyMigration(jobId: number | string | undefined) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: MigrationApplyRequest) => {
            if (jobId === undefined) throw new Error('jobId required');
            return applyMigration(jobId, body);
        },
        onSuccess: () => {
            if (jobId !== undefined) {
                qc.invalidateQueries({ queryKey: migrationKeys.detail(jobId) });
            }
        },
        onError: (err: unknown) => {
            toast.error(getApiErrorMessage(err, 'Failed to start import'));
        },
    });
}

export function useCancelMigration() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: cancelMigration,
        onSuccess: (_data, jobId) => {
            qc.invalidateQueries({ queryKey: migrationKeys.detail(jobId) });
            qc.invalidateQueries({ queryKey: migrationKeys.list() });
        },
        onError: (err: unknown) => {
            toast.error(getApiErrorMessage(err, 'Failed to cancel migration'));
        },
    });
}
