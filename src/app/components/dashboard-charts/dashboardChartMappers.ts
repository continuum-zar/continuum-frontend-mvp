import type {
  DashboardStats,
  HpsVelocityPoint,
  LeadTimeHistogramBin,
  MemberContributionStats,
  ProjectSnapshotHistoryPoint,
} from '@/api/dashboard';

const FUNNEL_COLORS = {
  todo: '#64748b',
  inProgress: '#3b82f6',
  completed: '#10b981',
  overdue: '#ef4444',
};

export function mergeLeadCycleBins(leadBins: LeadTimeHistogramBin[], cycleBins: LeadTimeHistogramBin[]) {
  return leadBins.map((b, i) => ({
    label: b.label,
    lead: b.count,
    cycle: cycleBins[i]?.count ?? 0,
  }));
}

export function buildStatusDistributionData(stats: DashboardStats | undefined) {
  if (!stats) return [];
  const rows = [
    { name: 'To do', value: stats.total_todo_tasks ?? 0, color: FUNNEL_COLORS.todo },
    { name: 'In progress', value: stats.total_in_progress_tasks ?? 0, color: FUNNEL_COLORS.inProgress },
    { name: 'Completed', value: stats.total_completed_tasks ?? 0, color: FUNNEL_COLORS.completed },
    { name: 'Overdue', value: stats.total_overdue_tasks ?? 0, color: FUNNEL_COLORS.overdue },
  ];
  return rows.filter((r) => r.value > 0);
}

export function mapHpsTrendChartData(points: HpsVelocityPoint[]) {
  return points
    .filter((p) => p.hps != null)
    .map((p) => ({
      week: p.week,
      weekLabel: (() => {
        try {
          return new Date(p.week + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch {
          return p.week;
        }
      })(),
      hps: p.hps as number,
    }));
}

export function mapProjectHistoryChartData(rows: ProjectSnapshotHistoryPoint[]) {
  return rows.map((r) => ({
    t: new Date(r.date).getTime(),
    dateLabel: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    progress: r.progress_percentage,
    hours: r.total_hours,
  }));
}

export function mapMemberContributionsChartData(members: MemberContributionStats[]) {
  return members.map((m) => ({
    name: m.name.length > 18 ? `${m.name.slice(0, 16)}…` : m.name,
    hours: m.total_hours,
    tasks: m.total_tasks_completed,
    commits: m.total_commits,
  }));
}
