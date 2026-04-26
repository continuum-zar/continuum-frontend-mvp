import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from './hooks';
import { projectKeys } from './hooks';
import { STALE_MODERATE_MS, WIKI_SCAN_POLL_MS } from '@/lib/queryDefaults';
import type { FileContent } from './planner';
import type { FigmaBlueprint } from './planner';
import type { TaskPriority } from '@/types/task';

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

export interface FigmaAttachmentRequest {
    url: string;
    file_key?: string | null;
    node_id?: string | null;
    source_name?: string | null;
}

export interface GeneratedTaskResource {
    kind: 'figma_link' | 'figma_export' | 'design_blueprint';
    name: string;
    url: string;
    node_id?: string | null;
    asset_name?: string | null;
    format?: string | null;
    mime_type?: string | null;
}

export interface GeneratedTask {
    title: string;
    description?: string | null;
    scope_weight: 'XS' | 'S' | 'M' | 'L' | 'XL';
    /** When returned by generate, forwarded to wiki confirm create. */
    priority?: TaskPriority;
    rationale: string;
    relevant_files: string[];
    checklist: GeneratedTaskChecklistItem[];
    labels?: string[];
    resources?: GeneratedTaskResource[];
    figma_node_ids?: string[];
}

export interface GenerateTasksResponse {
    project_id: number;
    prompt: string;
    tasks: GeneratedTask[];
    source_files_used: string[];
    confidence: number;
    figma_blueprint?: FigmaBlueprint | null;
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
    priority?: TaskPriority;
    scope_weight: 'XS' | 'S' | 'M' | 'L' | 'XL';
    estimated_hours?: number | null;
    checklists?: Array<{ text: string; done?: boolean }> | null;
    labels?: string[] | null;
    resources?: GeneratedTaskResource[];
    figma_node_ids?: string[];
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
    body: {
        prompt: string;
        max_tasks?: number;
        file_contents?: FileContent[];
        figma_attachment?: FigmaAttachmentRequest | null;
        figma_blueprint?: FigmaBlueprint | null;
    }
): Promise<GenerateTasksResponse> {
    const { data } = await api.post<GenerateTasksResponse>(
        `/projects/${projectId}/wiki/generate`,
        {
            prompt: body.prompt,
            max_tasks: body.max_tasks ?? 10,
            ...(body.file_contents?.length ? { file_contents: body.file_contents } : {}),
            ...(body.figma_attachment ? { figma_attachment: body.figma_attachment } : {}),
            ...(body.figma_blueprint ? { figma_blueprint: body.figma_blueprint } : {}),
        },
        { timeout: 600_000 },
    );
    return data;
}

/** Persist AI-generated tasks after user confirmation. Creator is set only on the server from the auth session (`POST .../wiki/confirm`). */
export async function confirmTasks(
    projectId: number | string,
    body: { tasks: WikiConfirmTaskItem[]; figma_blueprint?: FigmaBlueprint | null }
): Promise<ConfirmTasksResponse> {
    const { data } = await api.post<ConfirmTasksResponse>(
        `/projects/${projectId}/wiki/confirm`,
        body,
        { timeout: 180_000 },
    );
    return data;
}

/** Query key for wiki scan status (invalidate after scan). */
export const wikiScanStatusKey = (projectId: number | string) =>
    [...projectKeys.detail(projectId), 'wiki', 'scan-status'] as const;

/**
 * Scan status for all linked repos. Uses short **conditional** polling only while at least one repo has
 * `is_scanning` so the UI can reflect indexing progress without user action. No polling when idle.
 * Prefer replacing this interval with SSE/WebSocket events when the API supports them (see `queryDefaults` note).
 */
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
            toast.success('Indexing started. This may take a few minutes, the page will update when done.');
        },
        onError: (err: unknown) => {
            toast.error(getApiErrorMessage(err, 'Indexing failed. Check repo URL and API token (for private repos).'));
        },
    });
}
