import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Activity,
  AlertCircle,
  Clock,
  GitCommit,
  UserX,
  Zap,
  CheckCircle2,
  Circle,
  MoreVertical,
  Send,
  Bot
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useRole } from '../context/RoleContext';
import { useProjects, fetchProjectDashboard, fetchProjectVelocityReport, useProjectMilestones, fetchMilestoneBurndown, useProjectMembers, fetchUserRhythm, fetchClassificationBreakdown, fetchProjectStaleWork, postProjectQuery } from '@/api';
import { useAuthStore } from '@/store/authStore';
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

// --- MOCK DATA ---

// 6. Client View Mocks
const activityFeed = [
  { id: 1, action: 'Task Completed', target: 'Design System Update', user: 'Sarah Chen', time: '2 hours ago', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  { id: 2, action: 'Commit Pushed', target: 'fix/auth-callback', user: 'Mike Torres', time: '4 hours ago', icon: GitCommit, color: 'text-primary', bg: 'bg-primary/10' },
  { id: 3, action: 'Task Started', target: 'Payment Gateway', user: 'Alex Johnson', time: '5 hours ago', icon: Activity, color: 'text-info', bg: 'bg-info/10' },
];

const healthData = [
  { name: 'On Track', value: 75, color: '#10b981' },
  { name: 'At Risk', value: 15, color: '#f59e0b' },
  { name: 'Blocked', value: 10, color: '#ef4444' },
];

const projectMembers = [
  { id: 'all', name: 'All Members (Collective)' },
  { id: '1', name: 'Sarah Chen' },
  { id: '2', name: 'Mike Torres' },
  { id: '3', name: 'Alex Johnson' },
];

// --- COMPONENTS ---

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

// Heatmap Helper
const getHeatmapColor = (value: number) => {
  if (value > 45) return 'bg-primary';
  if (value > 30) return 'bg-primary/80';
  if (value > 15) return 'bg-primary/50';
  if (value > 0) return 'bg-primary/20';
  return 'bg-muted/30';
};

export function Dashboard() {
  const { role: userRole } = useRole();
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [rhythmMember, setRhythmMember] = useState("all");
  const [snapshotMember, setSnapshotMember] = useState("all");
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: "Hello! I'm your Continuum assistant. Ask me anything about the project's progress, invoices, or recent activities." },
  ]);
  const [chatSending, setChatSending] = useState(false);
  const { data: projects = [], isLoading: projectsLoading, isError: projectsError } = useProjects();
  const user = useAuthStore((s) => s.user);
  const { data: rhythmMembers = [] } = useProjectMembers(
    userRole === 'Project Manager' && selectedProject !== 'all' ? selectedProject : undefined
  );

  const rhythmUserId = useMemo(() => {
    if (userRole === 'Developer') return user?.id ?? null;
    if (userRole === 'Project Manager') {
      if (rhythmMember === 'all') return rhythmMembers[0]?.userId ?? null;
      const m = rhythmMembers.find((x) => String(x.id) === rhythmMember);
      return m?.userId ?? null;
    }
    return null;
  }, [userRole, user?.id, rhythmMember, rhythmMembers]);

  const { data: rhythmResponse, isLoading: rhythmLoading, isError: rhythmError } = useQuery({
    queryKey: ['user-rhythm', rhythmUserId],
    queryFn: () => fetchUserRhythm(rhythmUserId!),
    enabled: rhythmUserId != null && userRole !== 'Client',
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
    enabled: selectedProject !== 'all' && userRole !== 'Client',
  });

  const health = dashboardMetrics?.health;
  const velocity = dashboardMetrics?.velocity;
  const velocityScore = velocity?.trend?.velocity_score ?? (velocity?.weeks?.length ? velocity.weeks[velocity.weeks.length - 1].velocity_score : null);
  const velocityDelta = velocity?.trend?.change_percentage != null ? `${velocity.trend.change_percentage > 0 ? '+' : ''}${velocity.trend.change_percentage}% from last period` : null;
  const forecastScore = velocity?.forecast_next_week ?? null;
  const hpsRatio = health?.hps_ratio ?? null;
  const overdueCount = health?.overdue_count ?? 0;
  const unassignedCount = health?.unassigned_count ?? 0;

  const stats = dashboardMetrics?.stats;
  const todoCount = stats?.total_todo_tasks ?? 0;
  const inProgressCount = stats?.total_in_progress_tasks ?? 0;
  const doneCount = stats?.total_completed_tasks ?? 0;
  const snapshotOverdueCount = stats?.total_overdue_tasks ?? 0;
  const totalTasks = (stats?.total_tasks ?? 0) || (todoCount + inProgressCount + doneCount + snapshotOverdueCount) || 0;
  const snapshotLoading = dashboardLoading;
  const snapshotError = dashboardError;
  const completionPct = stats?.completion_percentage ?? (totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0);

  const { data: classificationBreakdown, isLoading: classificationLoading, isError: classificationError } = useQuery({
    queryKey: ['classification-breakdown', selectedProject],
    queryFn: () => fetchClassificationBreakdown(selectedProject),
    enabled: selectedProject !== 'all' && userRole === 'Project Manager',
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

  const { data: staleWorkResponse, isLoading: staleWorkLoading, isError: staleWorkError } = useQuery({
    queryKey: ['stale-work', selectedProject],
    queryFn: () => fetchProjectStaleWork(selectedProject),
    enabled: selectedProject !== 'all' && userRole === 'Project Manager',
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

  const hasProjects = projects.length > 0;

  const handleSendChat = async () => {
    const msg = chatMessage.trim();
    if (!msg) return;
    if (selectedProject === 'all') {
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
  };

  const { data: milestones = [] } = useProjectMilestones(selectedProject !== 'all' ? selectedProject : undefined);
  const activeMilestoneId = useMemo(() => {
    if (milestones.length === 0) return null;
    const active = milestones.find((m) => m.status === 'active');
    return active ? active.id : milestones[0].id;
  }, [milestones]);
  const milestoneId = selectedMilestone ?? activeMilestoneId;
  useEffect(() => {
    if (activeMilestoneId != null && selectedMilestone === null) setSelectedMilestone(activeMilestoneId);
    if (milestones.length === 0) setSelectedMilestone(null);
  }, [activeMilestoneId, selectedMilestone, milestones.length]);

  const { data: burndown, isLoading: burndownLoading, isError: burndownError } = useQuery({
    queryKey: ['milestone-burndown', milestoneId],
    queryFn: () => fetchMilestoneBurndown(milestoneId!),
    enabled: !!milestoneId && userRole === 'Project Manager',
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
    queryFn: () => fetchProjectVelocityReport(selectedProject),
    enabled: selectedProject !== 'all' && userRole !== 'Client',
  });

  const velocityChartData =
    velocityReport?.weeks?.map((w) => ({
      week: w.week_start_date ? new Date(w.week_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `W${w.week_number}`,
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
          <h1 className="text-2xl mb-2">{userRole === 'Client' ? 'Project Dashboard' : 'Metrics & Diagnostics'}</h1>
          <p className="text-muted-foreground">
            {userRole === 'Client' ? 'Real-time project updates and health.' : 'Team velocity, health, and efficiency insights.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedProject}
            onValueChange={setSelectedProject}
            disabled={projectsLoading || projectsError || !hasProjects}
          >
            <SelectTrigger className="w-[200px] border-border bg-card">
              <SelectValue placeholder={projectsLoading ? 'Loading projects...' : 'Select project'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {userRole !== 'Client' && (
            <Button variant="outline"><Clock className="mr-2 h-4 w-4" /> Last 30 Days</Button>
          )}
          {userRole === 'Project Manager' && (
            <Button variant="outline"><UserX className="mr-2 h-4 w-4" /> Team View</Button>
          )}
        </div>
      </div>

      {/* Row 1: KPI Velocity Cards (requires single project) */}
      {userRole === 'Project Manager' && selectedProject !== 'all' && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {dashboardLoading ? (
            <div className="col-span-4 rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm">Loading KPIs...</div>
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
              <div className="text-3xl font-bold mb-1">{velocityScore ?? '—'}</div>
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
              <div className="text-3xl font-bold mb-1 text-muted-foreground">{forecastScore ?? '—'}</div>
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
              <div className="text-3xl font-bold mb-1">{hpsRatio ?? '—'}</div>
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
      {userRole !== 'Client' && selectedProject === 'all' && (
        <div className="mb-6 rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          Select a project to view velocity, burndown, and other metrics.
        </div>
      )}
      {userRole !== 'Client' && selectedProject !== 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-card border border-border rounded-lg p-6 ${userRole === 'Developer' ? 'lg:col-span-2' : ''}`}
          >
            <div className="mb-4">
              <h3 className="mb-1">Weekly Velocity Composite</h3>
              <p className="text-sm text-muted-foreground">Weighted score vs. 4-week average</p>
            </div>
            {velocityLoading && selectedProject !== 'all' ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">Loading velocity...</div>
            ) : velocityError && selectedProject !== 'all' ? (
              <div className="h-[300px] flex items-center justify-center text-destructive text-sm">Failed to load velocity</div>
            ) : selectedProject === 'all' ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">Select a project to view velocity</div>
            ) : velocityChartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">No velocity data yet</div>
            ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={velocityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="week" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="score" name="Velocity Score" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Line type="monotone" dataKey="avg" name="Rolling Avg" stroke="var(--color-success)" strokeWidth={3} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
            )}
          </motion.div>

          {userRole === 'Project Manager' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
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
              {selectedProject === 'all' ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">Select a project to view burndown</div>
              ) : burndownLoading ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">Loading burndown...</div>
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

      {/* Row 3: User Rhythm Heatmap & Diagnostics (requires single project) */}
      {userRole !== 'Client' && selectedProject !== 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-card border border-border rounded-lg p-6"
          >
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h3 className="mb-1">{userRole === 'Developer' ? 'My Productivity Rhythm' : 'Team Productivity Rhythm'}</h3>
                <p className="text-sm text-muted-foreground">Active minutes by hour block</p>
              </div>
              <div className="flex items-center gap-4">
                {userRole === 'Project Manager' && (
                  <Select value={rhythmMember} onValueChange={setRhythmMember}>
                    <SelectTrigger className="w-[180px] h-8 text-xs border-border bg-card">
                      <SelectValue placeholder="Filter member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Members (Collective)</SelectItem>
                      {rhythmMembers.map((m) => (
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
                {(userRole === 'Developer' && !user?.id) || (userRole === 'Project Manager' && selectedProject === 'all') ? (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                    {userRole === 'Project Manager' ? 'Select a project to view rhythm' : 'Sign in to view your rhythm'}
                  </div>
                ) : rhythmLoading ? (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">Loading rhythm...</div>
                ) : rhythmError ? (
                  <div className="h-[200px] flex items-center justify-center text-destructive text-sm">Failed to load rhythm</div>
                ) : userRole === 'Project Manager' && rhythmMember === 'all' && rhythmMembers.length === 0 ? (
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

          {/* Snapshots Radar/Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card border border-border rounded-lg p-6 flex flex-col"
          >
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h3 className="mb-1">{userRole === 'Developer' ? 'My Task Snapshot' : 'Team Task Snapshot'}</h3>
                <p className="text-sm text-muted-foreground">Current breakdown</p>
              </div>
              {userRole === 'Project Manager' && (
                <Select value={snapshotMember} onValueChange={setSnapshotMember} disabled>
                  <SelectTrigger className="w-[140px] h-8 text-xs border-border bg-card">
                    <SelectValue placeholder="Filter member" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectMembers.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedProject === 'all' ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Select a project to view task snapshot</div>
            ) : snapshotLoading ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Loading snapshot...</div>
            ) : snapshotError ? (
              <div className="py-8 text-center text-destructive text-sm">Failed to load snapshot</div>
            ) : (
            <>
            <div className="space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Circle className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">To Do</span>
                </div>
                <span className="text-lg font-bold">{todoCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="font-medium">In Progress</span>
                </div>
                <span className="text-lg font-bold">{inProgressCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="font-medium">Done</span>
                </div>
                <span className="text-lg font-bold">{doneCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="font-medium">Overdue</span>
                </div>
                <span className="text-lg font-bold text-destructive">{snapshotOverdueCount}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <Progress value={completionPct} className="h-2 mb-2 bg-muted [&>div]:bg-success" />
              <span className="text-xs text-muted-foreground">{completionPct}% Overall Completion</span>
            </div>
            </>
            )}
          </motion.div>
        </div>
      )}

      {/* Row 4: Git Contribution & Stale Work (requires single project) */}
      {userRole === 'Project Manager' && selectedProject !== 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Git Donut */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
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
              {selectedProject === 'all' ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Select a project to view classification</div>
              ) : classificationLoading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Loading...</div>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="lg:col-span-2 bg-card border border-border rounded-lg p-6 flex flex-col"
          >
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h3 className="mb-1">Stale Work</h3>
                <p className="text-sm text-muted-foreground">Branches with no activity in {staleWorkResponse?.threshold_days ?? 7}+ days</p>
              </div>
              {staleBranchesList.length > 0 && <Badge variant="destructive">Action Required</Badge>}
            </div>

            {selectedProject === 'all' ? (
              <div className="py-12 text-center text-muted-foreground text-sm">Select a project to view stale work</div>
            ) : staleWorkLoading ? (
              <div className="py-12 text-center text-muted-foreground text-sm">Loading stale work...</div>
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
                          {branch.author.split(' ').map(n => n[0]).join('')}
                        </div>
                        {branch.author}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${branch.daysStale > 10 ? 'bg-destructive/20 text-destructive' : 'bg-warning/20 text-warning'}`}>
                          {branch.daysStale}d
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
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
      {userRole === 'Client' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Project Health */}
            <motion.div variants={item} initial="hidden" animate="show" className="bg-card border border-border rounded-lg p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Project Health</h3>
                <p className="text-sm text-muted-foreground">Overall status of tasks and deliverables.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={healthData} cx="50%" cy="50%" innerRadius={30} outerRadius={40} dataKey="value" stroke="none">
                        {healthData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> <span className="text-sm">75% On Track</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /> <span className="text-sm">15% At Risk</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /> <span className="text-sm">10% Blocked</span></div>
                </div>
              </div>
            </motion.div>

            {/* Activity Feed */}
            <motion.div variants={item} initial="hidden" animate="show" className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>
              <div className="space-y-6">
                {activityFeed.map((activity) => (
                  <div key={activity.id} className="flex gap-4">
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
                ))}
              </div>
            </motion.div>
          </div>

          {/* AI Chat Panel */}
          <motion.div variants={item} initial="hidden" animate="show" className="bg-card border border-border rounded-lg flex flex-col h-[500px]">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Project AI Assistant</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {chatMessages.map((m, idx) => (
                <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {m.role === 'assistant' && (
                    <Avatar className="h-8 w-8 shrink-0"><AvatarFallback className="bg-primary/20 text-primary"><Bot className="h-4 w-4" /></AvatarFallback></Avatar>
                  )}
                  <div className={`p-3 rounded-xl text-sm max-w-[85%] ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted rounded-tl-none'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border">
              <div className="relative">
                <Input
                  placeholder="Ask about the project..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
                  className="pr-10 bg-input-background"
                  disabled={chatSending}
                />
                <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary" onClick={handleSendChat} disabled={chatSending || !chatMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
