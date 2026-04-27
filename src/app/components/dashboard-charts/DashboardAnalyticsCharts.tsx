import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import type { Role } from '@/app/context/RoleContext';
import {
  fetchProjectCumulativeFlow,
  fetchProjectLeadTimeDistribution,
  fetchProjectHistory,
  fetchProjectHpsVelocity,
  fetchMemberContributions,
} from '@/api';
import type { DashboardMetricsResponse } from '@/api/dashboard';
import { STALE_MODERATE_MS } from '@/lib/queryDefaults';
import { Skeleton } from '@/app/components/ui/skeleton';
import { CumulativeFlowDiagram } from './CumulativeFlowDiagram';
import { HpsTrendChart } from './HpsTrendChart';
import { LeadTimeDistributionChart } from './LeadTimeDistributionChart';
import { MemberContributionsChart } from './MemberContributionsChart';
import { ProjectHistoryChart } from './ProjectHistoryChart';
import { TaskStatusFunnelChart } from './TaskStatusFunnelChart';

type DashboardAnalyticsChartsProps = {
  selectedProject: string;
  hasProjectSelected: boolean;
  effectiveRole: Role;
  isProjectPM: boolean;
  reduceMotion: boolean;
  dashboardMetrics: DashboardMetricsResponse | undefined;
  dashboardLoading: boolean;
  dashboardError: boolean;
};

function ChartCard({
  title,
  description,
  children,
  reduceMotion,
  delay = 0,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  reduceMotion: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.2, delay: reduceMotion ? 0 : delay }}
      className="rounded-lg border border-border bg-card p-6"
    >
      <div className="mb-4">
        <h3 className="mb-1 text-base font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </motion.div>
  );
}

export function DashboardAnalyticsCharts({
  selectedProject,
  hasProjectSelected,
  effectiveRole,
  isProjectPM,
  reduceMotion,
  dashboardMetrics,
  dashboardLoading,
  dashboardError,
}: DashboardAnalyticsChartsProps) {
  const enabled = hasProjectSelected && effectiveRole !== 'Client';

  const { data: cfd, isLoading: cfdLoading, isError: cfdError } = useQuery({
    queryKey: ['project-cumulative-flow', selectedProject],
    queryFn: () => fetchProjectCumulativeFlow(selectedProject, 90),
    enabled,
    staleTime: STALE_MODERATE_MS,
  });

  const { data: lead, isLoading: leadLoading, isError: leadError } = useQuery({
    queryKey: ['project-lead-time', selectedProject],
    queryFn: () => fetchProjectLeadTimeDistribution(selectedProject, 52),
    enabled,
    staleTime: STALE_MODERATE_MS,
  });

  const { data: history = [], isLoading: histLoading, isError: histError } = useQuery({
    queryKey: ['project-history', selectedProject],
    queryFn: () => fetchProjectHistory(selectedProject),
    enabled,
    staleTime: STALE_MODERATE_MS,
  });

  const { data: hpsSeries = [], isLoading: hpsLoading, isError: hpsError } = useQuery({
    queryKey: ['project-hps-velocity', selectedProject],
    queryFn: () => fetchProjectHpsVelocity(selectedProject, 24),
    enabled,
    staleTime: STALE_MODERATE_MS,
  });

  const { data: members = [], isLoading: memLoading, isError: memError } = useQuery({
    queryKey: ['member-contributions', selectedProject],
    queryFn: () => fetchMemberContributions(selectedProject),
    enabled: enabled && isProjectPM,
    staleTime: STALE_MODERATE_MS,
  });

  if (!enabled) return null;

  return (
    <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ChartCard
        title="Cumulative flow"
        description="Tasks in To do, In progress, and Done over the last 90 days"
        reduceMotion={reduceMotion}
        delay={0}
      >
        {cfdLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : cfdError ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-destructive">Failed to load</div>
        ) : (
          <CumulativeFlowDiagram data={cfd?.series ?? []} />
        )}
      </ChartCard>

      <ChartCard
        title="Lead & cycle time"
        description="Completed tasks in the last 52 weeks (calendar days)"
        reduceMotion={reduceMotion}
        delay={0.05}
      >
        {leadLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : leadError ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-destructive">Failed to load</div>
        ) : (
          <LeadTimeDistributionChart
            leadBins={lead?.lead_time_bins ?? []}
            cycleBins={lead?.cycle_time_bins ?? []}
            tasksIncluded={lead?.tasks_included ?? 0}
          />
        )}
      </ChartCard>

      <ChartCard
        title="Task pipeline"
        description="Share of work by status from dashboard metrics"
        reduceMotion={reduceMotion}
        delay={0.1}
      >
        {dashboardLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : dashboardError ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-destructive">Failed to load metrics</div>
        ) : (
          <TaskStatusFunnelChart stats={dashboardMetrics?.stats} />
        )}
      </ChartCard>

      <ChartCard title="HPS trend" description="Hours per scope point by completion week" reduceMotion={reduceMotion} delay={0.12}>
        {hpsLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : hpsError ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-destructive">Failed to load</div>
        ) : (
          <HpsTrendChart points={hpsSeries} emptyLabel="No weekly HPS points yet" />
        )}
      </ChartCard>

      <ChartCard
        title="Project history"
        description="Progress % and total hours from snapshots"
        reduceMotion={reduceMotion}
        delay={0.14}
      >
        {histLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : histError ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-destructive">Failed to load</div>
        ) : (
          <ProjectHistoryChart history={history} />
        )}
      </ChartCard>

      {isProjectPM && (
        <ChartCard
          title="Member contributions"
          description="Hours, completed tasks, and commits by teammate"
          reduceMotion={reduceMotion}
          delay={0.16}
        >
          {memLoading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : memError ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-destructive">Failed to load</div>
          ) : (
            <MemberContributionsChart members={members} />
          )}
        </ChartCard>
      )}
    </div>
  );
}
