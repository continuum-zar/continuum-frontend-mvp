import { ArrowLeft, Check, Flag } from 'lucide-react';

import type { PlannedTask } from '@/api/planner';
import { formatEstimatedEffortLabel } from '@/api';
import { cn } from '@/app/components/ui/utils';
import type { TaskFieldDiff } from '@/lib/plannerPlanDiff';
import { taskPriorityFlagClass, taskPriorityLabel, type TaskPriority } from '@/types/task';

function scopeDisplayLabel(weight: PlannedTask['scope_weight']): string {
    const map: Record<string, string> = {
        XS: 'Extra Small (XS)',
        S: 'Small (S)',
        M: 'Medium (M)',
        L: 'Large (L)',
        XL: 'Extra Large (XL)',
    };
    return map[weight] ?? 'Medium (M)';
}

export type PlannedTaskReviewPreviewProps = {
    task: PlannedTask | null;
    /** Shown when `task` is null */
    emptyLabel?: string;
    changedFields?: Set<TaskFieldDiff['field']>;
    /** Baseline column uses red accents for changed fields; proposed uses green. */
    column?: 'baseline' | 'proposed';
};

/** Red tint for “before”, green for “after” when a field differs. */
function diffAccent(
    column: 'baseline' | 'proposed' | undefined,
    fieldActive: boolean,
    mode: 'sectionRing' | 'descBox' | 'flag',
): string {
    if (!column || !fieldActive) return '';
    const before = column === 'baseline';
    if (mode === 'descBox') {
        return before
            ? 'border-2 border-destructive/30 bg-destructive/10'
            : 'border-2 border-success/30 bg-success/10';
    }
    if (mode === 'flag') {
        return before
            ? 'ring-2 ring-destructive ring-offset-2 rounded-sm'
            : 'ring-2 ring-success ring-offset-2 rounded-sm';
    }
    return before ? 'ring-2 ring-destructive/70 ring-offset-2 rounded-lg' : 'ring-2 ring-success/70 ring-offset-2 rounded-lg';
}

export function PlannedTaskReviewPreview({
    task,
    emptyLabel = 'Nothing to show',
    changedFields,
    column,
}: PlannedTaskReviewPreviewProps) {
    const changed = (field: TaskFieldDiff['field']) => Boolean(changedFields?.has(field));

    if (!task) {
        return (
            <div className="min-w-0 flex-1 overflow-auto rounded-[12px] bg-muted p-4">
                <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-dashed border-border bg-muted px-4 text-center text-sm text-muted-foreground">
                    {emptyLabel}
                </div>
            </div>
        );
    }

    const priority = task.priority as TaskPriority | undefined;
    const desc = (task.description ?? '').trim();
    const checklist = Array.isArray(task.checklist) ? task.checklist : [];
    const labels = Array.isArray(task.labels) ? task.labels : [];
    const hours = task.estimated_hours;

    return (
        <div className="min-w-0 flex-1 overflow-auto rounded-[12px] bg-muted p-4">
            <div className="mx-auto w-full max-w-[600px]">
                <div className="flex items-center justify-between py-4">
                    <span className="inline-flex text-muted-foreground" aria-hidden="true">
                        <ArrowLeft size={20} />
                    </span>
                    <p className="text-[16px] font-medium tracking-[-0.16px] text-foreground">Update Task</p>
                    <Flag
                        size={16}
                        className={cn(
                            taskPriorityFlagClass(priority),
                            diffAccent(column, changed('priority'), 'flag'),
                        )}
                        aria-label={`Priority ${taskPriorityLabel(priority)}`}
                    />
                </div>

                <div className="space-y-10 py-4">
                    <section
                        className={cn(
                            'space-y-4 rounded-lg',
                            diffAccent(column, changed('title'), 'sectionRing'),
                        )}
                    >
                        <h2 className="text-[24px] font-medium leading-[1.2] tracking-[-0.24px] text-foreground">{task.title}</h2>
                        <div>
                            <p className="mb-1 text-[14px] font-medium text-muted-foreground">Description</p>
                            <div
                                className={cn(
                                    'min-h-[80px] rounded-[8px] border bg-card p-4',
                                    changed('description')
                                        ? diffAccent(column, true, 'descBox')
                                        : 'border border-border',
                                )}
                            >
                                {desc ? (
                                    <p className="whitespace-pre-wrap text-[16px] font-medium text-foreground">{desc}</p>
                                ) : (
                                    <p className="text-[14px] text-muted-foreground">No description</p>
                                )}
                            </div>
                        </div>
                    </section>

                    <section
                        className={cn(
                            'space-y-4',
                            diffAccent(column, changed('checklist'), 'sectionRing'),
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-[16px] font-medium text-foreground">Checklist</p>
                        </div>
                        {checklist.length === 0 ? (
                            <p className="text-[14px] text-muted-foreground">No checklist items</p>
                        ) : (
                            <div className="space-y-2">
                                {checklist.map((item, idx) => (
                                    <div key={`${idx}-${item.title}`} className="flex items-center gap-4">
                                        <div
                                            className={`flex size-5 shrink-0 items-center justify-center rounded-[4px] ${
                                                item.is_completed
                                                    ? 'bg-info'
                                                    : 'border border-border bg-card'
                                            }`}
                                        >
                                            {item.is_completed ? <Check size={13} className="text-white" /> : null}
                                        </div>
                                        <p
                                            className={`font-['Inter',sans-serif] text-[13px] font-normal leading-[19px] tracking-normal ${
                                                item.is_completed ? 'text-foreground/50 line-through' : 'text-foreground'
                                            }`}
                                        >
                                            {item.title}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section
                        className={cn(
                            'space-y-4',
                            diffAccent(column, changed('labels'), 'sectionRing'),
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-[16px] font-medium text-foreground">Tags</p>
                        </div>
                        {labels.length === 0 ? (
                            <p className="text-[14px] text-muted-foreground">No tags</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {labels.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center justify-center rounded-[16px] border border-border bg-card px-4 py-1.5 font-['Satoshi',sans-serif] text-[14px] font-medium leading-none tracking-normal text-muted-foreground"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </section>

                    <section
                        className={cn(
                            'space-y-3',
                            diffAccent(column, changed('scope_weight'), 'sectionRing'),
                        )}
                    >
                        <p className="text-[16px] font-medium text-foreground">Scope</p>
                        <p className="text-[16px] font-medium text-foreground">{scopeDisplayLabel(task.scope_weight)}</p>
                    </section>

                    <section
                        className={cn(
                            'space-y-3 pb-2',
                            diffAccent(column, changed('estimated_hours'), 'sectionRing'),
                        )}
                    >
                        <p className="text-[16px] font-medium text-foreground">Estimated effort</p>
                        {hours != null && Number.isFinite(hours) ? (
                            <span className="inline-flex rounded-[16px] bg-foreground px-4 py-1.5 font-['Satoshi',sans-serif] text-[14px] font-medium text-background">
                                {formatEstimatedEffortLabel(hours)}
                            </span>
                        ) : (
                            <p className="text-[14px] text-muted-foreground">Not set</p>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
