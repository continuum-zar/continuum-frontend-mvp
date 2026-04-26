import { describe, expect, it } from 'vitest';
import {
  buildStatusDistributionData,
  mapHpsTrendChartData,
  mapMemberContributionsChartData,
  mapProjectHistoryChartData,
  mergeLeadCycleBins,
} from './dashboardChartMappers';

describe('mergeLeadCycleBins', () => {
  it('aligns lead and cycle counts by bin index', () => {
    const lead = [
      { label: 'A', min_days: 0, max_days: 1, count: 2 },
      { label: 'B', min_days: 2, max_days: 3, count: 1 },
    ];
    const cycle = [
      { label: 'A', min_days: 0, max_days: 1, count: 1 },
      { label: 'B', min_days: 2, max_days: 3, count: 0 },
    ];
    expect(mergeLeadCycleBins(lead, cycle)).toEqual([
      { label: 'A', lead: 2, cycle: 1 },
      { label: 'B', lead: 1, cycle: 0 },
    ]);
  });
});

describe('buildStatusDistributionData', () => {
  it('drops zero buckets and maps stats', () => {
    const data = buildStatusDistributionData({
      total_todo_tasks: 3,
      total_in_progress_tasks: 0,
      total_completed_tasks: 5,
      total_overdue_tasks: 1,
    });
    expect(data).toEqual([
      expect.objectContaining({ name: 'To do', value: 3 }),
      expect.objectContaining({ name: 'Completed', value: 5 }),
      expect.objectContaining({ name: 'Overdue', value: 1 }),
    ]);
  });
});

describe('mapHpsTrendChartData', () => {
  it('filters to points with numeric hps for the line series', () => {
    const rows = [
      { week: '2026-01-05', hps: null, hours_logged: 0, scope_points: 0, tasks_completed: 0 },
      { week: '2026-01-12', hps: 1.5, hours_logged: 3, scope_points: 2, tasks_completed: 1 },
    ];
    const mapped = mapHpsTrendChartData(rows);
    expect(mapped).toHaveLength(1);
    expect(mapped[0].hps).toBe(1.5);
    expect(mapped[0].week).toBe('2026-01-12');
  });
});

describe('mapProjectHistoryChartData', () => {
  it('maps API rows to chart rows', () => {
    const out = mapProjectHistoryChartData([
      {
        id: 1,
        project_id: 9,
        date: '2026-01-01T00:00:00Z',
        total_hours: 10,
        progress_percentage: 40,
        active_task_count: 3,
      },
    ]);
    expect(out[0].progress).toBe(40);
    expect(out[0].hours).toBe(10);
    expect(out[0].dateLabel).toBeTruthy();
  });
});

describe('mapMemberContributionsChartData', () => {
  it('truncates long names', () => {
    const out = mapMemberContributionsChartData([
      {
        user_id: 1,
        name: 'Very Long Display Name Here',
        role: 'developer',
        total_hours: 8,
        total_tasks_completed: 2,
        total_tasks_in_progress: 0,
        total_commits: 4,
        classification_breakdown: { structural: 0, incremental: 0, trivial: 0 },
      },
    ]);
    expect(out[0].name.length).toBeLessThanOrEqual(18);
    expect(out[0].hours).toBe(8);
  });
});
