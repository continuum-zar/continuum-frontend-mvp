import type { MemberContributionStats } from '@/api/dashboard';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { mapMemberContributionsChartData } from './dashboardChartMappers';

export function MemberContributionsChart({
  members,
  emptyLabel = 'No member contribution data',
}: {
  members: MemberContributionStats[];
  emptyLabel?: string;
}) {
  const data = mapMemberContributionsChartData(members);
  if (!data.length) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">{emptyLabel}</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(280, data.length * 36)}>
      <BarChart layout="vertical" data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
        <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          stroke="var(--color-muted-foreground)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={100}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
          }}
        />
        <Legend iconType="circle" />
        <Bar dataKey="hours" name="Hours" fill="var(--color-primary)" maxBarSize={14} />
        <Bar dataKey="tasks" name="Tasks done" fill="var(--color-success)" maxBarSize={14} />
        <Bar dataKey="commits" name="Commits" fill="#64748b" maxBarSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
