import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type CumulativeFlowRow = {
  date: string;
  todo: number;
  in_progress: number;
  done: number;
};

function formatTick(isoDate: string) {
  try {
    return new Date(isoDate + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return isoDate;
  }
}

export function CumulativeFlowDiagram({
  data,
  emptyLabel = 'No flow data for this range',
}: {
  data: CumulativeFlowRow[];
  emptyLabel?: string;
}) {
  if (!data.length) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">{emptyLabel}</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="var(--color-muted-foreground)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatTick}
          interval="preserveStartEnd"
        />
        <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
          }}
          labelFormatter={formatTick}
        />
        <Legend iconType="circle" />
        <Area type="monotone" dataKey="todo" name="To do" stackId="cfd" stroke="#64748b" fill="#64748b" fillOpacity={0.85} />
        <Area
          type="monotone"
          dataKey="in_progress"
          name="In progress"
          stackId="cfd"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.85}
        />
        <Area type="monotone" dataKey="done" name="Done" stackId="cfd" stroke="#10b981" fill="#10b981" fillOpacity={0.85} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
