import { render } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { TaskStatusFunnelChart } from './TaskStatusFunnelChart';

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
});

describe('TaskStatusFunnelChart', () => {
  it('matches snapshot with mixed stats', () => {
    const { container } = render(
      <TaskStatusFunnelChart
        stats={{
          total_todo_tasks: 4,
          total_in_progress_tasks: 2,
          total_completed_tasks: 10,
          total_overdue_tasks: 1,
        }}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
