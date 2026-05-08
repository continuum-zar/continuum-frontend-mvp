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
            out.push({
                key,
                milestoneId,
                name,
                change: 'removed',
                milestoneLocked: msLocked,
                tasks: b.tasks.map((t, j) => ({
                    key: taskKey(t, `${key}-${j}`),
                    taskId: t.task_id ?? undefined,
                    title: t.title,
                    change: 'removed',
                    locked: t.task_id != null && locks?.lockedTaskIds.has(t.task_id),
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
            const tLocked = tid != null && locks?.lockedTaskIds.has(tid) === true;

            if (bt && !pt) {
                taskRows.push({
                    key: tk,
                    taskId: tid,
                    title: bt.title,
                    change: 'removed',
                    locked: tLocked,
                });
            } else if (!bt && pt) {
                taskRows.push({
                    key: tk,
                    taskId: tid,
                    title: pt.title,
                    change: 'added',
                });
            } else if (bt && pt) {
                const modified = stableStringifyTask(bt) !== stableStringifyTask(pt);
                taskRows.push({
                    key: tk,
                    taskId: tid,
                    title: pt.title,
                    change: modified ? 'modified' : 'unchanged',
                    locked: tLocked && modified,
                    detail: modified ? 'Fields differ from baseline' : undefined,
                });
            }
        }

        const anyTaskChange = taskRows.some((r) => r.change !== 'unchanged');
        const sectionChange: MilestoneDiffSection['change'] =
            msChanged || anyTaskChange ? 'modified' : 'unchanged';

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
