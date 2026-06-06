/**
 * Per-milestone preview shown on the Confirm import screen.
 *
 * Mirrors the look of the AI planner's MilestoneCard
 * (`AIProjectPlanner.tsx#MilestoneCard`) so users get the same expandable
 * structure when reviewing a migration import — milestone header with
 * task count, click to reveal task title + priority/labels chips.
 *
 * Only shown when at least one milestone exists in the IR (i.e. the LLM
 * auto-grouping ran or the source export carried sprints/sections natively).
 * Orphan tasks that would land in the catch-all milestone at apply time get
 * a synthetic group at the end so users see exactly where every task ends up.
 */

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Flag, Inbox } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/app/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/app/components/ui/collapsible";
import { cn } from "@/app/components/ui/utils";
import { taskPriorityFlagClass, taskPriorityLabel } from "@/types/task";
import type { TaskPriority } from "@/types/task";
import type {
    CanonicalProjectIR,
    IRMilestone,
    IRTask,
    IRWarning,
} from "@/types/migration";

interface MigrationMilestonePreviewProps {
    ir: CanonicalProjectIR;
    warnings: IRWarning[];
}

interface MilestoneGroup {
    key: string;
    name: string;
    description: string | null;
    tasks: IRTask[];
    /** True for the synthetic catch-all bucket; gets a distinct icon + copy. */
    catchall: boolean;
    /** True for milestones the LLM grouper added (slug prefix `llm-`). */
    aiSuggested: boolean;
}

const TASK_PREVIEW_LIMIT = 50;

function buildGroups(ir: CanonicalProjectIR): MilestoneGroup[] {
    const tasksByMilestone = new Map<string, IRTask[]>();
    const orphans: IRTask[] = [];
    const milestoneExtIds = new Set(ir.milestones.map((m) => m.ext_id));

    for (const t of ir.tasks) {
        if (t.milestone_ext_id && milestoneExtIds.has(t.milestone_ext_id)) {
            const arr = tasksByMilestone.get(t.milestone_ext_id) ?? [];
            arr.push(t);
            tasksByMilestone.set(t.milestone_ext_id, arr);
        } else {
            orphans.push(t);
        }
    }

    const groups: MilestoneGroup[] = ir.milestones.map((m: IRMilestone) => ({
        key: m.ext_id,
        name: m.name,
        description: m.description,
        tasks: tasksByMilestone.get(m.ext_id) ?? [],
        catchall: false,
        aiSuggested: m.ext_id.startsWith("llm-"),
    }));

    if (orphans.length > 0) {
        const sourceLabel = (ir.project.source || "import").replace(/_/g, " ");
        groups.push({
            key: "__catchall__",
            name: `Imported from ${sourceLabel.replace(/\b\w/g, (c) => c.toUpperCase())}`,
            description:
                "Tasks the importer couldn't place into a themed milestone will be grouped here. Rename, split, or re-assign after the import.",
            tasks: orphans,
            catchall: true,
            aiSuggested: false,
        });
    }

    return groups;
}

