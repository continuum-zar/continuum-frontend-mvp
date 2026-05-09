import { describe, expect, it } from 'vitest';
import type { ProjectPlan } from '@/api/planner';
import { computePlannerPlanDiff } from './plannerPlanDiff';

function plan(name: string, milestones: ProjectPlan['milestones']): ProjectPlan {
    return {
        project_name: name,
        project_description: '',
        summary: '',
        milestones,
    };
}

describe('computePlannerPlanDiff', () => {
    it('detects added milestone', () => {
        const a = plan('P', [{ name: 'M1', description: null, tasks: [] }]);
        const b = plan('P', [
            { name: 'M1', description: null, tasks: [] },
            { name: 'M2', description: null, tasks: [] },
        ]);
        const diff = computePlannerPlanDiff(a, b);
        const added = diff.find((s) => s.change === 'added');
        expect(added?.name).toBe('M2');
    });

    it('respects lock meta by marking locked edits as unchanged', () => {
        const a = plan('P', [
            {
                milestone_id: 1,
                name: 'M1',
                description: null,
                tasks: [
                    {
                        task_id: 10,
                        title: 'T',
                        description: null,
                        scope_weight: 'M',
                        checklist: [],
                        labels: [],
                    },
                ],
            },
        ]);
        const b = plan('P', [
            {
                milestone_id: 1,
                name: 'M1',
                description: null,
                tasks: [
                    {
                        task_id: 10,
                        title: 'T changed',
                        description: null,
                        scope_weight: 'M',
                        checklist: [],
                        labels: [],
                    },
                ],
            },
        ]);
        const locks = { lockedTaskIds: new Set([10]), lockedMilestoneIds: new Set<number>() };
        const diff = computePlannerPlanDiff(a, b, locks);
        const row = diff[0]?.tasks.find((t) => t.taskId === 10);
        expect(row?.change).toBe('unchanged');
        expect(row?.locked).toBe(true);
    });

    it('returns field-level diffs for modified tasks', () => {
        const a = plan('P', [
            {
                milestone_id: 1,
                name: 'M1',
                description: null,
                tasks: [
                    {
                        task_id: 11,
                        title: 'Set up auth',
                        description: null,
                        scope_weight: 'M',
                        priority: 'medium',
                        estimated_hours: 6,
                        checklist: [{ title: 'Create API', is_completed: false }],
                        labels: ['backend'],
                    },
                ],
            },
        ]);
        const b = plan('P', [
            {
                milestone_id: 1,
                name: 'M1',
                description: null,
                tasks: [
                    {
                        task_id: 11,
                        title: 'Set up auth',
                        description: 'Use JWT',
                        scope_weight: 'L',
                        priority: 'high',
                        estimated_hours: 8,
                        checklist: [{ title: 'Create API', is_completed: true }],
                        labels: ['backend', 'security'],
                    },
                ],
            },
        ]);
        const diff = computePlannerPlanDiff(a, b);
        const row = diff[0]?.tasks.find((t) => t.taskId === 11);
        expect(row?.change).toBe('modified');
        expect(row?.fieldDiffs?.map((f) => f.field)).toEqual(
            expect.arrayContaining([
                'description',
                'scope_weight',
                'priority',
                'estimated_hours',
                'labels',
                'checklist',
            ]),
        );
        expect(row?.baselineTask?.title).toBe('Set up auth');
        expect(row?.proposedTask?.title).toBe('Set up auth');
        expect(row?.baselineTask?.estimated_hours).toBe(6);
        expect(row?.proposedTask?.estimated_hours).toBe(8);
    });

    it('includes baselineTask null and proposedTask for tasks added to an existing milestone', () => {
        const a = plan('P', [{ milestone_id: 1, name: 'M1', description: null, tasks: [] }]);
        const b = plan('P', [
            {
                milestone_id: 1,
                name: 'M1',
                description: null,
                tasks: [
                    {
                        title: 'Brand new',
                        description: null,
                        scope_weight: 'S',
                        checklist: [],
                        labels: [],
                    },
                ],
            },
        ]);
        const diff = computePlannerPlanDiff(a, b);
        const row = diff[0]?.tasks[0];
        expect(row?.change).toBe('added');
        expect(row?.baselineTask).toBeNull();
        expect(row?.proposedTask?.title).toBe('Brand new');
    });

    it('includes baselineTask and proposedTask null when a task is removed from a milestone', () => {
        const a = plan('P', [
            {
                milestone_id: 1,
                name: 'M1',
                description: null,
                tasks: [
                    {
                        task_id: 5,
                        title: 'Gone',
                        description: null,
                        scope_weight: 'M',
                        checklist: [],
                        labels: [],
                    },
                ],
            },
        ]);
        const b = plan('P', [{ milestone_id: 1, name: 'M1', description: null, tasks: [] }]);
        const diff = computePlannerPlanDiff(a, b);
        const row = diff[0]?.tasks[0];
        expect(row?.change).toBe('removed');
        expect(row?.baselineTask?.title).toBe('Gone');
        expect(row?.proposedTask).toBeNull();
    });
});
