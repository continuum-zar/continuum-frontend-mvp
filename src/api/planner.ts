import api from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from './hooks';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlannerMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface FileContent {
    filename: string;
    text: string;
}

export interface FigmaContext {
    file_key: string;
    node_id?: string | null;
    url?: string | null;
    source_name?: string | null;
    summary: string;
    components?: string[];
    tokens?: string[];
    interactions?: string[];
    screenshots?: string[];
}

export interface PlannerChatResponse {
    reply: string;
    confidence: number;
    missing_areas: string[];
    ready_to_plan: boolean;
}

export interface ChecklistItem {
    title: string;
    is_completed: boolean;
}

export interface PlannedTask {
    title: string;
    description: string | null;
    scope_weight: 'XS' | 'S' | 'M' | 'L' | 'XL';
    checklist: ChecklistItem[];
    labels: string[];
}

export interface PlannedMilestone {
    name: string;
    description: string | null;
    tasks: PlannedTask[];
}

export interface ProjectPlan {
    project_name: string;
    project_description: string;
    milestones: PlannedMilestone[];
    summary: string;
}

export interface GeneratePlanResponse {
    plan: ProjectPlan;
    confidence: number;
}

export interface ApprovePlanResponse {
    project_id: number;
    milestone_ids: number[];
    task_ids: number[];
    milestone_count: number;
    task_count: number;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function uploadPlannerFile(file: File): Promise<FileContent> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<FileContent>('/planner/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600_000,
    });
    return data;
}

function isAbortLike(err: unknown): boolean {
    const e = err as { code?: string; name?: string };
    return (
        e?.code === 'ERR_CANCELED' ||
        e?.name === 'CanceledError' ||
        e?.name === 'AbortError'
    );
}

export async function sendPlannerChat(
    messages: PlannerMessage[],
    file_contents: FileContent[],
    figma_context?: FigmaContext | null,
    options?: { signal?: AbortSignal },
): Promise<PlannerChatResponse> {
    const { data } = await api.post<PlannerChatResponse>(
        '/planner/chat',
        {
            messages,
            file_contents,
            figma_context,
        },
        { signal: options?.signal, timeout: 600_000 },
    );
    return data;
}

export async function generatePlan(
    messages: PlannerMessage[],
    file_contents: FileContent[],
    figma_context?: FigmaContext | null,
): Promise<GeneratePlanResponse> {
    const { data: raw } = await api.post<unknown>('/planner/generate-plan', {
        messages,
        file_contents,
        figma_context,
    }, {
        timeout: 600_000,
    });

    const data = (typeof raw === 'string' ? JSON.parse(raw) : raw) as GeneratePlanResponse;
    if (
        !data ||
        typeof data !== 'object' ||
        !('plan' in data) ||
        data.plan == null ||
        typeof (data as GeneratePlanResponse).confidence !== 'number'
    ) {
        throw new Error('Unexpected generate-plan response shape');
    }
    return data;
}

export async function approvePlan(plan: ProjectPlan): Promise<ApprovePlanResponse> {
    const { data } = await api.post<ApprovePlanResponse>('/planner/approve-plan', {
        plan,
    }, {
        timeout: 600_000,
    });
    return data;
}

// ---------------------------------------------------------------------------
// React Query mutation hooks
// ---------------------------------------------------------------------------

export function useUploadPlannerFile() {
    return useMutation({
        mutationFn: uploadPlannerFile,
        onError: (err: unknown) => {
            toast.error(getApiErrorMessage(err, 'Failed to upload file'));
        },
    });
}

export function usePlannerChat() {
    return useMutation({
        mutationFn: ({
            messages,
            file_contents,
            signal,
            figma_context,
        }: {
            messages: PlannerMessage[];
            file_contents: FileContent[];
            figma_context?: FigmaContext | null;
            signal?: AbortSignal;
        }) => sendPlannerChat(messages, file_contents, figma_context, { signal }),
        onError: (err: unknown) => {
            if (isAbortLike(err)) return;
            toast.error(getApiErrorMessage(err, 'Chat request failed'));
        },
    });
}

export function useGeneratePlan() {
    return useMutation({
        mutationFn: ({
            messages,
            file_contents,
            figma_context,
        }: {
            messages: PlannerMessage[];
            file_contents: FileContent[];
            figma_context?: FigmaContext | null;
        }) => generatePlan(messages, file_contents, figma_context),
        onError: (err: unknown) => {
            toast.error(getApiErrorMessage(err, 'Plan generation failed'));
        },
    });
}

export function useApprovePlan() {
    return useMutation({
        mutationFn: approvePlan,
        onError: (err: unknown) => {
            toast.error(getApiErrorMessage(err, 'Failed to create project from plan'));
        },
    });
}
