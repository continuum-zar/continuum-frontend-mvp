import type { TaskStatusAPI } from './task';

/** GET/PUT `/projects/{id}/kanban-board` column row (matches backend). */
export type KanbanBoardColumnApi = {
    id: string;
    title: string;
    task_status: TaskStatusAPI;
    kind: TaskStatusAPI;
};
