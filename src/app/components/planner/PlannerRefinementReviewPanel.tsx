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
            return 'bg-emerald-50 text-emerald-800 border-emerald-200';
        case 'removed':
            return 'bg-red-50 text-red-800 border-red-200';
        case 'modified':
            return 'bg-amber-50 text-amber-900 border-amber-200';
        default:
            return 'bg-slate-50 text-slate-600 border-slate-200';
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
            <div className="overflow-hidden rounded-lg border border-[#eceff1] bg-white">
                <CollapsibleTrigger asChild>
                    <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f9fafb]"
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
                                <span className="font-['Satoshi',sans-serif] text-[14px] font-semibold text-[#0b191f]">
                                    {task.title}
                                </span>
                                {task.locked && (
                                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                                        Locked
                                    </span>
                                )}
                            </div>
                            {task.detail && (
                                <p className="mt-1 text-xs text-[#727d83]">{task.detail}</p>
                            )}
                        </div>
                        {open ? (
                            <ChevronDown className="size-4 shrink-0 text-[#727d83]" />
                        ) : (
                            <ChevronRight className="size-4 shrink-0 text-[#727d83]" />
                        )}
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="border-t border-[#f0f2f3] bg-[#fcfcfd] p-3">
                        {!hasSnapshots ? (
                            <p className="text-sm text-[#727d83]">
                                No task snapshots available for side-by-side preview.
                            </p>
                        ) : (
                            <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
                                <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#727d83]">
                                        Before (baseline)
                                    </p>
                                    <PlannedTaskReviewPreview
                                        task={baseline}
                                        emptyLabel={leftEmpty}
                                        changedFields={changedFields}
                                        column="baseline"
                                    />
                                </div>
                                <div className="hidden w-px shrink-0 bg-[#ebedee] md:block" aria-hidden />
                                <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#727d83]">
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
                <div className="rounded-xl border border-[#ebedee] bg-white p-5 shadow-sm">
                    <h3 className="font-['Satoshi',sans-serif] text-[18px] font-bold text-[#0b191f]">
                        Review proposed changes
                    </h3>
                    <p className="mt-2 text-[14px] text-[#606d76]">
                        Expand each changed task to compare baseline and proposed versions side by side.
                    </p>
                    <p className="mt-1 text-[13px] text-[#727d83]">
                        {changedTaskCount} changed {changedTaskCount === 1 ? 'task' : 'tasks'} across{' '}
                        {changedSections.length} {changedSections.length === 1 ? 'milestone' : 'milestones'}.
                    </p>
                </div>
            ) : null}

            {changedSections.length === 0 ? (
                    <div className="rounded-xl border border-[#ebedee] bg-white p-6 text-sm text-[#606d76]">
                        No changed tasks were found compared to the loaded baseline.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {changedSections.map((section) => (
                            <section
                                key={section.key}
                                className="rounded-xl border border-[#ebedee] bg-white p-4 shadow-sm"
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
                                    <h3 className="font-['Satoshi',sans-serif] text-[16px] font-semibold text-[#0b191f]">
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
                <div className="sticky bottom-0 z-10 mt-4 flex items-center justify-between gap-3 border-t border-[#ebedee] bg-white/95 px-1 py-4 backdrop-blur">
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
                        className="inline-flex h-11 items-center gap-2 bg-[#0b191f] text-white hover:bg-[#1a2d36]"
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
                    'linear-gradient(180deg, #ffffff 0%, #f9f9f9 100%)',
            }}
        >
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-8 py-8">
                <div className="rounded-xl border border-[#ebedee] bg-white p-5 shadow-sm">
                    <h2 className="font-['Satoshi',sans-serif] text-[24px] font-bold text-[#0b191f]">
                        Review proposed plan changes
                    </h2>
                    <p className="mt-2 text-[14px] text-[#606d76]">
                        Expand each changed task to compare baseline and proposed versions side by side (like the task
                        detail view).
                    </p>
                    <p className="mt-1 text-[13px] text-[#727d83]">
                        {changedTaskCount} changed {changedTaskCount === 1 ? 'task' : 'tasks'} across{' '}
                        {changedSections.length} {changedSections.length === 1 ? 'milestone' : 'milestones'}.
                    </p>
                </div>
                {inner}
            </div>
        </div>
    );
}
