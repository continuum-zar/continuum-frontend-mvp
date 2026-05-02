import api from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchMilestones, projectKeys } from './projects';
import { getApiErrorMessage } from './hooks';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Single clarifying question with four suggested answers (UI adds "Other"). From `/planner/chat`. */
export interface PlannerChoiceQuestion {
    id: string;
    prompt: string;
    /** Exactly four strings from the API */
    options: string[];
}

/**
 * Assistant messages may include `choice_questions`.
 * User messages from choice-card batches may set `omitFromDisplay` so the bubble is hidden (answer shows on the card).
 */
export interface PlannerMessage {
    role: 'user' | 'assistant';
    content: string;
    choice_questions?: PlannerChoiceQuestion[];
    omitFromDisplay?: boolean;
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
    blueprint?: FigmaBlueprint | null;
}

export interface BlueprintNode {
    id: string;
    name: string;
    type: string;
    semantic: string;
    children?: BlueprintNode[];
    annotations?: {
        logic?: string[];
        state?: string[];
        data?: string[];
        aria?: string[];
        route?: string[];
        api?: string[];
        custom?: Record<string, string[]>;
    };
}

export interface FigmaBlueprint {
    file_key: string;
    node_id?: string | null;
    url: string;
    source_name?: string | null;
    frame_name?: string | null;
    pruned_node_count: number;
    raw_node_count: number;
    root: BlueprintNode;
    flows: Array<{ node_id: string; node_name: string; kind: string; value: string }>;
    component_inventory: Array<{ node_id: string; name: string; component_id?: string | null }>;
    token_index: Record<string, string>;
    quality_report?: {
        status: string;
        missing_annotations?: string[];
        implementation_risks?: string[];
        confidence?: number;
    } | null;
    digest_markdown: string;
}

export interface PlannerChatResponse {
    reply: string;
    confidence: number;
    missing_areas: string[];
    ready_to_plan: boolean;
    choice_questions?: PlannerChoiceQuestion[];
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
    figma_node_ids?: string[];
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

export async function fetchFigmaBlueprint(url: string, node_id?: string | null): Promise<FigmaBlueprint> {
    const { data } = await api.post<FigmaBlueprint>('/figma/blueprint', {
        url,
        ...(node_id ? { node_id } : {}),
    }, {
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

/** Backend `PlannerMessage` is only `role` + `content`; strip client-only fields. */
function plannerMessagesForApi(
    messages: PlannerMessage[],
): Array<{ role: 'user' | 'assistant'; content: string }> {
    return messages.map((m) => ({ role: m.role, content: m.content }));
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
            messages: plannerMessagesForApi(messages),
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
        messages: plannerMessagesForApi(messages),
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

export async function approvePlan(
    plan: ProjectPlan,
    figma_blueprint?: FigmaBlueprint | null,
): Promise<ApprovePlanResponse> {
    const { data } = await api.post<ApprovePlanResponse>('/planner/approve-plan', {
        plan,
        ...(figma_blueprint ? { figma_blueprint } : {}),
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
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            plan,
            figma_blueprint,
        }: {
            plan: ProjectPlan;
            figma_blueprint?: FigmaBlueprint | null;
        }) => approvePlan(plan, figma_blueprint),
        onSuccess: async (data) => {
            const pid = data.project_id;
            // Left rail + dashboard read from React Query; without this, the new project and
            // milestones stay stale until a full page refresh.
            void queryClient.invalidateQueries({ queryKey: projectKeys.list() });
            void queryClient.invalidateQueries({ queryKey: projectKeys.detail(pid) });
            void queryClient.invalidateQueries({ queryKey: projectKeys.milestones(pid) });
            void queryClient.invalidateQueries({ queryKey: projectKeys.tasks(pid) });
            void queryClient.invalidateQueries({ queryKey: projectKeys.tasksInfinite(pid) });
            void queryClient.invalidateQueries({ queryKey: projectKeys.kanbanBoard(pid) });
            void queryClient.invalidateQueries({ queryKey: projectKeys.members(pid) });
            void queryClient.invalidateQueries({ queryKey: projectKeys.allTasks() });
            void queryClient.invalidateQueries({ queryKey: [...projectKeys.all, 'assigned-tasks'] });
            void queryClient.invalidateQueries({ queryKey: [...projectKeys.all, 'created-tasks'] });
            try {
                await queryClient.prefetchQuery({
                    queryKey: projectKeys.milestones(pid),
                    queryFn: () => fetchMilestones(pid),
                });
            } catch {
                /* non-fatal — invalidation above still triggers refetch for mounted queries */
            }
        },
        onError: (err: unknown) => {
            toast.error(getApiErrorMessage(err, 'Failed to create project from plan'));
        },
    });
}
