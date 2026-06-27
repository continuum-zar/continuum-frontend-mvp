import { useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/app/components/ui/collapsible';
import { cn } from '@/app/components/ui/utils';
import { PlannedTaskReviewPreview } from '@/app/components/planner/PlannedTaskReviewPreview';
import type { MilestoneDiffSection, TaskDiffRow, TaskFieldDiff } from '@/lib/plannerPlanDiff';

type PlannerRefinementReviewPanelProps = {
    sections: MilestoneDiffSection[];
    isApplying: boolean;
    onBack: () => void;
    onApply: () => void;
    /** When true, omit outer scroll shell / sticky footer — parent provides layout and actions (e.g. Generated Plan page). */
    embedded?: boolean;
    /** Hide sticky footer (pair with embedded). */
    hideFooter?: boolean;
};

function changeBadgeClass(change: MilestoneDiffSection['change'] | TaskDiffRow['change']) {
    switch (change) {
        case 'added':
            return 'bg-success/10 text-success border-success/30';
        case 'removed':
            return 'bg-destructive/10 text-destructive border-destructive/30';
        case 'modified':
            return 'bg-warning/10 text-warning border-warning/30';
        default:
            return 'bg-muted text-muted-foreground border-border';
    }
}

function changedFieldsFromDiffs(fieldDiffs: TaskFieldDiff[] | undefined): Set<TaskFieldDiff['field']> {
    return new Set(fieldDiffs?.map((f) => f.field) ?? []);
}

function TaskDiffAccordionRow({ task }: { task: TaskDiffRow }) {
    const [open, setOpen] = useState(false);
    const changedFields = useMemo(() => changedFieldsFromDiffs(task.fieldDiffs), [task.fieldDiffs]);

    const baseline = task.baselineTask ?? null;
    const proposed = task.proposedTask ?? null;
    const hasSnapshots = baseline != null || proposed != null;

    const leftEmpty =
        task.change === 'added'
            ? 'No baseline — this task is new in the proposed plan.'
            : 'No baseline snapshot.';
    const rightEmpty =
        task.change === 'removed'
            ? 'Nothing proposed — this task will be removed.'
            : 'No proposed snapshot.';

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <div className="overflow-hidden rounded-lg border border-border bg-card">
                <CollapsibleTrigger asChild>
                    <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted"
                    >
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className={cn(
                                        'rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                                        changeBadgeClass(task.change),
                                    )}
                                >
                                    {task.change}
                                </span>
                                <span className="font-['Satoshi',sans-serif] text-[14px] font-semibold text-foreground">
                                    {task.title}
                                </span>
                                {task.locked && (
                                    <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                        Locked
                                    </span>
                                )}
                            </div>
                            {task.detail && (
                                <p className="mt-1 text-xs text-muted-foreground">{task.detail}</p>
                            )}
                        </div>
                        {open ? (
                            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                        ) : (
                            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                        )}
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="border-t border-border bg-muted p-3">
                        {!hasSnapshots ? (
                            <p className="text-sm text-muted-foreground">
                                No task snapshots available for side-by-side preview.
                            </p>
                        ) : (
                            <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
                                <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        Before (baseline)
                                    </p>
                                    <PlannedTaskReviewPreview
                                        task={baseline}
                                        emptyLabel={leftEmpty}
                                        changedFields={changedFields}
                                        column="baseline"
                                    />
                                </div>
                                <div className="hidden w-px shrink-0 bg-muted md:block" aria-hidden />
                                <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        After (proposed)
                                    </p>
                                    <PlannedTaskReviewPreview
                                        task={proposed}
                                        emptyLabel={rightEmpty}
                                        changedFields={changedFields}
                                        column="proposed"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}

export function PlannerRefinementReviewPanel({
    sections,
    isApplying,
    onBack,
    onApply,
    embedded = false,
    hideFooter = false,
}: PlannerRefinementReviewPanelProps) {
    const changedSections = useMemo(
        () =>
            sections
                .map((section) => ({
                    ...section,
                    tasks: section.tasks.filter((task) => task.change !== 'unchanged'),
                }))
                .filter((section) => section.tasks.length > 0),
        [sections],
    );

    const changedTaskCount = useMemo(
        () => changedSections.reduce((sum, section) => sum + section.tasks.length, 0),
        [changedSections],
    );

    const inner = (
        <>
            {embedded ? (
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <h3 className="font-['Satoshi',sans-serif] text-[18px] font-bold text-foreground">
                        Review proposed changes
                    </h3>
                    <p className="mt-2 text-[14px] text-muted-foreground">
                        Expand each changed task to compare baseline and proposed versions side by side.
                    </p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                        {changedTaskCount} changed {changedTaskCount === 1 ? 'task' : 'tasks'} across{' '}
                        {changedSections.length} {changedSections.length === 1 ? 'milestone' : 'milestones'}.
                    </p>
                </div>
            ) : null}

            {changedSections.length === 0 ? (
                    <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
                        No changed tasks were found compared to the loaded baseline.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {changedSections.map((section) => (
                            <section
                                key={section.key}
                                className="rounded-xl border border-border bg-card p-4 shadow-sm"
                            >
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                    <span
                                        className={cn(
                                            'rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                                            changeBadgeClass(section.change),
                                        )}
                                    >
                                        {section.change}
                                    </span>
                                    <h3 className="font-['Satoshi',sans-serif] text-[16px] font-semibold text-foreground">
                                        {section.name}
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    {section.tasks.map((task) => (
                                        <TaskDiffAccordionRow key={task.key} task={task} />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}

            {!hideFooter ? (
                <div className="sticky bottom-0 z-10 mt-4 flex items-center justify-between gap-3 border-t border-border bg-card/95 px-1 py-4 backdrop-blur">
                    <Button
                        type="button"
                        variant="outline"
                        className="inline-flex h-11 items-center gap-2"
                        onClick={onBack}
                        disabled={isApplying}
                    >
                        <ArrowLeft className="size-4" />
                        Back to plan
                    </Button>
                    <Button
                        type="button"
                        className="inline-flex h-11 items-center gap-2 bg-foreground text-background hover:bg-foreground/90"
                        onClick={onApply}
                        disabled={isApplying || changedSections.length === 0}
                    >
                        {isApplying ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Applying…
                            </>
                        ) : (
                            <>
                                <Check className="size-4" />
                                Apply changes
                            </>
                        )}
                    </Button>
                </div>
            ) : null}
        </>
    );

    if (embedded) {
        return <div className="flex flex-col gap-6">{inner}</div>;
    }

    return (
        <div
            className="scrollbar-none min-h-0 flex-1 overflow-auto"
            style={{
                backgroundImage:
                    'linear-gradient(180deg, var(--background) 0%, var(--muted) 100%)',
            }}
        >
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-8 py-8">
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <h2 className="font-['Satoshi',sans-serif] text-[24px] font-bold text-foreground">
                        Review proposed plan changes
                    </h2>
                    <p className="mt-2 text-[14px] text-muted-foreground">
                        Expand each changed task to compare baseline and proposed versions side by side (like the task
                        detail view).
                    </p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                        {changedTaskCount} changed {changedTaskCount === 1 ? 'task' : 'tasks'} across{' '}
                        {changedSections.length} {changedSections.length === 1 ? 'milestone' : 'milestones'}.
                    </p>
                </div>
                {inner}
            </div>
        </div>
    );
}
