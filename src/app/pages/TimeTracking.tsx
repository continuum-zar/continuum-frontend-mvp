import { motion } from 'motion/react';
import {
  Play,
  Pause,
  Square,
  Clock,
  Calendar,
  TrendingUp,
  Download,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTimeTracking } from '../context/TimeTrackingContext';
import {
  getCurrentWeekRange,
  getCurrentMonthRange,
  getDaysElapsedInMonth,
  useUserHours,
  useUserHoursByDay,
} from '@/api/hours';

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function TimeTracking() {
  const weekRange = getCurrentWeekRange();
  const monthRange = getCurrentMonthRange();
  const { data: monthHours, isLoading: monthLoading } = useUserHours(monthRange.start, monthRange.end);
  const { data: weekByDay, isLoading: weekLoading } = useUserHoursByDay(weekRange.start, weekRange.end);

  const {
    entries,
    sessionState,
    currentTime,
    tasks,
    tasksLoading,
    tasksError,
    selectedTask,
    selectedTaskId,
    setSelectedTaskId,
    isLoggingModalOpen,
    setIsLoggingModalOpen,
    logForm,
    setLogForm,
    isAiGenerating,
    simulateAiGeneration,
    handleStart,
    handlePause,
    handleResume,
    handleLogSubmit,
    handleLogCancel,
    handleStop,
    isSessionActionLoading,
  } = useTimeTracking();

  const canStartSession = Boolean(selectedTask?.project_id != null);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // This Week: total_hours from by-day (minutes, same as /hours) → hours, or sum of daily_hours[].hours
  const totalWeekHours =
    weekByDay?.total_hours != null
      ? weekByDay.total_hours / 60
      : (weekByDay?.daily_hours?.length ? weekByDay.daily_hours.reduce((sum, d) => sum + d.hours, 0) : 0);
  const weekChartData = (() => {
    const byDate = new Map(
      (weekByDay?.daily_hours ?? []).map((d) => [d.date.slice(0, 10), d.hours])
    );
    const startDate = new Date(weekRange.start + 'T00:00:00');
    return WEEKDAY_LABELS.map((day, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      return { day, hours: byDate.get(key) ?? 0 };
    });
  })();

  // This Month: total_hours from /users/me/hours (assumed in minutes for formatDuration)
  const totalMonthMinutes = monthHours?.total_hours ?? 0;
  const daysElapsed = getDaysElapsedInMonth();
  const dailyAverageHours =
    daysElapsed > 0 && totalMonthMinutes != null ? totalMonthMinutes / 60 / daysElapsed : null;

  const statsLoading = weekLoading || monthLoading;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl mb-2">Time Tracking</h1>
        <p className="text-muted-foreground">Track your work hours and analyze productivity</p>
      </div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-10 h-10">
              <Clock className="h-5 w-5 text-foreground" />
            </div>
          </div>
          <div className="text-2xl font-semibold mb-1">
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              `${totalWeekHours.toFixed(1)}h`
            )}
          </div>
          <div className="text-sm text-muted-foreground">This Week</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-10 h-10">
              <Calendar className="h-5 w-5 text-foreground" />
            </div>
          </div>
          <div className="text-2xl font-semibold mb-1">
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              formatDuration(totalMonthMinutes)
            )}
          </div>
          <div className="text-sm text-muted-foreground">This Month</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-10 h-10">
              <TrendingUp className="h-5 w-5 text-foreground" />
            </div>
          </div>
          <div className="text-2xl font-semibold mb-1">
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : dailyAverageHours != null ? (
              `${dailyAverageHours.toFixed(1)}h`
            ) : (
              '—'
            )}
          </div>
          <div className="text-sm text-muted-foreground">Daily Average</div>
        </div>
      </motion.div>

      {/* Active Timer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="bg-card border border-border rounded-lg p-6 mb-8"
      >
        <h3 className="mb-6">Active Session</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`text-4xl font-mono ${sessionState === 'running' ? 'text-primary' : 'text-muted-foreground'}`}>
              {formatTime(currentTime)}
            </div>
            <div className="space-y-2">
              {tasksLoading ? (
                <div className="h-10 w-80 rounded-md border border-input bg-muted/50 animate-pulse" />
              ) : tasksError ? (
                <p className="text-sm text-destructive">Failed to load tasks. Try again later.</p>
              ) : tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks yet. Create tasks in a project to track time.</p>
              ) : (
                <Select value={selectedTaskId || undefined} onValueChange={setSelectedTaskId} disabled={sessionState !== 'idle'}>
                  <SelectTrigger className="w-80 truncate">
                    <SelectValue placeholder="Select a task..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map(task => (
                      <SelectItem key={task.id} value={task.id} className="cursor-pointer">
                        <span className="font-medium mr-2">{task.title}</span>
                        <span className="text-muted-foreground text-xs">({task.project})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {sessionState === 'running' && (
                <Badge variant="secondary" className="animate-pulse">
                  <div className="w-2 h-2 bg-primary rounded-full mr-2" />
                  Tracking
                </Badge>
              )}
              {sessionState === 'paused' && (
                <Badge variant="outline" className="text-warning border-warning/50">
                  <div className="w-2 h-2 bg-warning rounded-full mr-2" />
                  Paused
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {sessionState === 'idle' && (
              <Button onClick={handleStart} disabled={!canStartSession || isSessionActionLoading}>
                <Play className="mr-2 h-4 w-4" />
                Start
              </Button>
            )}
            {sessionState === 'running' && (
              <Button variant="outline" onClick={handlePause} disabled={isSessionActionLoading}>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
            {sessionState === 'paused' && (
              <Button variant="outline" onClick={handleResume} className="border-primary text-primary hover:bg-primary/10" disabled={isSessionActionLoading}>
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
            )}
            {sessionState !== 'idle' && (
              <Button
                variant="destructive"
                onClick={handleStop}
                disabled={isSessionActionLoading}
              >
                <Square className="mr-2 h-4 w-4" />
                Stop
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Session Logging Modal */}
      <Dialog open={isLoggingModalOpen} onOpenChange={setIsLoggingModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Log Time Session</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Project</Label>
                <Input value={selectedTask?.project ?? ''} disabled className="bg-muted/50" />
              </div>
              <div className="grid grid-cols-[1fr,auto] gap-4">
                <div className="space-y-2">
                  <Label>Task</Label>
                  <Input value={selectedTask?.title ?? ''} disabled className="bg-muted/50 truncate" />
                </div>
                <div className="space-y-2">
                  <Label>Time Tracked</Label>
                  <Input value={formatTime(currentTime)} disabled className="font-mono bg-muted/50 w-[120px] text-center" />
                </div>
              </div>
            </div>

            <div className="space-y-2 relative mt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="desc">Work Description</Label>
                {/* AI Fill Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10 -mr-2"
                  onClick={simulateAiGeneration}
                  disabled={isAiGenerating}
                >
                  {isAiGenerating ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-1" />
                  )}
                  AI Fill from Commits
                </Button>
              </div>
              <Textarea
                id="desc"
                className="min-h-[100px] resize-none"
                placeholder="Describe the work completed during this session..."
                value={logForm.description}
                onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleLogCancel} disabled={isSessionActionLoading}>Cancel</Button>
            <Button onClick={handleLogSubmit} disabled={isSessionActionLoading}>Log Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Weekly Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.15 }}
        className="bg-card border border-border rounded-lg p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="mb-1">Weekly Overview</h3>
            <p className="text-sm text-muted-foreground">Hours tracked per day</p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weekChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
              }}
            />
            <Bar dataKey="hours" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Time Entries Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.2 }}
        className="bg-card border border-border rounded-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3>Recent Entries</h3>
          <div className="flex items-center space-x-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="mobile-app">Mobile App</SelectItem>
                <SelectItem value="dashboard-v2">Dashboard v2</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  {new Date(entry.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{entry.project}</Badge>
                </TableCell>
                <TableCell className="font-medium max-w-[200px] truncate" title={entry.task}>{entry.task}</TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-[250px] truncate" title={entry.description}>
                  {entry.description || '-'}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatDuration(entry.duration)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}
