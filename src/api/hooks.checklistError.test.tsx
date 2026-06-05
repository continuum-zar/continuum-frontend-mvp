import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import type { ReactNode } from 'react';

import { useUpdateTask } from '@/api/hooks';
import type { TaskAPIResponse } from '@/types/task';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
}));

const updateTaskMock = vi.fn();
vi.mock('@/api/tasks', async () => {
  const actual = await vi.importActual<typeof import('@/api/tasks')>('@/api/tasks');
  return {
    ...actual,
    updateTask: (...args: unknown[]) => updateTaskMock(...args),
  };
});

function wrapperWithClient(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

const baseTask: TaskAPIResponse = {
  id: 77,
  title: 'Ship checklist failure handling',
  status: 'todo',
  project_id: 3,
  checklists: [
    { text: 'Original A', done: false },
    { text: 'Original B', done: false },
  ],
};

describe('useUpdateTask — checklist failure handling', () => {
  beforeEach(() => {
    updateTaskMock.mockReset();
    vi.mocked(toast.error).mockReset();
    vi.mocked(toast.success).mockReset();
  });

  it('reverts the task detail cache and shows a checklist-specific toast when the backend rejects a checklist update', async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    qc.setQueryData(['tasks', 'detail', 77], baseTask);

    // Reject with a message-less value so getApiErrorMessage falls back to our string.
    updateTaskMock.mockRejectedValueOnce({});

    const { result } = renderHook(() => useUpdateTask(), { wrapper: wrapperWithClient(qc) });

    result.current.mutate({
      taskId: 77,
      checklists: [
        { text: 'Original A', done: true },
        { text: 'Original B', done: true },
      ],
    });

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalled();
    });

    const reverted = qc.getQueryData<TaskAPIResponse>(['tasks', 'detail', 77]);
    expect(reverted?.checklists).toEqual(baseTask.checklists);
    expect(vi.mocked(toast.success)).not.toHaveBeenCalled();

    const errorMessage = vi.mocked(toast.error).mock.calls.at(-1)?.[0];
    expect(String(errorMessage)).toMatch(/checklist/i);
  });

  it('reverts the task detail cache when a sections-only update fails', async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const withSections = {
      ...baseTask,
      sections: [{ id: 's1', name: 'Acceptance', type: 'checklist', items: [{ text: 'A', done: false }] }],
    } as TaskAPIResponse;
    qc.setQueryData(['tasks', 'detail', 77], withSections);

    updateTaskMock.mockRejectedValueOnce({});

    const { result } = renderHook(() => useUpdateTask(), { wrapper: wrapperWithClient(qc) });

    result.current.mutate({
      taskId: 77,
      sections: [{ id: 's1', name: 'Acceptance', type: 'checklist', items: [{ text: 'A', done: true }] }],
    });

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalled();
    });

    const reverted = qc.getQueryData<TaskAPIResponse>(['tasks', 'detail', 77]);
    expect(reverted?.sections).toEqual(withSections.sections);
  });

  it('falls back to the generic update message when the failed write is not checklist-only', async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    qc.setQueryData(['tasks', 'detail', 77], baseTask);

    updateTaskMock.mockRejectedValueOnce({});

    const { result } = renderHook(() => useUpdateTask(), { wrapper: wrapperWithClient(qc) });

    result.current.mutate({ taskId: 77, title: 'New title' });

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalled();
    });

    const errorMessage = vi.mocked(toast.error).mock.calls.at(-1)?.[0];
    expect(String(errorMessage)).toMatch(/Failed to update task/i);
    expect(String(errorMessage)).not.toMatch(/checklist/i);
  });
});
