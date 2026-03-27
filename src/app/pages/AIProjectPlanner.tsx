import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Send,
    Upload,
    FileText,
    X,
    Loader2,
    ChevronDown,
    ChevronRight,
    Check,
    AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
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

type Phase = 'chat' | 'plan_review' | 'creating' | 'complete';

// ---------------------------------------------------------------------------
// Confidence ring SVG
// ---------------------------------------------------------------------------
function ConfidenceRing({ value }: { value: number }) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    const color =
        value >= 70
            ? 'stroke-emerald-500'
            : value >= 40
              ? 'stroke-amber-500'
              : 'stroke-red-500';

    return (
        <div className="relative flex items-center justify-center">
            <svg width="100" height="100" className="-rotate-90">
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    className="stroke-muted"
                    strokeWidth="6"
                />
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    className={`${color} transition-all duration-700 ease-out`}
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>
            <span className="absolute text-lg font-bold">{Math.round(value)}%</span>
        </div>
    );
}

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
export function AIProjectPlanner() {
    const navigate = useNavigate();

    // Chat state
    const [messages, setMessages] = useState<PlannerMessage[]>([]);
    const [input, setInput] = useState('');
    const [fileContents, setFileContents] = useState<FileContent[]>([]);
    const [confidence, setConfidence] = useState(0);
    const [missingAreas, setMissingAreas] = useState<string[]>([]);
    const [readyToPlan, setReadyToPlan] = useState(false);

    // Plan state
    const [phase, setPhase] = useState<Phase>('chat');
    const [plan, setPlan] = useState<ProjectPlan | null>(null);

    // Refs
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
    }, [messages, scrollToBottom]);

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------
    const handleSend = async () => {
        const text = input.trim();
        if (!text || chatMutation.isPending) return;

        const userMsg: PlannerMessage = { role: 'user', content: text };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');

        try {
            const res = await chatMutation.mutateAsync({
                messages: updatedMessages,
                file_contents: fileContents,
            });

            const assistantMsg: PlannerMessage = {
                role: 'assistant',
                content: res.reply,
            };
            setMessages((prev) => [...prev, assistantMsg]);
            setConfidence(res.confidence);
            setMissingAreas(res.missing_areas);
            setReadyToPlan(res.ready_to_plan);
        } catch {
            // Error toast handled by hook
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
            setTimeout(() => navigate(`/projects/${res.project_id}`), 1500);
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

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold">AI Project Planner</h1>
                        <p className="text-xs text-muted-foreground">
                            {phase === 'chat' && 'Describe your project and let AI build the plan'}
                            {phase === 'plan_review' && 'Review the generated plan'}
                            {phase === 'creating' && 'Creating your project...'}
                            {phase === 'complete' && 'Project created successfully!'}
                        </p>
                    </div>
                </div>

                {phase === 'chat' && (
                    <Button
                        onClick={handleGeneratePlan}
                        disabled={!readyToPlan || generateMutation.isPending}
                        className="gap-2"
                    >
                        {generateMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        Generate Plan
                    </Button>
                )}
            </div>

            {/* Body */}
            <div className="flex-1 flex overflow-hidden">
                {/* ---- CHAT PHASE ---- */}
                <AnimatePresence mode="wait">
                    {phase === 'chat' && (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex overflow-hidden"
                        >
                            {/* Chat panel */}
                            <div className="flex-1 flex flex-col min-w-0">
                                <div className="flex-1 overflow-y-auto px-6 py-4">
                                    <div className="max-w-2xl mx-auto space-y-4 min-h-full">
                                        {messages.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                                <h3 className="text-lg font-medium mb-2">
                                                    Start by describing your project
                                                </h3>
                                                <p className="text-sm text-muted-foreground max-w-md">
                                                    Tell me about the software project you want to
                                                    plan. You can also upload a project spec or
                                                    requirements document.
                                                </p>
                                            </div>
                                        )}

                                        {messages.map((msg, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                                                        msg.role === 'user'
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'bg-muted'
                                                    }`}
                                                >
                                                    {msg.content}
                                                </div>
                                            </motion.div>
                                        ))}

                                        {chatMutation.isPending && (
                                            <div className="flex justify-start">
                                                <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                    <span className="text-sm text-muted-foreground">
                                                        Thinking...
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <div ref={chatEndRef} />
                                    </div>
                                </div>

                                {/* Input area */}
                                <div className="border-t border-border p-4 shrink-0">
                                    <div className="max-w-2xl mx-auto">
                                        {/* Uploaded files */}
                                        {fileContents.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {fileContents.map((fc, i) => (
                                                    <span
                                                        key={i}
                                                        className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground rounded-md px-2.5 py-1 text-xs"
                                                    >
                                                        <FileText className="h-3 w-3" />
                                                        {fc.filename}
                                                        <button
                                                            onClick={() => handleRemoveFile(i)}
                                                            className="hover:bg-muted-foreground/20 rounded p-0.5"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                className="hidden"
                                                accept=".txt,.md,.pdf,.docx"
                                                onChange={handleFileUpload}
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="shrink-0"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploadMutation.isPending}
                                            >
                                                {uploadMutation.isPending ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Upload className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Textarea
                                                placeholder="Describe your project, paste requirements, or ask a question..."
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSend();
                                                    }
                                                }}
                                                className="min-h-[44px] max-h-[120px] resize-none"
                                                rows={1}
                                            />
                                            <Button
                                                size="icon"
                                                className="shrink-0"
                                                onClick={handleSend}
                                                disabled={!input.trim() || chatMutation.isPending}
                                            >
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Context sidebar */}
                            <div className="w-72 border-l border-border p-5 shrink-0 hidden lg:flex flex-col gap-5">
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Context Confidence
                                    </p>
                                    <ConfidenceRing value={confidence} />
                                    {confidence >= 70 ? (
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                            <Check className="h-3 w-3" /> Ready to generate plan
                                        </p>
                                    ) : confidence > 0 ? (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                            More detail needed
                                        </p>
                                    ) : null}
                                </div>

                                {missingAreas.length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-2">
                                            Missing context
                                        </p>
                                        <div className="space-y-1.5">
                                            {missingAreas.map((area, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-start gap-2 text-xs text-muted-foreground"
                                                >
                                                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
                                                    <span>{area}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {fileContents.length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-2">
                                            Uploaded files
                                        </p>
                                        <div className="space-y-1">
                                            {fileContents.map((fc, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-2 text-xs"
                                                >
                                                    <FileText className="h-3 w-3 text-muted-foreground" />
                                                    <span className="truncate">{fc.filename}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-auto">
                                    <Button
                                        className="w-full gap-2"
                                        onClick={handleGeneratePlan}
                                        disabled={!readyToPlan || generateMutation.isPending}
                                    >
                                        {generateMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : null}
                                        Generate Plan
                                    </Button>
                                    {!readyToPlan && confidence > 0 && (
                                        <p className="text-[10px] text-muted-foreground text-center mt-2">
                                            Provide more context to unlock plan generation
                                        </p>
                                    )}
                                </div>
                            </div>
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
