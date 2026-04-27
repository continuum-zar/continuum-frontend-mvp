import type { ProjectSnapshotHistoryPoint } from '@/api/dashboard';
import {
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from 'recharts';
import { mapProjectHistoryChartData } from './dashboardChartMappers';

export function ProjectHistoryChart({
  history,
  emptyLabel = 'No snapshot history yet',
}: {
  history: ProjectSnapshotHistoryPoint[];
  emptyLabel?: string;
}) {
  const data = mapProjectHistoryChartData(history);
  if (!data.length) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">{emptyLabel}</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="dateLabel" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis
          yAxisId="left"
          stroke="var(--color-primary)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis yAxisId="right" orientation="right" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
          }}
          formatter={(value: number, name: string) =>
            name === 'Progress' ? [`${Number(value).toFixed(1)}%`, name] : [Number(value).toFixed(1), name]
          }
        />
        <Legend iconType="circle" />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="progress"
          name="Progress"
          stroke="var(--color-primary)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="hours"
          name="Total hours"
          stroke="var(--color-success)"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
