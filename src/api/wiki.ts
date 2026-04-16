import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from './hooks';
import { projectKeys } from './hooks';
import { STALE_MODERATE_MS, WIKI_SCAN_POLL_MS } from '@/lib/queryDefaults';
import type { FileContent } from './planner';

export interface ScanRepositoryRequest {
    repository_id: number;
}

export interface ScanStatusResponse {
    repository_id: number;
    files_indexed: number;
    last_scanned_at: string | null;
    is_scanning: boolean;
}

export interface GeneratedTaskChecklistItem {
    title: string;
    is_completed?: boolean;
}

export interface GeneratedTask {
    title: string;
    description?: string | null;
    scope_weight: 'XS' | 'S' | 'M' | 'L' | 'XL';
    rationale: string;
    relevant_files: string[];
    checklist: GeneratedTaskChecklistItem[];
    labels?: string[];
}

export interface GenerateTasksResponse {
    project_id: number;
    prompt: string;
    tasks: GeneratedTask[];
    source_files_used: string[];
    confidence: number;
}

/** Task create payload for wiki/confirm (matches backend TaskCreate). */
export interface WikiConfirmTaskItem {
    title: string;
    description?: string | null;
    status?: 'todo' | 'in_progress' | 'done';
    project_id: number;
    milestone_id?: number | null;
    assigned_to?: number | null;
    due_date?: string | null;
    scope_weight: 'XS' | 'S' | 'M' | 'L' | 'XL';
    estimated_hours?: number | null;
    checklists?: Array<{ text: string; done?: boolean }> | null;
    labels?: string[] | null;
}

export interface ConfirmTasksResponse {
    created_count: number;
    task_ids: number[];
}

export async function scanRepository(
    projectId: number | string,
    body: ScanRepositoryRequest
): Promise<ScanStatusResponse> {
    const { data } = await api.post<ScanStatusResponse>(
        `/projects/${projectId}/wiki/scan`,
        body,
        { timeout: 600_000 },
    );
    return data;
}

export async function getWikiScanStatus(
    projectId: number | string
): Promise<ScanStatusResponse[]> {
    const { data } = await api.get<ScanStatusResponse[]>(
        `/projects/${projectId}/wiki/scan/status`
    );
    return data ?? [];
}

export async function generateTasks(
    projectId: number | string,
    body: { prompt: string; max_tasks?: number; file_contents?: FileContent[] }
): Promise<GenerateTasksResponse> {
    const { data } = await api.post<GenerateTasksResponse>(
        `/projects/${projectId}/wiki/generate`,
        {
            prompt: body.prompt,
            max_tasks: body.max_tasks ?? 10,
            ...(body.file_contents?.length ? { file_contents: body.file_contents } : {}),
        },
        { timeout: 600_000 },
    );
    return data;
}

export async function confirmTasks(
    projectId: number | string,
    body: { tasks: WikiConfirmTaskItem[] }
): Promise<ConfirmTasksResponse> {
    const { data } = await api.post<ConfirmTasksResponse>(
        `/projects/${projectId}/wiki/confirm`,
        body
    );
    return data;
}

/** Query key for wiki scan status (invalidate after scan). */
export const wikiScanStatusKey = (projectId: number | string) =>
    [...projectKeys.detail(projectId), 'wiki', 'scan-status'] as const;

/** Fetch scan status for all repos in a project. Polls while any repo is scanning (interval from `WIKI_SCAN_POLL_MS`). */
export function useWikiScanStatus(projectId: number | string | undefined | null) {
    return useQuery({
        queryKey: projectId != null ? wikiScanStatusKey(projectId) : ['wiki', 'scan-status', 'disabled'],
        queryFn: () => getWikiScanStatus(projectId!),
        enabled: projectId != null && projectId !== '',
        staleTime: STALE_MODERATE_MS,
        refetchInterval: (query) =>
            query.state.data?.some((s) => s.is_scanning) ? WIKI_SCAN_POLL_MS : false,
    });
}

/** Start repo indexing (scan runs in background). Poll wiki scan status to see progress. */
export function useScanRepository(projectId: number | string | undefined | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: ScanRepositoryRequest) => scanRepository(projectId!, body),
        onSuccess: () => {
            if (projectId != null)
                queryClient.invalidateQueries({ queryKey: wikiScanStatusKey(projectId) });
            toast.success('Indexing started. This may take a few minutes — the page will update when done.');
        },
        onError: (err: unknown) => {
            toast.error(getApiErrorMessage(err, 'Indexing failed. Check repo URL and API token (for private repos).'));
        },
    });
}
