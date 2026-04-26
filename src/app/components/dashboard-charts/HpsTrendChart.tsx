import type { HpsVelocityPoint } from '@/api/dashboard';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { mapHpsTrendChartData } from './dashboardChartMappers';

export function HpsTrendChart({
  points,
  emptyLabel = 'No HPS data for this window',
}: {
  points: HpsVelocityPoint[];
  emptyLabel?: string;
}) {
  const data = mapHpsTrendChartData(points);
  if (!data.length) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">{emptyLabel}</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="weekLabel" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
          }}
          formatter={(v: number) => [v.toFixed(2), 'HPS']}
        />
        <Legend iconType="circle" />
        <Line type="monotone" dataKey="hps" name="Hours / scope pt." stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
