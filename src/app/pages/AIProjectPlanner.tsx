import { useCallback, useEffect, useRef, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
    ArrowLeft,
    ArrowUp,
    FileText,
    X,
    Loader2,
    ChevronDown,
    ChevronRight,
    Check,
    Info,
    Link2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '../components/ui/collapsible';
import { projectMainHref } from '@/app/data/dashboardPlaceholderProjects';
import { WORKSPACE_BASE, WORKSPACE_SPRINT_SEGMENT, workspaceJoin } from '@/lib/workspacePaths';
import {
    usePlannerChat,
    useUploadPlannerFile,
    useGeneratePlan,
    useApprovePlan,
} from '@/api/planner';
import type {
    PlannerMessage,
    FileContent,
    FigmaContext,
    ProjectPlan,
    PlannedMilestone,
} from '@/api/planner';
import { PlannerConfidenceGauge } from '@/app/components/welcome/LiveProjectGauges';
import {
    aiPlannerBotIconSrc,
    aiPlannerComposerPlusSrc,
    aiPlannerComposerSendSquareSrc,
    aiPlannerComposerSettingsSrc,
} from '../assets/dashboardPlaceholderAssets';
import { cn } from '../components/ui/utils';
import { useAutosizeTextarea } from '@/hooks/useAutosizeTextarea';
import { PlannerAssistantMarkdown } from '@/app/components/planner/PlannerAssistantMarkdown';
import { Dialog, DialogClose, DialogOverlay, DialogPortal } from '@/app/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';

type Phase = 'chat' | 'plan_review' | 'creating' | 'complete';

/** Shown when the API returns no missing_areas yet (Figma empty-state education list). */
const DEFAULT_MISSING_HINTS = [
    'Core objectives / goals',
    'Key features / requirements',
    'Tech stack / architecture preferences',
    'Scope / timeline constraints',
    'Target users / audience',
    'Success criteria',
] as const;

export type AIProjectPlannerProps = {
    /** When true, fills the dashboard-placeholder shell and uses placeholder routes for back / project links. */
    embedded?: boolean;
};

const PLAN_CARD_SHADOW =
    'shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]';

function buildFigmaContextFromUrl(rawUrl: string): FigmaContext | null {
    const trimmed = rawUrl.trim();
    if (!trimmed) return null;

    try {
        const parsed = new URL(trimmed);
        if (!parsed.hostname.includes('figma.com')) return null;

        const segments = parsed.pathname.split('/').filter(Boolean);
        const kind = segments[0];
        const fileKey = kind === 'design' && segments[2] === 'branch'
            ? segments[3]
            : segments[1];
        if (!fileKey) return null;

        const rawNodeId = parsed.searchParams.get('node-id');
        const nodeId = rawNodeId?.replace('-', ':') ?? null;

        return {
            file_key: fileKey,
            node_id: nodeId,
            url: trimmed,
            source_name: segments[2] && segments[2] !== 'branch'
                ? decodeURIComponent(segments[2])
                : 'Figma design',
            summary: [
                'Figma design reference attached for planner context.',
                nodeId ? `Focus node: ${nodeId}.` : 'No specific node was provided.',
                'Use the design to derive UI surfaces, components, states, tokens, and visual acceptance criteria.',
            ].join(' '),
            components: [],
            tokens: [],
            interactions: [],
            screenshots: [],
        };
    } catch {
        return null;
    }
}

// ---------------------------------------------------------------------------
// Milestone card (plan review) — AI planner visual language
// ---------------------------------------------------------------------------
function MilestoneCard({
    milestone,
    index,
}: {
    milestone: PlannedMilestone;
    index: number;
}) {
    const [open, setOpen] = useState(index === 0);

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                    'overflow-hidden rounded-xl border border-[#edecea] bg-white',
                    PLAN_CARD_SHADOW,
                )}
            >
                <CollapsibleTrigger asChild>
                    <button
                        type="button"
                        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-[#f9fafb]"
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <span className="shrink-0 tabular-nums font-['Satoshi',sans-serif] text-[13px] font-medium text-[#0b191f]">
                                {index + 1}
                            </span>
                            <div className="min-w-0">
                                <h4 className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f]">
                                    {milestone.name}
                                </h4>
                                {milestone.description && (
                                    <p className="mt-0.5 line-clamp-1 font-['Satoshi',sans-serif] text-[12px] font-medium text-[#727d83]">
                                        {milestone.description}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <span className="rounded-full bg-[#edf0f3] px-2.5 py-1 font-['Satoshi',sans-serif] text-[10px] font-medium text-[#606d76]">
                                {milestone.tasks.length} tasks
                            </span>
                            {open ? (
                                <ChevronDown className="size-4 text-[#727d83]" />
                            ) : (
                                <ChevronRight className="size-4 text-[#727d83]" />
                            )}
                        </div>
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="space-y-2 border-t border-[#edecea] px-4 py-3">
                        {milestone.tasks.map((task, ti) => (
                            <div
                                key={ti}
                                className="flex items-start gap-3 rounded-lg bg-[#f9fafb] p-3 transition-colors hover:bg-[#f3f4f6]"
                            >
                                <span className="mt-0.5 shrink-0 tabular-nums font-['Satoshi',sans-serif] text-[13px] font-medium text-[#0b191f]">
                                    {ti + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-['Satoshi',sans-serif] text-[13px] font-medium text-[#0b191f]">
                                            {task.title}
                                        </span>
                                    </div>
                                    {task.description && (
                                        <p className="mt-1 line-clamp-2 font-['Inter',sans-serif] text-[12px] leading-[18px] text-[#727d83]">
                                            {task.description}
                                        </p>
                                    )}
                                    {task.labels.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {task.labels.map((l, li) => (
                                                <span
                                                    key={li}
                                                    className="rounded bg-[#edf0f3] px-1.5 py-0.5 font-['Satoshi',sans-serif] text-[10px] font-medium text-[#606d76]"
                                                >
                                                    {l}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CollapsibleContent>
            </motion.div>
        </Collapsible>
    );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export function AIProjectPlanner({ embedded = false }: AIProjectPlannerProps) {
    const navigate = useNavigate();

    // Chat state
    const [messages, setMessages] = useState<PlannerMessage[]>([]);
    const [input, setInput] = useState('');
    const [fileContents, setFileContents] = useState<FileContent[]>([]);
    const [figmaContext, setFigmaContext] = useState<FigmaContext | null>(null);
    const [confidence, setConfidence] = useState(0);
    /** Set when /generate-plan succeeds; shown on plan review stat cards (distinct from chat gauge). */
    const [planConfidence, setPlanConfidence] = useState<number | null>(null);
    const [missingAreas, setMissingAreas] = useState<string[]>([]);
    const [readyToPlan, setReadyToPlan] = useState(false);
    /** UI-only: matches Figma “Auto” affordance next to the composer submit control. */
    const [autoMode, setAutoMode] = useState(true);
    const [figmaModalOpen, setFigmaModalOpen] = useState(false);
    const [figmaUrlInput, setFigmaUrlInput] = useState('');

    // Plan state
    const [phase, setPhase] = useState<Phase>('chat');
    const [plan, setPlan] = useState<ProjectPlan | null>(null);

    // Refs
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatAbortRef = useRef<AbortController | null>(null);
    const composerTextareaRef = useAutosizeTextarea(input, {
        minPx: 40,
        maxPx: 200,
    });

    // Mutations
    const chatMutation = usePlannerChat();
    const uploadMutation = useUploadPlannerFile();
    const generateMutation = useGeneratePlan();
    const approveMutation = useApprovePlan();

    const scrollToBottom = useCallback(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [
        messages,
        scrollToBottom,
        confidence,
        missingAreas,
        readyToPlan,
        chatMutation.isPending,
    ]);

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------
    const handleStopChat = useCallback(() => {
        chatAbortRef.current?.abort();
    }, []);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || chatMutation.isPending) return;

        const controller = new AbortController();
        chatAbortRef.current = controller;

        const userMsg: PlannerMessage = { role: 'user', content: text };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');

        try {
            const res = await chatMutation.mutateAsync({
                messages: updatedMessages,
                file_contents: fileContents,
                figma_context: figmaContext,
                signal: controller.signal,
            });

            const assistantMsg: PlannerMessage = {
                role: 'assistant',
                content: res.reply,
            };
            setMessages((prev) => [...prev, assistantMsg]);
            setConfidence(res.confidence);
            setMissingAreas(res.missing_areas);
            setReadyToPlan(res.ready_to_plan);
        } catch (err: unknown) {
            const e = err as { code?: string; name?: string };
            const aborted =
                e?.code === 'ERR_CANCELED' ||
                e?.name === 'CanceledError' ||
                e?.name === 'AbortError';
            if (aborted) {
                setMessages((prev) => prev.slice(0, -1));
                setInput(text);
            }
        } finally {
            if (chatAbortRef.current === controller) {
                chatAbortRef.current = null;
            }
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const result = await uploadMutation.mutateAsync(file);
            setFileContents((prev) => [...prev, result]);
            toast.success(`Uploaded ${result.filename}`);
        } catch {
            // Error toast handled by hook
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveFile = (index: number) => {
        setFileContents((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAttachFigma = () => {
        setFigmaUrlInput(figmaContext?.url ?? '');
        setFigmaModalOpen(true);
    };

    const handleAttachFigmaFromModal = () => {
        const next = buildFigmaContextFromUrl(figmaUrlInput);
        if (!next) {
            toast.error('Enter a valid Figma design URL.');
            return;
        }

        setFigmaContext(next);
        setFigmaModalOpen(false);
        toast.success('Figma design attached');
    };

    const handleGeneratePlan = async () => {
        if (generateMutation.isPending) return;

        try {
            const res = await generateMutation.mutateAsync({
                messages,
                file_contents: fileContents,
                figma_context: figmaContext,
            });
            setPlan(res.plan);
            setPlanConfidence(res.confidence);
            setPhase('plan_review');
        } catch {
            // Error toast handled by hook
        }
    };

    const handleApprovePlan = async () => {
        if (!plan || approveMutation.isPending) return;

        setPhase('creating');

        try {
            const res = await approveMutation.mutateAsync(plan);
            toast.success(
                `Project created with ${res.milestone_count} milestones and ${res.task_count} tasks`,
            );
            setPhase('complete');
            setTimeout(() => navigate(projectMainHref(String(res.project_id))), 1500);
        } catch {
            setPhase('plan_review');
        }
    };

    const handleBackToChat = () => {
        setPhase('chat');
        setPlan(null);
        setPlanConfidence(null);
    };

    // -----------------------------------------------------------------------
    // Render helpers
    // -----------------------------------------------------------------------
    const totalPlannedTasks = plan?.milestones.reduce((s, m) => s + m.tasks.length, 0) ?? 0;

    const backHref = embedded ? workspaceJoin(WORKSPACE_SPRINT_SEGMENT) : WORKSPACE_BASE;

    const displayMissingAreas =
        missingAreas.length > 0 ? missingAreas : [...DEFAULT_MISSING_HINTS];

    /** Hide when ready unless the API still lists unhandled gaps. */
    const showMissingContextSection =
        !readyToPlan || missingAreas.length > 0;

    const missingContextRows =
        readyToPlan && missingAreas.length > 0
            ? missingAreas
            : displayMissingAreas;

    /** After at least one exchange, highlight gaps in red (matches “More details needed”). */
    const emphasizeMissingContextRows =
        messages.length > 0 &&
        (!readyToPlan || missingAreas.length > 0);

    return (
        <div
            className={
                embedded ? 'flex h-full min-h-0 flex-col' : 'flex h-[calc(100vh-4rem)] flex-col'
            }
        >
            {/* Header — chat phase uses the in-canvas header (Figma 77:13461); other phases keep this bar */}
            {phase !== 'chat' && (
                <div className="flex shrink-0 items-center justify-between border-b border-[#ebedee] bg-white px-6 py-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate(backHref)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="font-['Satoshi',sans-serif] text-lg font-semibold text-[#0b191f]">
                                AI Project Planner
                            </h1>
                            <p className="font-['Satoshi',sans-serif] text-xs font-medium text-[#727d83]">
                                {phase === 'plan_review' && 'Review the generated plan'}
                                {phase === 'creating' && 'Creating your project...'}
                                {phase === 'complete' && 'Project created successfully!'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Body */}
            <div className="flex min-h-0 flex-1 overflow-hidden">
                {/* ---- CHAT PHASE ---- */}
                <AnimatePresence mode="wait">
                    {phase === 'chat' && (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex min-h-0 flex-1 overflow-hidden"
                        >
                            {/* Main column — Figma 77:13458–77:13509 */}
                            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                                {/* Header — Figma 77:13461 */}
                                <div className="relative flex shrink-0 items-center justify-between rounded-t-2xl px-9 py-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate(backHref)}
                                        className="inline-flex size-5 shrink-0 items-center justify-center rounded-md text-[#0b191f] transition-colors hover:bg-black/[0.04]"
                                        aria-label="Back"
                                    >
                                        <ArrowLeft className="size-5" strokeWidth={2} />
                                    </button>
                                    <p className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-['Satoshi',sans-serif] text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
                                        AI Project Planner
                                    </p>
                                    <div className="size-5 shrink-0" aria-hidden />
                                </div>

                                <div
                                    className="flex min-h-0 flex-1 flex-col overflow-hidden"
                                    style={{
                                        backgroundImage:
                                            'linear-gradient(180deg, #ffffff 0%, #f9f9f9 100%)',
                                    }}
                                >
                                    <div className="mx-auto flex h-full min-h-0 w-full max-w-[600px] min-w-[min(100%,403px)] flex-col">
                                        {generateMutation.isPending ? (
                                            <div className="flex min-h-[min(70vh,520px)] flex-1 flex-col items-center justify-center gap-5 px-9 py-16">
                                                <p
                                                    className="animate-pulse-soft bg-clip-text font-sarina text-[42px] font-normal leading-none tracking-[-0.85px] text-transparent"
                                                    style={{
                                                        backgroundImage:
                                                            'linear-gradient(135.275deg, rgb(36, 181, 248) 4.6217%, rgb(85, 33, 254) 148.53%)',
                                                    }}
                                                >
                                                    Continuum
                                                </p>
                                                <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#595959]">
                                                    Generating your plan...
                                                </p>
                                                <p className="max-w-sm text-center font-['Satoshi',sans-serif] text-[13px] font-medium leading-normal text-[#727d83]">
                                                    This can take a few minutes. Hang tight.
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                        <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-9 py-6">
                                            <div className="mx-auto flex min-h-full max-w-[600px] flex-col gap-4">
                                                {messages.length === 0 && (
                                                    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                                                        <div className="flex size-12 shrink-0 items-center justify-center">
                                                            <img
                                                                src={aiPlannerBotIconSrc}
                                                                alt=""
                                                                className="size-12 max-h-full max-w-full object-contain"
                                                                aria-hidden
                                                            />
                                                        </div>
                                                        <div className="flex max-w-md flex-col gap-1 text-center leading-normal">
                                                            <p className="font-['Satoshi',sans-serif] text-[20px] font-bold leading-normal text-[#727D83]">
                                                                Start by describing your project
                                                            </p>
                                                            <p className="font-['Satoshi',sans-serif] text-[14px] font-medium leading-normal text-[#727D83]">
                                                                Tell me about the software project you
                                                                want to plan. You can also upload a
                                                                project spec or requirements document.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Chat turns — Figma 77:13823: user = pill #edf0f3 / assistant = Inter 13px plain left */}
                                                {messages.map((msg, i) => (
                                                    <motion.div
                                                        key={`${msg.role}-${i}`}
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className={
                                                            msg.role === 'user'
                                                                ? 'flex w-full justify-end'
                                                                : 'flex w-full justify-start'
                                                        }
                                                    >
                                                        {msg.role === 'user' ? (
                                                            <div className="max-w-[85%] rounded-[32px] bg-[#edf0f3] px-4 py-2 text-left font-['Satoshi',sans-serif] text-[13px] font-medium leading-normal text-[#0b191f] whitespace-pre-wrap">
                                                                {msg.content}
                                                            </div>
                                                        ) : (
                                                            <div className="w-full min-w-0">
                                                                <PlannerAssistantMarkdown
                                                                    content={msg.content}
                                                                />
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                ))}

                                                {chatMutation.isPending && (
                                                    <div className="flex w-full justify-start">
                                                        <div className="flex items-center gap-2 font-['Inter',sans-serif] text-[13px] leading-[19px] text-[#727d83]">
                                                            <Loader2
                                                                className="size-4 shrink-0 animate-spin"
                                                                aria-hidden
                                                            />
                                                            <span>Thinking...</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div ref={chatEndRef} />
                                            </div>
                                        </div>

                                        {/* Composer — Figma input area (target node 77:13681; structure from 77:13509 — MCP could not resolve 77:13681) */}
                                        <div className="shrink-0 bg-gradient-to-b from-transparent to-white px-4 pb-4">
                                            <div className="mx-auto w-full max-w-[600px]">
                                                {(fileContents.length > 0 || figmaContext) && (
                                                    <div className="mb-2 flex flex-wrap gap-2">
                                                        {fileContents.map((fc, i) => (
                                                            <span
                                                                key={i}
                                                                className="inline-flex max-w-full items-stretch overflow-hidden rounded-[8px] border border-solid border-[#ededed] bg-white shadow-sm"
                                                            >
                                                                <span
                                                                    className="flex w-9 shrink-0 items-center justify-center self-stretch bg-[#edf0f3]"
                                                                    aria-hidden
                                                                >
                                                                    <FileText
                                                                        className="size-4 shrink-0 text-[#606d76]"
                                                                        strokeWidth={1.75}
                                                                    />
                                                                </span>
                                                                <span className="min-w-0 max-w-[220px] truncate border-l border-solid border-[#ededed] px-2.5 py-1.5 font-['Satoshi',sans-serif] text-[13px] font-medium leading-normal text-[#0b191f] sm:max-w-[320px]">
                                                                    {fc.filename}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleRemoveFile(i)
                                                                    }
                                                                    className="inline-flex shrink-0 items-center justify-center self-center pr-1.5 text-[#606d76] hover:text-[#0b191f]"
                                                                    aria-label={`Remove ${fc.filename}`}
                                                                >
                                                                    <X className="size-3.5" strokeWidth={2} />
                                                                </button>
                                                            </span>
                                                        ))}
                                                        {figmaContext && (
                                                            <span className="inline-flex max-w-full items-stretch overflow-hidden rounded-[8px] border border-solid border-[#ededed] bg-white shadow-sm">
                                                                <span
                                                                    className="flex w-9 shrink-0 items-center justify-center self-stretch bg-[#e7f2fc]"
                                                                    aria-hidden
                                                                >
                                                                    <Link2
                                                                        className="size-4 shrink-0 text-[#2f6df6]"
                                                                        strokeWidth={1.75}
                                                                    />
                                                                </span>
                                                                <span className="min-w-0 max-w-[220px] truncate border-l border-solid border-[#ededed] px-2.5 py-1.5 font-['Satoshi',sans-serif] text-[13px] font-medium leading-normal text-[#0b191f] sm:max-w-[320px]">
                                                                    {figmaContext.source_name || 'Figma design attached'}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setFigmaContext(null)}
                                                                    className="inline-flex shrink-0 items-center justify-center self-center pr-1.5 text-[#606d76] hover:text-[#0b191f]"
                                                                    aria-label="Remove Figma design"
                                                                >
                                                                    <X className="size-3.5" strokeWidth={2} />
                                                                </button>
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    className="hidden"
                                                    accept=".txt,.md,.pdf,.docx"
                                                    onChange={handleFileUpload}
                                                />

                                                <div
                                                    className={cn(
                                                        'overflow-hidden rounded-[14px] border border-solid border-[#edecea] bg-white shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]',
                                                    )}
                                                >
                                                    <div className="relative flex min-h-[88px] shrink-0 flex-col gap-1 bg-white pb-[7px] pt-[11px]">
                                                        <div className="relative flex w-full min-h-0 items-start justify-center px-[13px]">
                                                            <label
                                                                className="sr-only"
                                                                htmlFor="ai-planner-chat-input"
                                                            >
                                                                Message
                                                            </label>
                                                            <textarea
                                                                ref={
                                                                    composerTextareaRef
                                                                }
                                                                id="ai-planner-chat-input"
                                                                placeholder="Do anything with AI..."
                                                                value={input}
                                                                onChange={(e) =>
                                                                    setInput(
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                onKeyDown={(e) => {
                                                                    if (
                                                                        e.key !==
                                                                            'Enter' ||
                                                                        e.shiftKey
                                                                    ) {
                                                                        return;
                                                                    }
                                                                    if (
                                                                        !input.trim() ||
                                                                        chatMutation.isPending
                                                                    ) {
                                                                        return;
                                                                    }
                                                                    e.preventDefault();
                                                                    handleSend();
                                                                }}
                                                                rows={1}
                                                                className="max-h-[200px] min-h-[40px] w-full resize-none overflow-y-auto border-0 bg-transparent font-['Satoshi',sans-serif] text-[13px] font-medium not-italic leading-[1.35] tracking-[-0.13px] text-[#0b191f] opacity-50 placeholder:text-[#727d83] placeholder:opacity-50 focus:opacity-100 focus:outline-none focus:ring-0"
                                                            />
                                                        </div>
                                                        <div className="flex shrink-0 items-center justify-between px-[11px]">
                                                            <div className="flex items-center gap-[7px]">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        fileInputRef.current?.click()
                                                                    }
                                                                    disabled={
                                                                        uploadMutation.isPending
                                                                    }
                                                                    className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center p-0 disabled:opacity-50"
                                                                    aria-label="Upload file"
                                                                >
                                                                    {uploadMutation.isPending ? (
                                                                        <Loader2 className="h-[18px] w-[18px] animate-spin text-[#727d83]" />
                                                                    ) : (
                                                                        <img
                                                                            src={
                                                                                aiPlannerComposerPlusSrc
                                                                            }
                                                                            alt=""
                                                                            width={18}
                                                                            height={18}
                                                                            className="h-[18px] w-[18px] object-contain"
                                                                            aria-hidden
                                                                        />
                                                                    )}
                                                                </button>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <button
                                                                            type="button"
                                                                            onClick={handleAttachFigma}
                                                                            className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm p-0 text-[#606d76] transition-colors hover:bg-[#edf0f3] hover:text-[#0b191f]"
                                                                            aria-label="Attach Figma design"
                                                                        >
                                                                            <img
                                                                                src={
                                                                                    aiPlannerComposerSettingsSrc
                                                                                }
                                                                                alt=""
                                                                                width={18}
                                                                                height={18}
                                                                                className="h-[18px] w-[18px] object-contain"
                                                                                aria-hidden
                                                                            />
                                                                        </button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top">
                                                                        Attach Figma design
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                            <div className="flex items-center gap-[10px]">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setAutoMode((v) => !v)
                                                                    }
                                                                    className={cn(
                                                                        "font-['Satoshi',sans-serif] text-[13px] font-medium tracking-[-0.13px] text-[#727d83] transition-opacity",
                                                                        autoMode && 'opacity-100',
                                                                        !autoMode &&
                                                                            'line-through opacity-40',
                                                                    )}
                                                                >
                                                                    Auto
                                                                </button>
                                                                {chatMutation.isPending ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleStopChat}
                                                                        className="flex size-[26px] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[999px] bg-[#e7f2fc]"
                                                                        aria-label="Stop generating"
                                                                    >
                                                                        <span className="relative inline-flex size-3 shrink-0 items-center justify-center">
                                                                            <img
                                                                                src={
                                                                                    aiPlannerComposerSendSquareSrc
                                                                                }
                                                                                alt=""
                                                                                width={12}
                                                                                height={12}
                                                                                className="h-3 w-3 object-contain"
                                                                                aria-hidden
                                                                            />
                                                                        </span>
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleSend}
                                                                        disabled={!input.trim()}
                                                                        aria-label="Send message"
                                                                        className={cn(
                                                                            'relative flex size-[26px] shrink-0 items-center justify-center rounded-[999px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#2E96F9] focus-visible:ring-offset-2 disabled:pointer-events-none',
                                                                            input.trim()
                                                                                ? 'cursor-pointer bg-[#2E96F9] text-white'
                                                                                : 'cursor-default bg-[#f9f9f8] text-[#727d83] opacity-40',
                                                                        )}
                                                                    >
                                                                        <ArrowUp
                                                                            className="size-[18px] shrink-0"
                                                                            strokeWidth={2}
                                                                            aria-hidden
                                                                        />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Confidence & context — Figma 77:13510, 77:13667 */}
                            <aside className="relative hidden h-full min-h-0 w-[362px] shrink-0 flex-col border-l border-[#ebedee] bg-gradient-to-b from-white to-[#f9f9f9] lg:flex">
                                <div className="scrollbar-none min-h-0 flex-1 space-y-6 overflow-y-auto pl-9 pr-[52px] pt-4 pb-28">
                                    <p className="text-center font-['Satoshi',sans-serif] text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
                                        Confidence Index
                                    </p>

                                    <div className="flex items-center gap-6">
                                        <PlannerConfidenceGauge value={confidence} />
                                        <p
                                            className={cn(
                                                "font-['Satoshi',sans-serif] text-[16px] font-medium leading-normal",
                                                readyToPlan
                                                    ? 'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-emerald-600'
                                                    : 'max-w-[147px] text-[#eb4335]',
                                            )}
                                        >
                                            {readyToPlan ? (
                                                <>
                                                    <Check className="size-4 shrink-0" />
                                                    Ready to generate plan
                                                </>
                                            ) : (
                                                'More details needed'
                                            )}
                                        </p>
                                    </div>

                                    {showMissingContextSection ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                                                Missing context
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {missingContextRows.map((area, i) => (
                                                <div
                                                    key={`${area}-${i}`}
                                                    className="flex items-start gap-0"
                                                >
                                                    <Info
                                                        className={cn(
                                                            'mt-0.5 size-4 shrink-0',
                                                            emphasizeMissingContextRows
                                                                ? 'text-[#eb4335]'
                                                                : 'text-[#0b191f]',
                                                        )}
                                                    />
                                                    <p
                                                        className={cn(
                                                            'flex-1 px-4 py-1 font-sans text-[13px] leading-[19px]',
                                                            emphasizeMissingContextRows
                                                                ? 'text-[#eb4335]'
                                                                : 'text-[#0b191f]',
                                                        )}
                                                    >
                                                        {area}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    ) : null}

                                    {fileContents.length > 0 && (
                                        <div>
                                            <p className="mb-2 font-['Satoshi',sans-serif] text-[12px] font-medium text-[#727d83]">
                                                Uploaded files
                                            </p>
                                            <div className="space-y-2">
                                                {fileContents.map((fc, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex min-w-0 items-stretch overflow-hidden rounded-[8px] border border-solid border-[#ededed] bg-white"
                                                    >
                                                        <div className="flex w-[50px] shrink-0 items-center justify-center self-stretch bg-[#edf0f3]">
                                                            <FileText
                                                                className="size-4 shrink-0 text-[#606d76]"
                                                                strokeWidth={1.75}
                                                                aria-hidden
                                                            />
                                                        </div>
                                                        <div className="flex min-h-[44px] min-w-0 flex-1 items-center border-l border-solid border-[#ededed] px-3 py-1.5">
                                                            <p className="min-w-0 break-words font-['Satoshi',sans-serif] text-[14px] font-medium leading-normal text-[#0b191f]">
                                                                {fc.filename}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 border-t border-[#ebedee] bg-white px-9 py-4">
                                    <button
                                        type="button"
                                        onClick={handleGeneratePlan}
                                        disabled={!readyToPlan || generateMutation.isPending}
                                        className={cn(
                                            'flex h-10 w-full items-center justify-center rounded-lg font-semibold transition-colors',
                                            !readyToPlan || generateMutation.isPending
                                                ? 'bg-[rgba(96,109,118,0.1)] text-[14px] text-[#606d76] opacity-50'
                                                : 'bg-gradient-to-br from-[#24b5f8] to-[#5521fe] text-[14px] text-white shadow-sm hover:opacity-95',
                                        )}
                                    >
                                        {generateMutation.isPending
                                            ? 'Generating plan…'
                                            : 'Generate plan'}
                                    </button>
                                    {!readyToPlan && confidence > 0 && (
                                        <p className="mt-2 text-center text-[10px] text-muted-foreground">
                                            Provide more context to unlock plan generation
                                        </p>
                                    )}
                                </div>
                            </aside>
                        </motion.div>
                    )}

                    {/* ---- PLAN REVIEW PHASE ---- */}
                    {phase === 'plan_review' && plan && (
                        <motion.div
                            key="plan"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="scrollbar-none min-h-0 flex-1 overflow-auto"
                            style={{
                                backgroundImage:
                                    'linear-gradient(180deg, #ffffff 0%, #f9f9f9 100%)',
                            }}
                        >
                            <div className="mx-auto max-w-3xl space-y-8 px-9 py-10">
                                <div>
                                    <span className="mb-3 inline-flex rounded-full bg-[#edf0f3] px-3 py-1 font-['Satoshi',sans-serif] text-[12px] font-medium text-[#606d76]">
                                        Generated Plan
                                    </span>
                                    <h2 className="mb-2 font-['Satoshi',sans-serif] text-[24px] font-bold leading-tight tracking-tight text-[#0b191f]">
                                        {plan.project_name}
                                    </h2>
                                    <p className="font-['Satoshi',sans-serif] text-[14px] font-medium leading-relaxed text-[#727d83]">
                                        {plan.project_description}
                                    </p>
                                </div>

                                {plan.summary && (
                                    <div
                                        className={cn(
                                            'rounded-2xl border border-[#edecea] bg-white p-5',
                                            PLAN_CARD_SHADOW,
                                        )}
                                    >
                                        <h3 className="mb-2 font-['Satoshi',sans-serif] text-[14px] font-semibold text-[#0b191f]">
                                            Plan Summary
                                        </h3>
                                        <p className="whitespace-pre-wrap font-['Inter',sans-serif] text-[13px] leading-[21px] text-[#606d76]">
                                            {plan.summary}
                                        </p>
                                    </div>
                                )}

                                {figmaContext && (
                                    <div
                                        className={cn(
                                            'rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-5',
                                            PLAN_CARD_SHADOW,
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e7f2fc]">
                                                <Link2 className="size-4 text-[#2f6df6]" />
                                            </span>
                                            <div className="min-w-0">
                                                <h3 className="font-['Satoshi',sans-serif] text-[14px] font-semibold text-[#0b191f]">
                                                    Figma Design Context
                                                </h3>
                                                <p className="mt-1 font-['Inter',sans-serif] text-[13px] leading-[20px] text-[#606d76]">
                                                    This plan used {figmaContext.source_name || 'the attached Figma design'}
                                                    {figmaContext.node_id ? ` (${figmaContext.node_id})` : ''} as design evidence.
                                                    Review frontend and design-system tasks against the linked frame.
                                                </p>
                                                {figmaContext.url && (
                                                    <a
                                                        href={figmaContext.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="mt-2 inline-flex max-w-full truncate font-['Satoshi',sans-serif] text-[12px] font-medium text-[#2f6df6] hover:underline"
                                                    >
                                                        Open Figma reference
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-3 gap-4">
                                    {(
                                        [
                                            [String(plan.milestones.length), 'Milestones'],
                                            [String(totalPlannedTasks), 'Tasks'],
                                            [
                                                planConfidence != null
                                                    ? `${Math.round(planConfidence)}%`
                                                    : '—',
                                                'Confidence',
                                            ],
                                        ] as const
                                    ).map(([value, label]) => (
                                        <div
                                            key={label}
                                            className={cn(
                                                'rounded-xl border border-[#edecea] bg-white p-5 text-center',
                                                PLAN_CARD_SHADOW,
                                            )}
                                        >
                                            <div className="font-['Satoshi',sans-serif] text-[28px] font-bold leading-none text-[#0b191f]">
                                                {value}
                                            </div>
                                            <div className="mt-2 font-['Satoshi',sans-serif] text-[12px] font-medium text-[#606d76]">
                                                {label}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <h3 className="mb-3 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                                        Milestones
                                    </h3>
                                    <div className="space-y-3">
                                        {plan.milestones.map((ms, i) => (
                                            <MilestoneCard
                                                key={i}
                                                milestone={ms}
                                                index={i}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-[#ebedee] pt-8">
                                    <button
                                        type="button"
                                        onClick={handleBackToChat}
                                        className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#edecea] bg-white px-4 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] shadow-sm transition-colors hover:bg-[#f9fafb]"
                                    >
                                        <ArrowLeft className="size-4 shrink-0" />
                                        Back to Chat
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleApprovePlan}
                                        disabled={approveMutation.isPending}
                                        className={cn(
                                            "inline-flex h-11 items-center gap-2 rounded-lg px-5 font-['Satoshi',sans-serif] text-[14px] font-semibold text-white shadow-sm transition-opacity disabled:opacity-60",
                                            'bg-gradient-to-br from-[#24b5f8] to-[#5521fe] hover:opacity-95',
                                        )}
                                    >
                                        {approveMutation.isPending ? (
                                            <Loader2 className="size-4 shrink-0 animate-spin" />
                                        ) : (
                                            <Check className="size-4 shrink-0" />
                                        )}
                                        Approve & Create Project
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ---- CREATING / COMPLETE PHASE ---- */}
                    {(phase === 'creating' || phase === 'complete') && (
                        <motion.div
                            key="creating"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-1 items-center justify-center"
                            style={{
                                backgroundImage:
                                    'linear-gradient(180deg, #ffffff 0%, #f9f9f9 100%)',
                            }}
                        >
                            <div className="space-y-4 px-6 text-center">
                                {phase === 'creating' ? (
                                    <>
                                        <Loader2 className="mx-auto size-12 animate-spin text-[#2E96F9]" />
                                        <h3 className="font-['Satoshi',sans-serif] text-[18px] font-semibold text-[#0b191f]">
                                            Creating your project...
                                        </h3>
                                        <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#727d83]">
                                            Setting up milestones and tasks
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 200,
                                                damping: 15,
                                            }}
                                        >
                                            <Check className="mx-auto size-16 text-emerald-500" />
                                        </motion.div>
                                        <h3 className="font-['Satoshi',sans-serif] text-[18px] font-semibold text-[#0b191f]">
                                            Project created!
                                        </h3>
                                        <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#727d83]">
                                            Redirecting to your project board...
                                        </p>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <Dialog open={figmaModalOpen} onOpenChange={setFigmaModalOpen}>
                <DialogPortal>
                    <DialogOverlay className="bg-black/25" />
                    <DialogPrimitive.Content
                        aria-describedby={undefined}
                        className={cn(
                            'fixed left-1/2 top-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[600px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
                        )}
                    >
                        <DialogPrimitive.Title className="sr-only">
                            Attach Figma design
                        </DialogPrimitive.Title>
                        <div className="grid w-full grid-cols-[20px_1fr_20px] items-center border-b border-[#f5f5f5] bg-[#f9f9f9] px-9 py-4">
                            <DialogClose asChild>
                                <button
                                    type="button"
                                    className="inline-flex size-5 items-center justify-center text-[#606d76]"
                                    aria-label="Close"
                                >
                                    <ArrowLeft className="size-5" />
                                </button>
                            </DialogClose>
                            <p className="text-center font-['Satoshi',sans-serif] text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
                                Attach Figma Design
                            </p>
                            <div className="size-5" />
                        </div>
                        <div
                            className="flex w-full flex-col gap-5 px-9 py-6"
                            style={{
                                backgroundImage:
                                    'linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(90deg, rgb(249, 249, 249) 0%, rgb(249, 249, 249) 100%)',
                            }}
                        >
                            <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76]">
                                Paste a Figma design or frame URL
                            </p>
                            <input
                                type="url"
                                autoFocus
                                value={figmaUrlInput}
                                onChange={(e) => setFigmaUrlInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key !== 'Enter') return;
                                    e.preventDefault();
                                    handleAttachFigmaFromModal();
                                }}
                                placeholder="https://www.figma.com/design/..."
                                className="h-10 w-full rounded-[8px] border border-[#e9e9e9] bg-white px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none placeholder:text-[#606d76]/40 focus-visible:border-[#1466ff]"
                            />
                            <div className="flex w-full justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFigmaModalOpen(false)}
                                    className="h-10 rounded-[8px] border border-[#ebedee] px-4 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAttachFigmaFromModal}
                                    disabled={!figmaUrlInput.trim()}
                                    className={cn(
                                        "h-10 rounded-[8px] px-4 font-['Satoshi',sans-serif] text-[14px] font-semibold text-white transition-colors",
                                        figmaUrlInput.trim()
                                            ? 'bg-[#1466ff] hover:bg-[#0051e6]'
                                            : 'bg-[rgba(96,109,118,0.1)] text-[#606d76]/50',
                                    )}
                                >
                                    Attach
                                </button>
                            </div>
                        </div>
                    </DialogPrimitive.Content>
                </DialogPortal>
            </Dialog>
        </div>
    );
}
