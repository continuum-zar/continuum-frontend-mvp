import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'motion/react';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { DashboardClientChatPanel } from './DashboardClientChatPanel';
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Activity,
  AlertCircle,
  Clock,
  GitCommit,
  GitBranch,
  MessageSquare,
  Paperclip,
  UserX,
  Zap,
  CheckCircle2,
  MoreVertical,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip';
import { Skeleton } from '../components/ui/skeleton';
import { VirtualList } from '../components/ui/VirtualList';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useRole } from '../context/RoleContext';
import { effectiveDashboardRole } from '@/lib/utils/roleMapping';
import {
  useProjects,
  fetchProjectDashboard,
  fetchProjectVelocityReport,
  useProjectMilestones,
  fetchMilestoneBurndown,
  useProjectMembers,
  fetchUserRhythm,
  fetchClassificationBreakdown,
  fetchProjectStaleWork,
  fetchClientProjects,
  fetchClientProjectProgress,
  postProjectQuery,
  useIndexingProgressPoll,
} from '@/api';
import { useAuthStore } from '@/store/authStore';
import { DashboardAnalyticsCharts } from '../components/dashboard-charts/DashboardAnalyticsCharts';
import { STALE_MODERATE_MS, STALE_REFERENCE_MS } from '@/lib/queryDefaults';
import {
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Heatmap Helper
const getHeatmapColor = (value: number) => {
  if (value > 45) return 'bg-primary';
  if (value > 30) return 'bg-primary/80';
  if (value > 15) return 'bg-primary/50';
  if (value > 0) return 'bg-primary/20';
  return 'bg-muted/30';
};

type DashboardProps = {
  hideKpiCards?: boolean;
};

export function Dashboard({ hideKpiCards = false }: DashboardProps) {
  const { role: userRole } = useRole();
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [rhythmMember, setRhythmMember] = useState("all");
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: "Hello! I'm your Continuum assistant. Ask me anything about the project's progress, invoices, or recent activities." },
  ]);
  const [chatSending, setChatSending] = useState(false);
  const reduceMotion = usePrefersReducedMotion();

  const container = useMemo(
    () => ({
      hidden: { opacity: reduceMotion ? 1 : 0 },
      show: {
        opacity: 1,
        transition: reduceMotion ? { duration: 0 } : { staggerChildren: 0.05 },
      },
    }),
    [reduceMotion]
  );

  const item = useMemo(
    () => ({
      hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 20 },
      show: {
        opacity: 1,
        y: 0,
        transition: { duration: reduceMotion ? 0 : 0.2 },
      },
    }),
    [reduceMotion]
  );

  /*
   * ── Query dependency tree ──────────────────────────────────────────────
   * Role → queries that fire
   *
   * Project Manager (+ project selected):
   *   useProjects, useProjectMembers, project-dashboard, velocity-report,
   *   user-rhythm, classification-breakdown, stale-work,
   *   milestones → milestone-burndown, project-stats (per-member)
   *
   * Developer (+ project selected):
   *   useProjects, project-dashboard, velocity-report, user-rhythm
   *
   * Client (global role or project member_role client):
   *   client-projects → client-progress (global Client), or client-progress for selected project (mixed)
   *
   * On-demand (any role): postProjectQuery (chat)
   * ─────────────────────────────────────────────────────────────────────── */

  const user = useAuthStore((s) => s.user);

  // Projects list – only PM/Developer need the full project list;
  // Client role uses client-projects instead. Key matches useProjects / layout prefetch.
  const { data: projectsRaw, isLoading: projectsLoading, isError: projectsError } = useProjects({
    enabled: userRole !== 'Client',
  });
  const projects = projectsRaw ?? [];
  const hasProjectSelected = selectedProject !== "";

  const selectedProjectObj = useMemo(
    () => projects.find((p) => String(p.id) === selectedProject),
    [projects, selectedProject]
  );

  const effectiveRole = useMemo(
    () => effectiveDashboardRole(userRole, selectedProjectObj?.memberRole),
    [userRole, selectedProjectObj?.memberRole]
  );

  const isProjectPM =
    effectiveRole !== 'Client' &&
    (userRole === 'Admin' || selectedProjectObj?.memberRole === 'project_manager');

  const { data: rhythmMembersRaw } = useProjectMembers(
    isProjectPM && hasProjectSelected ? selectedProject : undefined
  );
  const rhythmMembers = rhythmMembersRaw ?? [];
  /** Include all project members in the heatmap selector, regardless of role. */
  const rhythmProjectMembers = useMemo(
    () => rhythmMembers,
    [rhythmMembers]
  );

  // Default to first project when list loads; clear when no projects (no "All Projects" option)
  useEffect(() => {
    if (userRole === 'Client') return;
    if (projects.length === 0) {
      setSelectedProject("");
      return;
    }
    const firstId = String(projects[0].id);
    if (selectedProject === "" || !projects.some((p) => String(p.id) === selectedProject)) {
      setSelectedProject(firstId);
    }
  }, [userRole, projects, selectedProject]);

  const rhythmUserId = useMemo(() => {
    if (!isProjectPM) return user?.id ?? null;
    if (isProjectPM) {
      if (rhythmMember === 'all') return rhythmProjectMembers[0]?.userId ?? null;
      const m = rhythmProjectMembers.find((x) => String(x.id) === rhythmMember);
      return m?.userId ?? null;
    }
    return null;
  }, [isProjectPM, user?.id, rhythmMember, rhythmProjectMembers]);

  const { data: rhythmResponse, isLoading: rhythmLoading, isError: rhythmError } = useQuery({
    queryKey: ['user-rhythm', rhythmUserId],
    queryFn: () => fetchUserRhythm(rhythmUserId!),
    enabled: rhythmUserId != null && effectiveRole !== 'Client',
    staleTime: STALE_REFERENCE_MS,
    placeholderData: (previousData) => previousData,
  });

  const rhythmChartData = useMemo(() => {
    const dh = rhythmResponse?.day_hour;
    if (!dh) return [];
    const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;
    const dayLabels: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri' };
    return dayOrder.map((dayKey) => {
      const row: Record<string, string | number> = { day: dayLabels[dayKey] ?? dayKey };
      const dayData = dh[dayKey] ?? {};
      for (let h = 8; h <= 18; h++) {
        row[`hour${h}`] = Number(dayData[String(h)] ?? 0);
      }
      return row;
    });
  }, [rhythmResponse]);

  const { data: dashboardMetrics, isLoading: dashboardLoading, isError: dashboardError } = useQuery({
    queryKey: ['project-dashboard', selectedProject],
    queryFn: () => fetchProjectDashboard(selectedProject),
    enabled: hasProjectSelected && effectiveRole !== 'Client',
    staleTime: STALE_MODERATE_MS,
    placeholderData: (previousData) => previousData,
  });

  const health = dashboardMetrics?.health;
  const velocity = dashboardMetrics?.velocity;
  const velocityScore = velocity?.trend?.velocity_score ?? (velocity?.weeks?.length ? velocity.weeks[velocity.weeks.length - 1].velocity_score : null);
  const velocityDelta = velocity?.trend?.change_percentage != null ? `${velocity.trend.change_percentage > 0 ? '+' : ''}${Number(velocity.trend.change_percentage).toFixed(1)}% from last period` : null;
  const forecastScore = velocity?.forecast_next_week ?? null;
  const hpsRatio = health?.hps_ratio ?? null;
  const overdueCount = health?.overdue_count ?? 0;
  const unassignedCount = health?.unassigned_count ?? 0;

  const { data: classificationBreakdown, isLoading: classificationLoading, isError: classificationError } = useQuery({
    queryKey: ['classification-breakdown', selectedProject],
    queryFn: () => fetchClassificationBreakdown(selectedProject),
    enabled: hasProjectSelected && isProjectPM,
    staleTime: STALE_MODERATE_MS,
    placeholderData: (previousData) => previousData,
  });

  const gitCommitsChartData = useMemo(() => {
    if (!classificationBreakdown) return [];
    const { structural, incremental, trivial } = classificationBreakdown;
    return [
      { name: 'Structural', value: structural ?? 0, color: '#3b82f6' },
      { name: 'Incremental', value: incremental ?? 0, color: '#10b981' },
      { name: 'Trivial', value: trivial ?? 0, color: '#64748b' },
    ].filter((d) => d.value > 0);
  }, [classificationBreakdown]);
  const classificationTotal = (classificationBreakdown?.structural ?? 0) + (classificationBreakdown?.incremental ?? 0) + (classificationBreakdown?.trivial ?? 0);

  const { data: clientProjectsListRaw } = useQuery({
    queryKey: ['client-projects'],
    queryFn: fetchClientProjects,
    enabled: userRole === 'Client',
    staleTime: STALE_REFERENCE_MS,
  });
  const clientProjectsList = clientProjectsListRaw ?? [];

  const clientProjectId = userRole === 'Client' && clientProjectsList.length > 0
    ? (hasProjectSelected && clientProjectsList.some((p) => String(p.id) === selectedProject) ? selectedProject : String(clientProjectsList[0].id))
    : selectedProject;
  useEffect(() => {
    if (userRole === 'Client' && clientProjectsList.length > 0 && !selectedProject) {
      setSelectedProject(String(clientProjectsList[0].id));
    }
  }, [userRole, clientProjectsList, selectedProject]);

  const { data: clientProgress, isLoading: clientProgressLoading, isError: clientProgressError } = useQuery({
    queryKey: ['client-progress', clientProjectId],
    queryFn: () => fetchClientProjectProgress(clientProjectId),
    enabled: effectiveRole === 'Client' && !!clientProjectId && clientProjectId !== 'all',
    staleTime: STALE_MODERATE_MS,
    placeholderData: (previousData) => previousData,
  });

  const clientHealthChartData = useMemo(() => {
    const hp = clientProgress?.health_pie;
    if (!hp) return [];
    return [
      { name: 'On Track', value: hp.on_track_pct ?? 0, color: '#10b981' },
      { name: 'At Risk', value: hp.at_risk_pct ?? 0, color: '#f59e0b' },
      { name: 'Blocked', value: hp.blocked_pct ?? 0, color: '#ef4444' },
    ].filter((d) => d.value > 0);
  }, [clientProgress?.health_pie]);

  const activityFeedFromApi = useMemo(() => {
    const list = clientProgress?.recent_activity ?? [];
    return list.map((a, idx) => {
      const actionLabel =
        a.type === 'task_complete' ? 'Task Completed'
          : a.type === 'commit' ? 'Commit Pushed'
            : a.type === 'logged_hour' ? 'Logged hours'
              : a.type === 'task_status' ? (a.description || 'Status Changed')
                : a.type === 'task_assignment' ? 'Assignee Changed'
                  : a.type === 'comment_added' ? 'Comment Added'
                    : a.type === 'attachment_uploaded' ? 'Attachment Added'
                      : a.type === 'branch_push' ? 'Branch Push'
                        : (a.description?.slice(0, 30) ?? 'Activity');
      const icon =
        a.type === 'task_complete' ? CheckCircle2
          : a.type === 'commit' ? GitCommit
            : a.type === 'logged_hour' ? Clock
              : a.type === 'comment_added' ? MessageSquare
                : a.type === 'attachment_uploaded' ? Paperclip
                  : a.type === 'branch_push' ? GitBranch
                    : Activity;
      const timeStr = a.date ? formatDistanceToNow(new Date(a.date), { addSuffix: true }) : '';
      return { id: idx, action: actionLabel, target: a.target_title ?? '', user: a.user_name, time: timeStr, icon, color: 'text-muted-foreground', bg: 'bg-muted' };
    });
  }, [clientProgress?.recent_activity]);

  const { data: staleWorkResponse, isLoading: staleWorkLoading, isError: staleWorkError } = useQuery({
    queryKey: ['stale-work', selectedProject],
    queryFn: () => fetchProjectStaleWork(selectedProject),
    enabled: hasProjectSelected && isProjectPM,
    staleTime: STALE_REFERENCE_MS,
    placeholderData: (previousData) => previousData,
  });

  const staleBranchesList = useMemo(() => {
    const list = staleWorkResponse?.stale_branches ?? [];
    return list.map((item, idx) => ({
      id: idx,
      name: item.branch,
      author: item.last_committer_name,
      daysStale: item.days_inactive ?? (item.last_commit_at ? Math.floor((Date.now() - new Date(item.last_commit_at).getTime()) / 86400000) : 0),
    }));
  }, [staleWorkResponse]);

  const hasProjects = userRole === 'Client' ? clientProjectsList.length > 0 : projects.length > 0;

  const queryProjectIdForChat =
    effectiveRole === 'Client' ? (selectedProject || clientProjectId) : selectedProject;

  const indexingProgressQuery = useIndexingProgressPoll(
    queryProjectIdForChat,
    chatSending && Boolean(queryProjectIdForChat && queryProjectIdForChat !== 'all'),
  );

  const handleSendChat = useCallback(async () => {
    const msg = chatMessage.trim();
    if (!msg) return;
    if (!hasProjectSelected) {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Please select a project first.' }]);
      return;
    }
    setChatMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setChatMessage('');
    setChatSending(true);
    try {
      const res = await postProjectQuery(selectedProject, { query: msg });
      setChatMessages((prev) => [...prev, { role: 'assistant', content: res.answer ?? 'No response.' }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setChatSending(false);
    }
  }, [chatMessage, hasProjectSelected, selectedProject]);

  // Milestones – only PM renders the burndown chart & milestone selector on the dashboard
  const { data: milestonesRaw } = useProjectMilestones(
    isProjectPM && hasProjectSelected ? selectedProject : undefined
  );
  const milestones = milestonesRaw ?? [];
  const firstMilestoneId = milestones.length > 0 ? milestones[0].id : null;
  const milestoneId = selectedMilestone;
  useEffect(() => {
    if (milestones.length === 0) {
      setSelectedMilestone(null);
      return;
    }
    const selectedStillExists = selectedMilestone != null && milestones.some((m) => m.id === selectedMilestone);
    if (!selectedStillExists && firstMilestoneId != null) {
      setSelectedMilestone(firstMilestoneId);
    }
  }, [firstMilestoneId, selectedMilestone, milestones]);

  const { data: burndown, isLoading: burndownLoading, isError: burndownError } = useQuery({
    queryKey: ['milestone-burndown', milestoneId],
    queryFn: () => fetchMilestoneBurndown(milestoneId!),
    enabled: !!milestoneId && isProjectPM,
    staleTime: STALE_MODERATE_MS,
    placeholderData: (previousData) => previousData,
  });

  const burndownChartData = useMemo(() => {
    if (!burndown?.series?.length) return [];
    const total = burndown.total_scope_points ?? 0;
    const dueDate = burndown.due_date ? new Date(burndown.due_date).getTime() : null;
    const idealSeries = burndown.ideal_series?.length ? burndown.ideal_series : null;
    return burndown.series.map((point, i) => {
      const dateLabel = new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      let ideal: number | null = null;
      if (idealSeries && idealSeries[i]?.ideal_scope_points != null) {
        ideal = idealSeries[i].ideal_scope_points;
      } else if (dueDate && total > 0) {
        const start = new Date(burndown.series[0].date).getTime();
        const elapsed = new Date(point.date).getTime() - start;
        const totalDuration = dueDate - start;
        ideal = totalDuration > 0 ? Math.max(0, total - (elapsed / totalDuration) * total) : total;
      }
      return { date: dateLabel, actual: point.remaining_scope_points, ideal };
    });
  }, [burndown]);

  const { data: velocityReport, isLoading: velocityLoading, isError: velocityError } = useQuery({
    queryKey: ['velocity-report', selectedProject],
    queryFn: () => fetchProjectVelocityReport(selectedProject, 104, 'daily'),
    enabled: hasProjectSelected && effectiveRole !== 'Client',
    staleTime: STALE_MODERATE_MS,
    placeholderData: (previousData) => previousData,
  });

  const velocityChartData =
    velocityReport?.weeks?.map((w) => ({
      day: w.week_start_date ? new Date(w.week_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `D${w.week_number}`,
      score: w.velocity_score,
      avg: w.rolling_avg,
      tasks: w.tasks_completed,
      hours: w.hours_logged,
      commits: w.commits_count,
    })) ?? [];

  return (
    <div className="p-8 pb-20">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl mb-2">{effectiveRole === 'Client' ? 'Project Dashboard' : 'Metrics & Diagnostics'}</h1>
          <p className="text-muted-foreground">
            {effectiveRole === 'Client' ? 'Real-time project updates and health.' : 'Team velocity, health, and efficiency insights.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={userRole === 'Client' ? clientProjectId : (hasProjects ? (selectedProject || String(projects[0]?.id ?? "")) : "__none__")}
            onValueChange={setSelectedProject}
            disabled={userRole === 'Client' ? clientProjectsList.length === 0 : (projectsLoading || projectsError || !hasProjects)}
          >
            <SelectTrigger className="w-[200px] border-border bg-card">
              <SelectValue placeholder={userRole === 'Client' ? (clientProjectsList.length === 0 ? 'No projects' : 'Select project') : (projectsLoading ? 'Loading projects...' : hasProjects ? 'Select project' : 'No projects')} />
            </SelectTrigger>
            <SelectContent>
              {userRole === 'Client'
                ? clientProjectsList.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))
                : hasProjects
                  ? projects.map((project) => (
                      <SelectItem key={project.id} value={String(project.id)}>
                        {project.title}
                      </SelectItem>
                    ))
                  : [<SelectItem key="none" value="__none__">No projects</SelectItem>]}
            </SelectContent>
          </Select>
          {effectiveRole !== 'Client' && (
            <UiTooltip>
              <TooltipTrigger asChild>
                <Button variant="outline"><Clock className="mr-2 h-4 w-4" /> Last 30 Days</Button>
              </TooltipTrigger>
              <TooltipContent>Filter dashboard to last 30 days</TooltipContent>
            </UiTooltip>
          )}
          {isProjectPM && (
            <UiTooltip>
              <TooltipTrigger asChild>
                <Button variant="outline"><UserX className="mr-2 h-4 w-4" /> Team View</Button>
              </TooltipTrigger>
              <TooltipContent>Switch to team-focused metrics</TooltipContent>
            </UiTooltip>
          )}
        </div>
      </div>

      {/* Row 1: KPI Velocity Cards (requires single project) */}
      {!hideKpiCards && isProjectPM && hasProjectSelected && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {dashboardLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-6 flex flex-col justify-between h-[132px]">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                  <div>
                    <Skeleton className="h-9 w-16 mb-2" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              ))}
            </>
          ) : dashboardError ? (
            <div className="col-span-4 rounded-lg border border-border bg-card p-8 text-center text-destructive text-sm">Failed to load dashboard metrics</div>
          ) : (
            <>
          <motion.div variants={item} className="bg-card border border-border rounded-lg p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Team Velocity Score</span>
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">{velocityScore != null ? Number(velocityScore).toFixed(1) : '—'}</div>
              {velocityDelta != null && (
                <div className={`flex items-center text-sm ${(velocity?.trend?.change_percentage ?? 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {(velocity?.trend?.change_percentage ?? 0) >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                  <span>{velocityDelta}</span>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={item} className="bg-card border border-border rounded-lg p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Forecast Score (Next Wk)</span>
              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1 text-muted-foreground">{forecastScore != null ? Number(forecastScore).toFixed(1) : '—'}</div>
              <div className="flex items-center text-sm text-success">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span>Stable upward trend</span>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="bg-card border border-border rounded-lg p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Current HPS Ratio</span>
              <div className="w-8 h-8 rounded bg-success/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-success" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">{hpsRatio != null ? Number(hpsRatio).toFixed(2) : '—'}</div>
              <div className="flex items-center text-sm text-success">
                <ArrowDownRight className="h-4 w-4 mr-1" />
                <span>{health?.health_status ?? 'More efficient'}</span>
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="bg-card border-x-4 border-l-destructive border-y-border border-r-border rounded-lg p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-destructive">Health Flags</span>
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="space-y-2 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overdue Tasks</span>
                <span className="font-bold">{overdueCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Unassigned Tasks</span>
                <span className="font-bold">{unassignedCount}</span>
              </div>
            </div>
          </motion.div>
            </>
          )}
        </motion.div>
      )}

      {/* Row 2: Charts (Velocity & Burndown) — require single project */}
      {effectiveRole !== 'Client' && !hasProjectSelected && (
        <div className="mb-6 rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          Select a project to view velocity, burndown, and other metrics.
        </div>
      )}
      {effectiveRole !== 'Client' && hasProjectSelected && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
            className={`bg-card border border-border rounded-lg p-6 ${effectiveRole === 'Developer' ? 'lg:col-span-2' : ''}`}
          >
            <div className="mb-4">
              <h3 className="mb-1">Daily Velocity Composite</h3>
              <p className="text-sm text-muted-foreground">Daily weighted score vs. 7-day average</p>
            </div>
            {velocityLoading && hasProjectSelected ? (
              <div className="h-[300px] flex flex-col gap-4">
                <div className="flex items-end gap-2 flex-1 pt-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="flex-1" style={{ height: `${20 + Math.random() * 60}%` }} />
                  ))}
                </div>
                <div className="flex gap-2 h-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="flex-1" />
                  ))}
                </div>
              </div>
            ) : velocityError && hasProjectSelected ? (
              <div className="h-[300px] flex items-center justify-center text-destructive text-sm">Failed to load velocity</div>
            ) : !hasProjectSelected ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">Select a project to view velocity</div>
            ) : velocityChartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">No velocity data yet</div>
            ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={velocityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                  formatter={(value: number, name: string) => [typeof value === 'number' ? Number(value).toFixed(1) : value, name]}
                />
                <Legend iconType="circle" />
                <Bar dataKey="score" name="Velocity Score" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Line type="monotone" dataKey="avg" name="Rolling Avg" stroke="var(--color-success)" strokeWidth={3} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
            )}
          </motion.div>

          {isProjectPM && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.25, delay: reduceMotion ? 0 : 0.1 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="mb-4 flex justify-between items-start">
                <div>
                  <h3 className="mb-1">Milestone Burndown</h3>
                  <p className="text-sm text-muted-foreground">Remaining scope points towards deadline</p>
                </div>
                {milestones.length > 1 && (
                  <Select value={milestoneId ?? ''} onValueChange={(v) => setSelectedMilestone(v || null)}>
                    <SelectTrigger className="w-[180px] h-8 text-xs border-border bg-card">
                      <SelectValue placeholder="Milestone" />
                    </SelectTrigger>
                    <SelectContent>
                      {milestones.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {!hasProjectSelected ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">Select a project to view burndown</div>
              ) : burndownLoading ? (
                <div className="h-[300px] relative">
                  <Skeleton className="absolute inset-x-0 bottom-0 h-[2px]" />
                  <Skeleton className="absolute inset-y-0 left-0 w-[2px]" />
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="w-[80%] h-[60%] border-l-2 border-b-2 border-dashed border-muted relative">
                      {reduceMotion ? (
                        <div
                          className="absolute top-0 left-0 w-full h-full opacity-35"
                          style={{
                            background: 'linear-gradient(to bottom right, transparent 49.5%, var(--color-muted) 50%, transparent 50.5%)',
                            backgroundSize: '100% 100%',
                          }}
                        />
                      ) : (
                        <motion.div
                          className="absolute top-0 left-0 w-full h-full"
                          style={{
                            background: 'linear-gradient(to bottom right, transparent 49.5%, var(--color-muted) 50%, transparent 50.5%)',
                            backgroundSize: '100% 100%',
                          }}
                          animate={{ opacity: [0.2, 0.5, 0.2] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ) : burndownError ? (
                <div className="h-[300px] flex items-center justify-center text-destructive text-sm">Failed to load burndown</div>
              ) : milestones.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">No milestones yet</div>
              ) : burndownChartData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">No burndown data yet</div>
              ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={burndownChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                  />
                  <Legend iconType="circle" />
                  <Line yAxisId="left" type="monotone" dataKey="ideal" name="Target Burndown" stroke="var(--color-muted)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="actual" name="Actual Remaining" stroke="var(--color-destructive)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
              )}
            </motion.div>
          )}
        </div>
      )}

      {effectiveRole !== 'Client' && hasProjectSelected && (
        <DashboardAnalyticsCharts
          selectedProject={selectedProject}
          hasProjectSelected={hasProjectSelected}
          effectiveRole={effectiveRole}
          isProjectPM={isProjectPM}
          reduceMotion={reduceMotion}
          dashboardMetrics={dashboardMetrics}
          dashboardLoading={dashboardLoading}
          dashboardError={dashboardError}
        />
      )}

      {/* Row 3: User Rhythm Heatmap (requires single project) */}
      {effectiveRole !== 'Client' && hasProjectSelected && (
        <div className="grid grid-cols-1 gap-6 mb-6">

          {/* Heatmap */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25, delay: reduceMotion ? 0 : 0.2 }}
            className="bg-card border border-border rounded-lg p-6"
          >
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h3 className="mb-1">{effectiveRole === 'Developer' ? 'My Productivity Rhythm' : 'Team Productivity Rhythm'}</h3>
                <p className="text-sm text-muted-foreground">Active minutes by hour block</p>
              </div>
              <div className="flex items-center gap-4">
                {isProjectPM && (
                  <Select value={rhythmMember} onValueChange={setRhythmMember}>
                    <SelectTrigger className="w-[180px] h-8 text-xs border-border bg-card">
                      <SelectValue placeholder="Filter member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Members (Collective)</SelectItem>
                      {rhythmProjectMembers.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="flex items-center text-xs space-x-2 text-muted-foreground">
                  <span>Less</span>
                  <div className="w-3 h-3 rounded-sm bg-muted/30" />
                  <div className="w-3 h-3 rounded-sm bg-primary/20" />
                  <div className="w-3 h-3 rounded-sm bg-primary/50" />
                  <div className="w-3 h-3 rounded-sm bg-primary/80" />
                  <div className="w-3 h-3 rounded-sm bg-primary" />
                  <span>More</span>
                </div>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <div className="min-w-[600px]">
                {/* x-axis labels */}
                <div className="flex mb-2 ml-[40px]">
                  {Array.from({ length: 11 }, (_, i) => i + 8).map(hour => (
                    <div key={hour} className="flex-1 text-center text-xs text-muted-foreground">
                      {hour}:00
                    </div>
                  ))}
                </div>

                {/* grid */}
                {(effectiveRole === 'Developer' && !user?.id) || (isProjectPM && !hasProjectSelected) ? (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                    {isProjectPM ? 'Select a project to view rhythm' : 'Sign in to view your rhythm'}
                  </div>
                ) : rhythmLoading ? (
                  <div className="h-[200px] flex flex-col gap-1 ml-[40px]">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex gap-1 h-6">
                        {[...Array(11)].map((_, j) => (
                          <Skeleton key={j} className="flex-1 rounded-sm" />
                        ))}
                      </div>
                    ))}
                  </div>
                ) : rhythmError ? (
                  <div className="h-[200px] flex items-center justify-center text-destructive text-sm">Failed to load rhythm</div>
                ) : isProjectPM && rhythmMember === 'all' && rhythmProjectMembers.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No members in this project</div>
                ) : rhythmChartData.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No rhythm data yet</div>
                ) : (
                <div className="flex flex-col gap-1">
                  {rhythmChartData.map((dayRow, idx) => (
                    <div key={idx} className="flex items-center">
                      <div className="w-[40px] text-xs font-medium text-muted-foreground">
                        {dayRow.day}
                      </div>
                      <div className="flex-1 flex gap-1">
                        {Array.from({ length: 11 }, (_, i) => i + 8).map(hour => (
                          <div
                            key={hour}
                            className={`flex-1 aspect-square rounded-sm ${getHeatmapColor(Number(dayRow[`hour${hour}`] ?? 0))}`}
                            title={`${dayRow.day} ${hour}:00 - ${dayRow[`hour${hour}`]} mins`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Row 4: Git Contribution & Stale Work (requires single project) */}
      {isProjectPM && hasProjectSelected && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Git Donut */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25, delay: reduceMotion ? 0 : 0.3 }}
            className="bg-card border border-border rounded-lg p-6"
          >
            <div className="mb-2 flex justify-between items-start">
              <div>
                <h3 className="mb-1">Commit Classification</h3>
                <p className="text-sm text-muted-foreground">Distribution of commit types</p>
              </div>
              <GitCommit className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="h-[250px] relative">
              {!hasProjectSelected ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Select a project to view classification</div>
              ) : classificationLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="relative w-40 h-40">
                    <Skeleton className="absolute inset-0 rounded-full border-8 border-muted" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Skeleton className="h-8 w-12 mb-1" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                  </div>
                </div>
              ) : classificationError ? (
                <div className="h-full flex items-center justify-center text-destructive text-sm">Failed to load</div>
              ) : gitCommitsChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No commit data yet</div>
              ) : (
              <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gitCommitsChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {gitCommitsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-36px]">
                <span className="text-3xl font-bold">{classificationTotal}</span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              </>
              )}
            </div>
          </motion.div>

          {/* Stale Work Table */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25, delay: reduceMotion ? 0 : 0.35 }}
            className="lg:col-span-2 bg-card border border-border rounded-lg p-6 flex flex-col"
          >
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h3 className="mb-1">Stale Work</h3>
                <p className="text-sm text-muted-foreground">Branches with no activity in {staleWorkResponse?.threshold_days ?? 7}+ days</p>
              </div>
              {staleBranchesList.length > 0 && <Badge variant="destructive">Action Required</Badge>}
            </div>

            {!hasProjectSelected ? (
              <div className="py-12 text-center text-muted-foreground text-sm">Select a project to view stale work</div>
            ) : staleWorkLoading ? (
              <div className="py-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-16 ml-auto" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                ))}
              </div>
            ) : staleWorkError ? (
              <div className="py-12 text-center text-destructive text-sm">Failed to load stale work</div>
            ) : staleBranchesList.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">No stale branches</div>
            ) : (
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground border-b border-border">
                  <tr>
                    <th className="pb-3 font-medium">Branch Name</th>
                    <th className="pb-3 font-medium">Last Committer</th>
                    <th className="pb-3 font-medium text-right">Days Stale</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {staleBranchesList.map((branch) => (
                    <tr key={branch.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-medium font-mono text-xs">{branch.name}</td>
                      <td className="py-3 text-muted-foreground flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] text-foreground">
                          {branch.author.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        {branch.author}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${branch.daysStale > 10 ? 'bg-destructive/20 text-destructive' : 'bg-warning/20 text-warning'}`}>
                          {branch.daysStale}d
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <UiTooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Branch actions">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Branch actions</TooltipContent>
                        </UiTooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </motion.div>

        </div>
      )}

      {/* Client View Components */}
      {effectiveRole === 'Client' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Project Health */}
            <motion.div variants={item} initial="hidden" animate="show" className="bg-card border border-border rounded-lg p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Project Health</h3>
                <p className="text-sm text-muted-foreground">Overall status of tasks and deliverables.</p>
              </div>
              {clientProgressLoading ? (
                <div className="flex items-center gap-4">
                  <Skeleton className="w-24 h-24 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ) : clientProgressError ? (
                <div className="text-sm text-destructive">Unable to load (you may not have access)</div>
              ) : clientHealthChartData.length === 0 ? (
                <div className="text-sm text-muted-foreground">No health data yet</div>
              ) : (
              <div className="flex items-center gap-4">
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={clientHealthChartData} cx="50%" cy="50%" innerRadius={30} outerRadius={40} dataKey="value" stroke="none">
                        {clientHealthChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1">
                  {clientProgress?.health_pie && (
                    <>
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> <span className="text-sm">{clientProgress.health_pie.on_track_pct ?? 0}% On Track</span></div>
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /> <span className="text-sm">{clientProgress.health_pie.at_risk_pct ?? 0}% At Risk</span></div>
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /> <span className="text-sm">{clientProgress.health_pie.blocked_pct ?? 0}% Blocked</span></div>
                    </>
                  )}
                </div>
              </div>
              )}
            </motion.div>

            {/* Activity Feed */}
            <motion.div variants={item} initial="hidden" animate="show" className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>
              {clientProgressLoading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-64" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : clientProgressError ? (
                <div className="text-sm text-destructive">Unable to load activity</div>
              ) : activityFeedFromApi.length === 0 ? (
                <div className="text-sm text-muted-foreground">No recent activity</div>
              ) : (
              <VirtualList
                items={activityFeedFromApi}
                threshold={12}
                estimateSize={52}
                gap={24}
                maxHeight="min(50vh, 400px)"
                getItemKey={(a) => a.id}
                scrollClassName="pr-1"
              >
                {(activity) => (
                  <div className="flex gap-4">
                    <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activity.bg}`}>
                      <activity.icon className={`h-4 w-4 ${activity.color}`} />
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold">{activity.user}</span>{' '}
                        <span className="text-muted-foreground">{activity.action}</span>{' '}
                        <span className="font-medium">{activity.target}</span>
                      </p>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  </div>
                )}
              </VirtualList>
              )}
            </motion.div>
          </div>

          <DashboardClientChatPanel
            itemVariants={item}
            chatMessages={chatMessages}
            chatMessage={chatMessage}
            onChatMessageChange={setChatMessage}
            onSend={handleSendChat}
            chatSending={chatSending}
            indexingProgress={indexingProgressQuery.data}
            indexingPollFailed={indexingProgressQuery.isError}
          />
        </div>
      )}

    </div>
  );
}
