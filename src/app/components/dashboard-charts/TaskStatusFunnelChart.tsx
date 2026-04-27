import type { DashboardStats } from '@/api/dashboard';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { buildStatusDistributionData } from './dashboardChartMappers';

export function TaskStatusFunnelChart({
  stats,
  emptyLabel = 'No task counts yet',
}: {
  stats: DashboardStats | undefined;
  emptyLabel?: string;
}) {
  const data = buildStatusDistributionData(stats);
  if (!data.length) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">{emptyLabel}</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={88} paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
          }}
        />
        <Legend verticalAlign="bottom" height={28} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}