export function MigrationMilestonePreview({
    ir,
    warnings,
}: MigrationMilestonePreviewProps) {
    const groups = useMemo(() => buildGroups(ir), [ir]);
    const aiSuggestedCount = useMemo(
        () => groups.filter((g) => g.aiSuggested).length,
        [groups],
    );
    const groupingFailed = useMemo(
        () => warnings.some((w) => w.code === "LLM_GROUPING_FAILED"),
        [warnings],
    );

    if (groups.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Milestones &amp; tasks</CardTitle>
                <CardDescription>
                    {aiSuggestedCount > 0 ? (
                        <>
                            Continuum auto-grouped your tasks into{" "}
                            <span className="font-medium text-foreground">
                                {aiSuggestedCount} themed{" "}
                                {aiSuggestedCount === 1 ? "milestone" : "milestones"}
                            </span>
                            . Click any milestone to inspect the tasks before importing.
                        </>
                    ) : groupingFailed ? (
                        <>
                            AI grouping didn&apos;t run for this import — tasks are landing
                            under a single catch-all milestone you can split up after.
                        </>
                    ) : (
                        <>
                            Here&apos;s how the imported work will be organised. Click any
                            milestone to inspect its tasks before importing.
                        </>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {groups.map((g, i) => (
                    <MilestoneRow key={g.key} index={i} group={g} defaultOpen={i === 0} />
                ))}
            </CardContent>
        </Card>
    );
}

interface MilestoneRowProps {
    group: MilestoneGroup;
    index: number;
    defaultOpen: boolean;
}

function MilestoneRow({ group, index, defaultOpen }: MilestoneRowProps) {
    const [open, setOpen] = useState(defaultOpen);
    const hidden = Math.max(0, group.tasks.length - TASK_PREVIEW_LIMIT);
    const visibleTasks = group.tasks.slice(0, TASK_PREVIEW_LIMIT);

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <div className="overflow-hidden rounded-lg border border-border bg-card">
                <CollapsibleTrigger asChild>
                    <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-muted/40"
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <span className="shrink-0 tabular-nums text-sm font-medium text-foreground">
                                {index + 1}
                            </span>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-sm font-medium text-foreground">
                                        {group.name}
                                    </h4>
                                    {group.aiSuggested ? (
                                        <Badge
                                            variant="secondary"
                                            className="text-[10px] font-medium"
                                        >
                                            AI-suggested
                                        </Badge>
                                    ) : null}
                                    {group.catchall ? (
                                        <Badge
                                            variant="outline"
                                            className="gap-1 text-[10px] font-medium"
                                        >
                                            <Inbox aria-hidden className="size-3" />
                                            Catch-all
                                        </Badge>
                                    ) : null}
                                </div>
                                {group.description ? (
                                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                        {group.description}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] font-medium">
                                {group.tasks.length} {group.tasks.length === 1 ? "task" : "tasks"}
                            </Badge>
                            {open ? (
                                <ChevronDown
                                    aria-hidden
                                    className="size-4 text-muted-foreground"
                                />
                            ) : (
                                <ChevronRight
                                    aria-hidden
                                    className="size-4 text-muted-foreground"
                                />
                            )}
                        </div>
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="space-y-2 border-t border-border bg-muted/20 p-3">
                        {visibleTasks.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                                No tasks in this milestone yet.
                            </p>
                        ) : (
                            visibleTasks.map((t, ti) => (
                                <TaskRow key={t.ext_id || `t-${ti}`} task={t} index={ti} />
                            ))
                        )}
                        {hidden > 0 ? (
                            <p className="pt-1 text-xs text-muted-foreground">
                                + {hidden.toLocaleString()} more{" "}
                                {hidden === 1 ? "task" : "tasks"} not shown in preview.
                            </p>
                        ) : null}
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}

function TaskRow({ task, index }: { task: IRTask; index: number }) {
    const priority = ((task.priority ?? "medium").toLowerCase() as TaskPriority);
    return (
        <div className="flex items-start gap-3 rounded-md bg-card p-2.5">
            <span className="mt-0.5 shrink-0 tabular-nums text-xs font-medium text-muted-foreground">
                {index + 1}
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                    {task.title || "(untitled)"}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        <Flag
                            aria-hidden
                            className={cn(
                                "size-3 shrink-0",
                                taskPriorityFlagClass(priority),
                            )}
                        />
                        {taskPriorityLabel(priority)}
                    </span>
                    {task.status ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {task.status}
                        </span>
                    ) : null}
                    {task.label_names.slice(0, 4).map((l) => (
                        <span
                            key={l}
                            className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                        >
                            {l}
                        </span>
                    ))}
                    {task.label_names.length > 4 ? (
                        <span className="text-[10px] text-muted-foreground">
                            +{task.label_names.length - 4}
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
