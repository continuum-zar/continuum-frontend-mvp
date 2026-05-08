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

    it('respects lock meta for modified task flag', () => {
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
        expect(row?.change).toBe('modified');
        expect(row?.locked).toBe(true);
    });
});
