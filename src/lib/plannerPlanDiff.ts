import type { PlannedMilestone, PlannedTask, ProjectPlan } from '@/api/planner';

import { UNASSIGNED_PLANNER_MILESTONE_NAME } from '@/lib/plannerConstants';

function taskKey(t: PlannedTask, fallback: string): string {
    if (t.task_id != null && Number.isFinite(t.task_id)) return `id:${t.task_id}`;
    return `new:${fallback}:${t.title}`;
}

function milestoneKey(m: PlannedMilestone, idx: number): string {
    if (m.milestone_id != null && Number.isFinite(m.milestone_id)) return `id:${m.milestone_id}`;
    if (m.name.trim() === UNASSIGNED_PLANNER_MILESTONE_NAME) return 'unassigned';
    return `new:${idx}:${m.name}`;
}

export type TaskDiffRow = {
    key: string;
    taskId?: number;
    title: string;
    change: 'added' | 'removed' | 'modified' | 'unchanged';
    locked?: boolean;
    detail?: string;
    fieldDiffs?: TaskFieldDiff[];
    /** Full baseline snapshot when available (null for brand-new tasks). */
    baselineTask?: PlannedTask | null;
    /** Full proposed snapshot when available (null for removed tasks). */
    proposedTask?: PlannedTask | null;
};

export type TaskFieldDiff = {
    field:
        | 'title'
        | 'description'
        | 'priority'
        | 'scope_weight'
        | 'estimated_hours'
        | 'labels'
        | 'checklist';
    before: string;
    after: string;
};

export type MilestoneDiffSection = {
    key: string;
    milestoneId?: number;
    name: string;
    change: 'added' | 'removed' | 'modified' | 'unchanged';
    milestoneLocked?: boolean;
    tasks: TaskDiffRow[];
};

function stableStringifyTask(t: PlannedTask): string {
    return JSON.stringify({
        title: t.title,
        description: t.description,
        scope_weight: t.scope_weight,
        priority: t.priority,
        estimated_hours: t.estimated_hours,
        checklist: t.checklist,
        labels: t.labels?.slice().sort(),
    });
}

function normalizeChecklistValue(checklist: PlannedTask['checklist']): string {
    if (!Array.isArray(checklist) || checklist.length === 0) return 'None';
    return checklist
        .map((item) => `${item.is_completed ? '[x]' : '[ ]'} ${item.title}`)
        .join('\n');
}

function normalizeLabelsValue(labels: PlannedTask['labels']): string {
    if (!Array.isArray(labels) || labels.length === 0) return 'None';
    return labels.slice().sort().join(', ');
}

function normalizeTextValue(value: string | null | undefined): string {
    const trimmed = (value ?? '').trim();
    return trimmed.length > 0 ? trimmed : 'None';
}

function normalizePriorityValue(value: PlannedTask['priority']): string {
    return value ? String(value).toUpperCase() : 'None';
}

function normalizeEstimatedHoursValue(value: PlannedTask['estimated_hours']): string {
    if (value == null || Number.isNaN(value)) return 'None';
    return String(value);
}

function computeTaskFieldDiffs(beforeTask: PlannedTask, afterTask: PlannedTask): TaskFieldDiff[] {
    const allFields: TaskFieldDiff[] = [
        {
            field: 'title',
            before: normalizeTextValue(beforeTask.title),
            after: normalizeTextValue(afterTask.title),
        },
        {
            field: 'description',
            before: normalizeTextValue(beforeTask.description),
            after: normalizeTextValue(afterTask.description),
        },
        {
            field: 'priority',
            before: normalizePriorityValue(beforeTask.priority),
            after: normalizePriorityValue(afterTask.priority),
        },
        {
            field: 'scope_weight',
            before: normalizeTextValue(beforeTask.scope_weight),
            after: normalizeTextValue(afterTask.scope_weight),
        },
        {
            field: 'estimated_hours',
            before: normalizeEstimatedHoursValue(beforeTask.estimated_hours),
            after: normalizeEstimatedHoursValue(afterTask.estimated_hours),
        },
        {
            field: 'labels',
            before: normalizeLabelsValue(beforeTask.labels),
            after: normalizeLabelsValue(afterTask.labels),
        },
        {
            field: 'checklist',
            before: normalizeChecklistValue(beforeTask.checklist),
            after: normalizeChecklistValue(afterTask.checklist),
        },
    ];

    return allFields.filter((field) => field.before !== field.after);
}

