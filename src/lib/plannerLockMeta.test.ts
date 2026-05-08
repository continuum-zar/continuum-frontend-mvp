import { describe, expect, it } from 'vitest';
import { milestoneLockedFromStatus, plannerLockMetaFromRows, semanticForStored, taskLockedFromSemantic } from './plannerLockMeta';
import type { KanbanBoardColumnApi } from '@/types/kanban';
import type { MilestoneAPIResponse } from '@/types/milestone';
import type { TaskAPIResponse } from '@/types/task';

const defaultCols: KanbanBoardColumnApi[] = [
    { id: 'todo', title: 'To Do', task_status: 'todo', kind: 'todo' },
    { id: 'ip', title: 'Doing', task_status: 'in_progress', kind: 'in_progress' },
    { id: 'done', title: 'Done', task_status: 'done', kind: 'done' },
];

describe('plannerLockMeta', () => {
    it('semanticForStored maps column id to kind', () => {
        expect(semanticForStored(defaultCols, 'ip')).toBe('in_progress');
        expect(semanticForStored(defaultCols, 'done')).toBe('done');
    });

    it('taskLockedFromSemantic locks in_progress and done', () => {
        expect(taskLockedFromSemantic('in_progress')).toBe(true);
        expect(taskLockedFromSemantic('done')).toBe(true);
        expect(taskLockedFromSemantic('todo')).toBe(false);
    });

    it('milestoneLockedFromStatus', () => {
        expect(milestoneLockedFromStatus('completed')).toBe(true);
        expect(milestoneLockedFromStatus('not_started')).toBe(false);
    });

    it('plannerLockMetaFromRows marks locked tasks and milestones', () => {
        const tasks: TaskAPIResponse[] = [
            {
                id: 1,
                title: 'A',
                status: 'ip',
                project_id: 1,
            },
            {
                id: 2,
                title: 'B',
                status: 'todo',
                project_id: 1,
            },
        ];
        const milestones: MilestoneAPIResponse[] = [
            {
                id: 10,
                project_id: 1,
                name: 'M',
                status: 'completed',
            },
        ];
        const meta = plannerLockMetaFromRows(defaultCols, tasks, milestones);
        expect(meta.lockedTaskIds.has(1)).toBe(true);
        expect(meta.lockedTaskIds.has(2)).toBe(false);
        expect(meta.lockedMilestoneIds.has(10)).toBe(true);
    });
});
