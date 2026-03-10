import { useState } from 'react';
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
import { useProjects, fetchProjectDashboard } from '@/api';
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

// 1. Velocity & Efficiency Trends
const velocityData = [
  { week: 'W1', score: 65, avg: 60, tasks: 45, hours: 38, commits: 15 },
  { week: 'W2', score: 72, avg: 63, tasks: 52, hours: 42, commits: 18 },
  { week: 'W3', score: 68, avg: 65, tasks: 48, hours: 40, commits: 16 },
  { week: 'W4', score: 85, avg: 72, tasks: 65, hours: 48, commits: 22 },
  { week: 'W5', score: 92, avg: 76, tasks: 72, hours: 52, commits: 25 },
];

// 2. Milestone Burndown
const burndownData = [
  { date: 'Feb 01', actual: 120, ideal: 120 },
  { date: 'Feb 05', actual: 105, ideal: 100 },
  { date: 'Feb 10', actual: 95, ideal: 80 },
  { date: 'Feb 15', actual: 65, ideal: 60 },
  { date: 'Feb 20', actual: 45, ideal: 40 },
  { date: 'Feb 25', actual: null, ideal: 20 },
  { date: 'Mar 01', actual: null, ideal: 0 },
];

// 3. Git Contribution Breakdown
const gitCommitsData = [
  { name: 'Structural', value: 35, color: '#3b82f6' },  // blue
  { name: 'Incremental', value: 50, color: '#10b981' }, // emerald
  { name: 'Trivial', value: 15, color: '#64748b' },     // slate
];

// 4. User Rhythm / Productivity Heatmap (Mocked as daily hour buckets for current week)
// Days: 0 (Mon) to 4 (Fri). Hours: 8 to 18 (9am to 7pm)
const rhythmData = Array.from({ length: 5 }, (_, dayIndex) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dayRhythm: any = { day: days[dayIndex] };
  for (let h = 8; h <= 18; h++) {
    // Randomize activity, peaks between 10-12 and 14-16
    const isPeak = (h >= 10 && h <= 12) || (h >= 14 && h <= 16);
    dayRhythm[`hour${h}`] = isPeak ? Math.floor(Math.random() * 40) + 20 : Math.floor(Math.random() * 20);
  }
  return dayRhythm;
});

// 5. Diagnostics
const staleBranches = [
  { id: 1, name: 'feature/payment-gateway', author: 'Mike Torres', daysStale: 12 },
  { id: 2, name: 'fix/auth-callback', author: 'Sarah Chen', daysStale: 8 },
  { id: 3, name: 'refactor/database-models', author: 'Alex Johnson', daysStale: 7 },
];

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
  const [rhythmMember, setRhythmMember] = useState("all");
  const [snapshotMember, setSnapshotMember] = useState("all");
  const [chatMessage, setChatMessage] = useState("");
  const { data: projects = [], isLoading: projectsLoading, isError: projectsError } = useProjects();

  const { data: dashboardMetrics, isLoading: dashboardLoading, isError: dashboardError } = useQuery({
    queryKey: ['project-dashboard', selectedProject],
    queryFn: () => fetchProjectDashboard(selectedProject),
    enabled: selectedProject !== 'all' && userRole === 'Project Manager',
  });

  const health = dashboardMetrics?.health;
  const velocity = dashboardMetrics?.velocity;
  const velocityScore = velocity?.trend?.velocity_score ?? (velocity?.weeks?.length ? velocity.weeks[velocity.weeks.length - 1].velocity_score : null);
  const velocityDelta = velocity?.trend?.change_percentage != null ? `${velocity.trend.change_percentage > 0 ? '+' : ''}${velocity.trend.change_percentage}% from last period` : null;
  const forecastScore = velocity?.forecast_next_week ?? null;
  const hpsRatio = health?.hps_ratio ?? null;
  const overdueCount = health?.overdue_count ?? 0;
  const unassignedCount = health?.unassigned_count ?? 0;

  const hasProjects = projects.length > 0;

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

      {/* Row 2: Charts (Velocity & Burndown) */}
      {userRole !== 'Client' && (
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
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={velocityData}>
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
          </motion.div>

          {userRole === 'Project Manager' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="mb-4">
                <h3 className="mb-1">Milestone Burndown</h3>
                <p className="text-sm text-muted-foreground">Remaining scope points towards deadline</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={burndownData}>
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
            </motion.div>
          )}
        </div>
      )}

      {/* Row 3: User Rhythm Heatmap & Diagnostics */}
      {userRole !== 'Client' && (
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
                      {projectMembers.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
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
                <div className="flex flex-col gap-1">
                  {rhythmData.map((dayRow, idx) => (
                    <div key={idx} className="flex items-center">
                      <div className="w-[40px] text-xs font-medium text-muted-foreground">
                        {dayRow.day}
                      </div>
                      <div className="flex-1 flex gap-1">
                        {Array.from({ length: 11 }, (_, i) => i + 8).map(hour => (
                          <div
                            key={hour}
                            className={`flex-1 aspect-square rounded-sm ${getHeatmapColor(dayRow[`hour${hour}`])}`}
                            title={`${dayRow.day} ${hour}:00 - ${dayRow[`hour${hour}`]} mins`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
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
                <Select value={snapshotMember} onValueChange={setSnapshotMember}>
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

            <div className="space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Circle className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">To Do</span>
                </div>
                <span className="text-lg font-bold">24</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="font-medium">In Progress</span>
                </div>
                <span className="text-lg font-bold">18</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="font-medium">Done</span>
                </div>
                <span className="text-lg font-bold">142</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="font-medium">Overdue</span>
                </div>
                <span className="text-lg font-bold text-destructive">4</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <Progress value={65} className="h-2 mb-2 bg-muted [&>div]:bg-success" />
              <span className="text-xs text-muted-foreground">65% Overall Completion</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Row 4: Git Contribution & Stale Work */}
      {userRole === 'Project Manager' && (
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
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gitCommitsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {gitCommitsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-36px]">
                <span className="text-3xl font-bold">100</span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
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
                <p className="text-sm text-muted-foreground">Branches with no activity in 7+ days</p>
              </div>
              <Badge variant="destructive">Action Required</Badge>
            </div>

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
                  {staleBranches.map((branch) => (
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
              <div className="flex gap-3">
                <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/20 text-primary"><Bot className="h-4 w-4" /></AvatarFallback></Avatar>
                <div className="bg-muted p-3 rounded-xl rounded-tl-none text-sm max-w-[85%]">
                  Hello! I'm your Continuum assistant. Ask me anything about the project's progress, invoices, or recent activities.
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border">
              <div className="relative">
                <Input
                  placeholder="Ask about the project..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="pr-10 bg-input-background"
                />
                <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary">
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
