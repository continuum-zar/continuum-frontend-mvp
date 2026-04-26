import type { LeadTimeHistogramBin } from '@/api/dashboard';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { mergeLeadCycleBins } from './dashboardChartMappers';

export function LeadTimeDistributionChart({
  leadBins,
  cycleBins,
  tasksIncluded,
  emptyLabel = 'No completed tasks in this window',
}: {
  leadBins: LeadTimeHistogramBin[];
  cycleBins: LeadTimeHistogramBin[];
  tasksIncluded: number;
  emptyLabel?: string;
}) {
  const chartData = mergeLeadCycleBins(leadBins, cycleBins);
  const hasAny = chartData.some((d) => d.lead > 0 || d.cycle > 0);

  if (!tasksIncluded || !hasAny) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">{emptyLabel}</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="var(--color-muted-foreground)"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={-25}
          textAnchor="end"
          height={60}
        />
        <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
          }}
        />
        <Legend iconType="circle" />
        <Bar dataKey="lead" name="Lead time (created → done)" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={36} />
        <Bar
          dataKey="cycle"
          name="Cycle time (in progress → done)"
          fill="var(--color-success)"
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
