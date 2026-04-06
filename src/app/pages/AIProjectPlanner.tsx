import { useCallback, useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '../components/ui/collapsible';
import {
    usePlannerChat,
    useUploadPlannerFile,
    useGeneratePlan,
    useApprovePlan,
} from '@/api/planner';
import type {
    PlannerMessage,
    FileContent,
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

// ---------------------------------------------------------------------------
// Milestone card (plan review)
// ---------------------------------------------------------------------------
function MilestoneCard({
    milestone,
    index,
}: {
    milestone: PlannedMilestone;
    index: number;
}) {
    const [open, setOpen] = useState(index === 0);

    const scopeColor: Record<string, string> = {
        XS: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
        S: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
        M: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
        L: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
        XL: 'bg-red-500/15 text-red-700 dark:text-red-400',
    };

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-border rounded-lg bg-card overflow-hidden"
            >
                <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                {index + 1}
                            </span>
                            <div>
                                <h4 className="font-semibold text-sm">{milestone.name}</h4>
                                {milestone.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                        {milestone.description}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">
                                {milestone.tasks.length} tasks
                            </Badge>
                            {open ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                        </div>
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="border-t border-border px-4 py-3 space-y-2">
                        {milestone.tasks.map((task, ti) => (
                            <div
                                key={ti}
                                className="flex items-start gap-3 p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                                <div className="mt-0.5 h-4 w-4 rounded border border-border flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-medium">{task.title}</span>
                                        <span
                                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${scopeColor[task.scope_weight] ?? 'bg-muted text-muted-foreground'}`}
                                        >
                                            {task.scope_weight}
                                        </span>
                                    </div>
                                    {task.description && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {task.description}
                                        </p>
                                    )}
                                    {task.labels.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            {task.labels.map((l, li) => (
                                                <span
                                                    key={li}
                                                    className="text-[10px] px-1.5 py-0.5 rounded-sm bg-secondary text-secondary-foreground"
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
    const [confidence, setConfidence] = useState(0);
    const [missingAreas, setMissingAreas] = useState<string[]>([]);
    const [readyToPlan, setReadyToPlan] = useState(false);
    /** UI-only: matches Figma “Auto” affordance next to the composer submit control. */
    const [autoMode, setAutoMode] = useState(true);

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

    const handleGeneratePlan = async () => {
        if (generateMutation.isPending) return;

        try {
            const res = await generateMutation.mutateAsync({
                messages,
                file_contents: fileContents,
            });
            setPlan(res.plan);
            setConfidence(res.confidence);
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
            setTimeout(
                () =>
                    navigate(
                        embedded
                            ? `/dashboard-placeholder/project/${res.project_id}`
                            : `/projects/${res.project_id}`,
                    ),
                1500,
            );
        } catch {
            setPhase('plan_review');
        }
    };

    const handleBackToChat = () => {
        setPhase('chat');
        setPlan(null);
    };

    // -----------------------------------------------------------------------
    // Render helpers
    // -----------------------------------------------------------------------
    const totalPlannedTasks = plan?.milestones.reduce((s, m) => s + m.tasks.length, 0) ?? 0;

    const backHref = embedded ? '/dashboard-placeholder/get-started' : '/projects';

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
                <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate(backHref)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-semibold">AI Project Planner</h1>
                            <p className="text-xs text-muted-foreground">
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
                                        <div className="min-h-0 flex-1 overflow-y-auto px-9 py-6">
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
                                                            <p className="w-full min-w-0 whitespace-pre-wrap font-['Inter',sans-serif] text-[13px] font-normal leading-[19px] text-[#0b191f]">
                                                                {msg.content}
                                                            </p>
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
                                                {fileContents.length > 0 && (
                                                    <div className="mb-2 flex flex-wrap gap-2">
                                                        {fileContents.map((fc, i) => (
                                                            <span
                                                                key={i}
                                                                className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                                                            >
                                                                <FileText className="h-3 w-3" />
                                                                {fc.filename}
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleRemoveFile(i)
                                                                    }
                                                                    className="rounded p-0.5 hover:bg-muted-foreground/20"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </span>
                                                        ))}
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
                                                                <button
                                                                    type="button"
                                                                    className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center p-0 opacity-50"
                                                                    aria-label="Composer options"
                                                                    title="Coming soon"
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
                                    </div>
                                </div>
                            </div>

                            {/* Confidence & context — Figma 77:13510, 77:13667 */}
                            <aside className="relative hidden h-full min-h-0 w-[362px] shrink-0 flex-col border-l border-[#ebedee] bg-gradient-to-b from-white to-[#f9f9f9] lg:flex">
                                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pl-9 pr-[52px] pt-4 pb-28">
                                    <p className="text-center font-['Satoshi',sans-serif] text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
                                        Confidence Index
                                    </p>

                                    <div className="flex items-center gap-6">
                                        <PlannerConfidenceGauge value={confidence} />
                                        <p
                                            className={cn(
                                                "font-['Satoshi',sans-serif] text-[16px] font-medium leading-normal",
                                                confidence >= 70 && readyToPlan
                                                    ? 'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-emerald-600'
                                                    : 'max-w-[147px] text-[#eb4335]',
                                            )}
                                        >
                                            {confidence >= 70 && readyToPlan ? (
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
                                            <p className="mb-2 font-['Satoshi',sans-serif] text-[12px] font-medium text-muted-foreground">
                                                Uploaded files
                                            </p>
                                            <div className="space-y-1">
                                                {fileContents.map((fc, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center gap-2 text-xs"
                                                    >
                                                        <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                                                        <span className="truncate">{fc.filename}</span>
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
                                        {generateMutation.isPending ? (
                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                        ) : null}
                                        Generate plan
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
                            className="flex-1 overflow-auto"
                        >
                            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                                {/* Plan header */}
                                <div>
                                    <Badge variant="secondary" className="mb-3 text-xs">
                                        Generated Plan
                                    </Badge>
                                    <h2 className="text-2xl font-bold mb-2">
                                        {plan.project_name}
                                    </h2>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        {plan.project_description}
                                    </p>
                                </div>

                                {/* Summary */}
                                {plan.summary && (
                                    <div className="bg-muted/40 border border-border rounded-lg p-5">
                                        <h3 className="text-sm font-semibold mb-2">Plan Summary</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                            {plan.summary}
                                        </p>
                                    </div>
                                )}

                                {/* Stats row */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-card border border-border rounded-lg p-4 text-center">
                                        <div className="text-2xl font-bold">
                                            {plan.milestones.length}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Milestones
                                        </div>
                                    </div>
                                    <div className="bg-card border border-border rounded-lg p-4 text-center">
                                        <div className="text-2xl font-bold">
                                            {totalPlannedTasks}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Tasks</div>
                                    </div>
                                    <div className="bg-card border border-border rounded-lg p-4 text-center">
                                        <div className="text-2xl font-bold">
                                            {Math.round(confidence)}%
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Confidence
                                        </div>
                                    </div>
                                </div>

                                {/* Milestones */}
                                <div>
                                    <h3 className="text-sm font-semibold mb-3">Milestones</h3>
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

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-6 border-t border-border">
                                    <Button variant="outline" onClick={handleBackToChat}>
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Chat
                                    </Button>
                                    <Button
                                        onClick={handleApprovePlan}
                                        disabled={approveMutation.isPending}
                                        className="gap-2"
                                    >
                                        {approveMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Check className="h-4 w-4" />
                                        )}
                                        Approve & Create Project
                                    </Button>
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
                            className="flex-1 flex items-center justify-center"
                        >
                            <div className="text-center space-y-4">
                                {phase === 'creating' ? (
                                    <>
                                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                                        <h3 className="text-lg font-semibold">
                                            Creating your project...
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
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
                                            <Check className="h-16 w-16 text-emerald-500 mx-auto" />
                                        </motion.div>
                                        <h3 className="text-lg font-semibold">
                                            Project created!
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Redirecting to your project board...
                                        </p>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
