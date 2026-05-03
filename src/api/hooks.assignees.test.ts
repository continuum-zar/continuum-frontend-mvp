import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

import {
    applyAssigneeIdsToTaskResponse,
    optimisticApplyAssignees,
    optimisticApplyChecklists,
} from '@/api/hooks';
import { projectKeys } from '@/api/projects';
import { mapTask } from '@/api/mappers';
import type { Task, TaskAPIResponse } from '@/types/task';

describe('assignee cache helpers', () => {
    it('applyAssigneeIdsToTaskResponse syncs assignee_ids, assigned_user_ids, and assigned_to', () => {
        const base: TaskAPIResponse = {
            id: 1,
            title: 'T',
            status: 'todo',
            project_id: 9,
            assigned_to: 1,
            assignee_ids: [1],
            assigned_user_ids: [1],
        };
        const next = applyAssigneeIdsToTaskResponse(base, [3, 2, 3]);
        expect(next.assignee_ids).toEqual([2, 3]);
        expect(next.assigned_user_ids).toEqual([2, 3]);
        expect(next.assigned_to).toBe(2);
    });

    it('optimisticApplyAssignees updates task detail and project task list', () => {
        const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const detail: TaskAPIResponse = {
            id: 10,
            title: 'Card',
            status: 'todo',
            project_id: 7,
            assignee_ids: [1],
            assigned_user_ids: [1],
            assigned_to: 1,
        };
        qc.setQueryData(['tasks', 'detail', 10], detail);
        const kanbanTask: Task = mapTask(detail);
        qc.setQueryData<Task[]>(projectKeys.tasks(7), [kanbanTask]);

        optimisticApplyAssignees(qc, 10, [1, 4]);

        const patched = qc.getQueryData<TaskAPIResponse>(['tasks', 'detail', 10]);
        expect(patched?.assignee_ids).toEqual([1, 4]);

        const list = qc.getQueryData<Task[]>(projectKeys.tasks(7));
        expect(list?.[0]?.assignees).toEqual(['1', '4']);
    });

    it('optimisticApplyChecklists updates task detail and checklist counts on the board cache', () => {
        const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const detail: TaskAPIResponse = {
            id: 11,
            title: 'Card',
            status: 'todo',
            project_id: 7,
            checklists: [
                { text: 'A', done: false },
                { text: 'B', done: false },
            ],
        };
        qc.setQueryData(['tasks', 'detail', 11], detail);
        const kanbanTask: Task = mapTask(detail);
        qc.setQueryData<Task[]>(projectKeys.tasks(7), [kanbanTask]);

        const nextChecklists = [
            { text: 'A', done: true },
            { text: 'B', done: false },
        ];
        expect(optimisticApplyChecklists(qc, 11, nextChecklists)).toBe(true);

        const patched = qc.getQueryData<TaskAPIResponse>(['tasks', 'detail', 11]);
        expect(patched?.checklists?.filter((c) => c.done).length).toBe(1);

        const list = qc.getQueryData<Task[]>(projectKeys.tasks(7));
        expect(list?.[0]?.checklists).toEqual({ total: 2, completed: 1 });
    });
});