export function computePlannerPlanDiff(
    baseline: ProjectPlan,
    proposed: ProjectPlan,
    locks?: { lockedTaskIds: Set<number>; lockedMilestoneIds: Set<number> },
): MilestoneDiffSection[] {
    const baseMap = new Map<string, PlannedMilestone>();
    baseline.milestones.forEach((m, i) => {
        baseMap.set(milestoneKey(m, i), m);
    });

    const propMap = new Map<string, PlannedMilestone>();
    proposed.milestones.forEach((m, i) => {
        propMap.set(milestoneKey(m, i), m);
    });

    const keys = new Set<string>([...baseMap.keys(), ...propMap.keys()]);
    const ordered = [...keys].sort();

    const out: MilestoneDiffSection[] = [];

    for (const key of ordered) {
        const b = baseMap.get(key);
        const p = propMap.get(key);
        const name = p?.name ?? b?.name ?? key;
        const milestoneId = p?.milestone_id ?? b?.milestone_id ?? undefined;
        const msLocked =
            milestoneId != null && locks?.lockedMilestoneIds.has(milestoneId) === true;

        if (b && !p) {
            const milestoneChange: MilestoneDiffSection['change'] = msLocked ? 'unchanged' : 'removed';
            out.push({
                key,
                milestoneId,
                name,
                change: milestoneChange,
                milestoneLocked: msLocked,
                tasks: b.tasks.map((t, j) => ({
                    ...(msLocked
                        ? {
                              key: taskKey(t, `${key}-${j}`),
                              taskId: t.task_id ?? undefined,
                              title: t.title,
                              change: 'unchanged' as const,
                              locked: true,
                              detail: 'Locked milestone — server will skip edits',
                              baselineTask: t,
                              proposedTask: t,
                          }
                        : {
                              key: taskKey(t, `${key}-${j}`),
                              taskId: t.task_id ?? undefined,
                              title: t.title,
                              change: 'removed' as const,
                              locked: t.task_id != null && locks?.lockedTaskIds.has(t.task_id),
                              baselineTask: t,
                              proposedTask: null,
                          }),
                })),
            });
            continue;
        }

        if (!b && p) {
            out.push({
                key,
                milestoneId,
                name,
                change: 'added',
                milestoneLocked: msLocked,
                tasks: p.tasks.map((t, j) => ({
                    key: taskKey(t, `${key}-${j}`),
                    taskId: t.task_id ?? undefined,
                    title: t.title,
                    change: 'added',
                    baselineTask: null,
                    proposedTask: t,
                })),
            });
            continue;
        }

        if (!b || !p) continue;

        const msChanged =
            b.name !== p.name ||
            (b.description || '') !== (p.description || '');

        const bTasks = new Map<string, PlannedTask>();
        b.tasks.forEach((t, j) => bTasks.set(taskKey(t, `${key}-${j}`), t));
        const pTasks = new Map<string, PlannedTask>();
        p.tasks.forEach((t, j) => pTasks.set(taskKey(t, `${key}-${j}`), t));

        const taskKeys = new Set<string>([...bTasks.keys(), ...pTasks.keys()]);
        const taskRows: TaskDiffRow[] = [];

        for (const tk of [...taskKeys].sort()) {
            const bt = bTasks.get(tk);
            const pt = pTasks.get(tk);
            const tid = pt?.task_id ?? bt?.task_id ?? undefined;
            const tLocked = msLocked || (tid != null && locks?.lockedTaskIds.has(tid) === true);

            if (bt && !pt) {
                const emptyTask: PlannedTask = {
                    title: '',
                    description: null,
                    scope_weight: bt.scope_weight,
                    priority: undefined,
                    estimated_hours: null,
                    checklist: [],
                    labels: [],
                };
                taskRows.push({
                    key: tk,
                    taskId: tid,
                    title: bt.title,
                    change: tLocked ? 'unchanged' : 'removed',
                    locked: tLocked || undefined,
                    detail: tLocked ? 'Locked — server will skip edits' : undefined,
                    fieldDiffs: tLocked ? undefined : computeTaskFieldDiffs(bt, emptyTask),
                    baselineTask: bt,
                    proposedTask: tLocked ? bt : null,
                });
            } else if (!bt && pt) {
                const emptyTask: PlannedTask = {
                    title: '',
                    description: null,
                    scope_weight: pt.scope_weight,
                    priority: undefined,
                    estimated_hours: null,
                    checklist: [],
                    labels: [],
                };
                taskRows.push({
                    key: tk,
                    taskId: tid,
                    title: pt.title,
                    change: tLocked ? 'unchanged' : 'added',
                    locked: tLocked || undefined,
                    detail: tLocked ? 'Locked — server will skip edits' : undefined,
                    fieldDiffs: tLocked ? undefined : computeTaskFieldDiffs(emptyTask, pt),
                    baselineTask: tLocked ? pt : null,
                    proposedTask: pt,
                });
            } else if (bt && pt) {
                const modified = stableStringifyTask(bt) !== stableStringifyTask(pt);
                const effectiveChange: TaskDiffRow['change'] =
                    modified && !tLocked ? 'modified' : 'unchanged';
                const fieldDiffs = modified ? computeTaskFieldDiffs(bt, pt) : [];
                taskRows.push({
                    key: tk,
                    taskId: tid,
                    title: pt.title,
                    change: effectiveChange,
                    locked: tLocked && modified,
                    detail: modified
                        ? tLocked
                            ? 'Locked — server will skip edits'
                            : 'Fields differ from baseline'
                        : undefined,
                    fieldDiffs: effectiveChange === 'modified' ? fieldDiffs : undefined,
                    baselineTask: bt,
                    proposedTask: pt,
                });
            }
        }

        const anyTaskChange = taskRows.some((r) => r.change !== 'unchanged');
        const sectionChange: MilestoneDiffSection['change'] =
            msChanged || anyTaskChange
                ? msLocked
                    ? 'unchanged'
                    : 'modified'
                : 'unchanged';

        out.push({
            key,
            milestoneId,
            name,
            change: sectionChange,
            milestoneLocked: msLocked,
            tasks: taskRows,
        });
    }

    return out;
}
