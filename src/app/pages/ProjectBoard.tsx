import { useState, useEffect, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useParams, useNavigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import api from '../../lib/api';
import {
  Plus,
  ArrowLeft,
  MoreVertical,
  Calendar,
  Users,
  Paperclip,
  MessageSquare,
  CheckCircle2,
  CircleDot
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback } from '../components/ui/avatar';

type TaskStatus = 'todo' | 'in-progress' | 'done';
type MilestoneStatus = 'upcoming' | 'active' | 'completed' | 'overdue';

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  scope: 'XS' | 'S' | 'M' | 'L' | 'XL';
  assignees: string[];
  attachments: number;
  comments: number;
  estimatedHours?: number;
  checklists: { total: number; completed: number };
  milestoneId: string;
}

interface Milestone {
  id: string;
  name: string;
  date: string;
  status: MilestoneStatus;
  desc?: string;
}

function mapMilestoneStatus(s: string): MilestoneStatus {
  switch (s) {
    case 'in_progress': return 'active';
    case 'completed': return 'completed';
    case 'overdue': return 'overdue';
    default: return 'upcoming'; // covers not_started and anything unexpected
  }
}

const ALL_MILESTONES_ID = '';

function formatDueDate(iso: string): string {
  if (!iso) return 'No date';
  const d = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00'));
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

interface TaskCardProps {
  task: Task;
}

function TaskCard({ task }: TaskCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'task',
    item: { id: task.id, status: task.status },
    collect: (monitor) => {
      const dragging = monitor.isDragging();
      if (dragging) {
        console.log(`Dragging task ${task.id}:`, task.title);
      }
      return { isDragging: dragging };
    },
  }));

  const scopeColors = {
    XS: 'bg-green-500/10 text-green-600 dark:text-green-400',
    S: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    M: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    L: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    XL: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if dragging or if click is on interactive element
    if (isDragging || (e.target as HTMLElement).closest('button, [role="button"]')) {
      return;
    }
    // Use router navigation instead of window.location
    const taskUrl = `/tasks/${task.id}`;
    // Small delay to ensure drag operation completes
    setTimeout(() => {
      window.location.href = taskUrl;
    }, 50);
  };

  return (
    <div
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={drag as any}
      onClick={handleCardClick}
      className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:shadow-sm transition-shadow"
      style={{
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(0.95)' : 'scale(1)',
        transition: 'all 200ms ease-in-out',
      }}
    >
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-medium pr-2">{task.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {task.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 flex items-center justify-center font-bold tracking-wider rounded ${scopeColors[task.scope]}`}>
              {task.scope}
            </span>
          </div>
          <div className="flex -space-x-2">
            {task.assignees.map((assignee, i) => (
              <Avatar key={i} className="h-6 w-6 border-2 border-card">
                <AvatarFallback className="text-xs">{assignee}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>

        {(task.attachments > 0 || task.comments > 0 || task.checklists.total > 0) && (
          <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
            {task.checklists.total > 0 && (
              <div className="flex items-center">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {task.checklists.completed}/{task.checklists.total}
              </div>
            )}
            {task.attachments > 0 && (
              <div className="flex items-center">
                <Paperclip className="h-3 w-3 mr-1" />
                {task.attachments}
              </div>
            )}
            {task.comments > 0 && (
              <div className="flex items-center">
                <MessageSquare className="h-3 w-3 mr-1" />
                {task.comments}
              </div>
            )}
          </div>
        )}
      </div>
  );
}

interface ColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onMove: (taskId: string, newStatus: TaskStatus) => void;
}

function Column({ title, status, tasks, onMove }: ColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'task',
    drop: (item: { id: string; status: TaskStatus }) => {
      console.log(`Dropped task ${item.id} from ${item.status} to ${status}`);
      if (item.status !== status) {
        console.log(`Moving task ${item.id} to ${status}`);
        onMove(item.id, status);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div className="flex-1 min-w-[320px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3>{title}</h3>
          <Badge variant="secondary">{tasks.length}</Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={drop as any}
        className={`space-y-3 min-h-[600px] p-3 rounded-lg transition-colors ${isOver ? 'bg-accent/50' : 'bg-muted/30'
          }`}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

export function ProjectBoard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [project, setProject] = useState<{ name?: string; description?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const tasksRef = useRef<Task[]>([]);
  const [milestonesList, setMilestonesList] = useState<Milestone[]>([]);
  const [milestonesLoading, setMilestonesLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId || isNaN(Number(projectId))) {
        navigate('/projects');
        return;
      }
      setSelectedMilestoneId(ALL_MILESTONES_ID);
      try {
        setIsLoading(true);
        setError(null);

        const [projectRes, tasksRes, milestonesRes] = await Promise.all([
          api.get(`/projects/${projectId}`),
          api.get(`/tasks/?project_id=${projectId}`),
          api.get(`/projects/${projectId}/milestones`),
        ]);

        console.log('API responses received');
        console.log('tasksRes.data:', tasksRes.data);

        setProject(projectRes.data);

        const mappedTasks: Task[] = tasksRes.data.map((t: { id: number; title?: string; description?: string; status?: string; scope_weight?: 'XS' | 'S' | 'M' | 'L' | 'XL'; assigned_to?: number; attachment_count?: number; comment_count?: number; checklists?: { done?: boolean }[]; milestone_id?: number }) => {
          let totalChecklists = 0;
          let completedChecklists = 0;
          if (t.checklists && Array.isArray(t.checklists)) {
            totalChecklists = t.checklists.length;
            completedChecklists = t.checklists.filter((c) => c.done).length;
          }

          return {
            id: String(t.id),
            title: t.title || '',
            description: t.description || '',
            status: t.status === 'in_progress' ? 'in-progress' : (t.status || 'todo'),
            scope: t.scope_weight || 'M',
            assignees: t.assigned_to ? [String(t.assigned_to)] : [],
            attachments: t.attachment_count || 0,
            comments: t.comment_count || 0,
            checklists: { total: totalChecklists, completed: completedChecklists },
            milestoneId: t.milestone_id ? String(t.milestone_id) : '',
          };
        });

        console.log('Mapped tasks:', mappedTasks);
        tasksRef.current = mappedTasks;
        setTasks(mappedTasks);
        console.log('setTasks called with', mappedTasks.length, 'tasks');

        const mappedMilestones: Milestone[] = (milestonesRes.data ?? []).map((m: { id: number; name?: string; due_date?: string; status?: string; description?: string }) => ({
          id: String(m.id),
          name: m.name ?? '',
          date: formatDueDate(m.due_date ?? ''),
          status: mapMilestoneStatus(m.status ?? ''),
          desc: m.description || undefined,
        }));
        setMilestonesList([{ id: ALL_MILESTONES_ID, name: 'All tasks', date: '', status: 'active', desc: '' }, ...mappedMilestones]);
        setMilestonesLoading(false);
      } catch (err: unknown) {
        setTasks([]);
        if ((err as { response?: { status?: number } })?.response?.status === 404) {
          setError('Project not found');
        } else {
          setError('Failed to load project details or tasks');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [projectId, navigate, location.key, refetchTrigger]);

  // Dialog State
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ name: '', desc: '', date: '' });

  // Team Modal State
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [teamMembers, setTeamMembers] = useState<Array<{ id: number; name: string; email: string; role: string; initials: string }>>([]);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);
  const [teamMembersError, setTeamMembersError] = useState<string | null>(null);

  // Fetch project members when Team modal opens
  useEffect(() => {
    if (!isTeamModalOpen || !projectId) return;
    const projectIdNum = Number(projectId);
    if (!Number.isInteger(projectIdNum)) return;

    let cancelled = false;
    setTeamMembersError(null);
    setTeamMembersLoading(true);

    api
      .get<Array<{
        id: number;
        user_id: number;
        role: string;
        user?: { first_name?: string; last_name?: string; email?: string };
        first_name?: string;
        last_name?: string;
        email?: string;
      }>>(`/projects/${projectIdNum}/members`)
      .then((res) => {
        if (cancelled) return;
        const list = res.data ?? [];
        const mapped = list.map((m) => {
          const user = m.user;
          const firstName = user?.first_name ?? m.first_name ?? '';
          const lastName = user?.last_name ?? m.last_name ?? '';
          const name = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
          const email = user?.email ?? m.email ?? '';
          const initials = [firstName, lastName].map((s) => (s && s[0]) || '').join('').toUpperCase().slice(0, 2) || (email ? email[0].toUpperCase() : '?');
          return {
            id: m.id,
            name,
            email,
            role: m.role ?? 'member',
            initials,
          };
        });
        setTeamMembers(mapped);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = (err as { response?: { data?: { detail?: string }; status?: number } })?.response?.data?.detail;
        const fallback = (err as { message?: string })?.message ?? 'Failed to load team members';
        const errorMsg = typeof message === 'string' ? message : fallback;
        setTeamMembersError(errorMsg);
        setTeamMembers([]);
        toast.error(errorMsg);
      })
      .finally(() => {
        if (!cancelled) setTeamMembersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isTeamModalOpen, projectId]);

  const handleInvite = () => {
    if (!inviteEmail) return;
    setTeamMembers((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: 'Pending Invite',
        email: inviteEmail,
        role: inviteRole,
        initials: inviteEmail[0].toUpperCase()
      }
    ]);
    setInviteEmail('');
    setInviteRole('Member');
  };

  const [selectedMilestoneId, setSelectedMilestoneId] = useState(ALL_MILESTONES_ID);
  const pendingMoveRef = useRef<Set<string>>(new Set());

  // Auto-select first active/upcoming milestone once milestones load
  useEffect(() => {
    if (milestonesList.length > 0 && !selectedMilestoneId) {
      const initial = milestonesList.find(m => m.status === 'active') || milestonesList[0];
      setSelectedMilestoneId(initial.id);
    }
  }, [milestonesList, selectedMilestoneId]);

  // Refetch tasks when returning from task creation
  useEffect(() => {
    const state = location.state as { newTaskCreated?: boolean; taskId?: number } | null;
    if (state?.newTaskCreated) {
      // Trigger a refetch by incrementing refetchTrigger
      setRefetchTrigger(prev => prev + 1);
      // Clear the state so we don't refetch multiple times
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleCreateMilestone = async () => {
    if (!newMilestone.name || !newMilestone.date || !projectId) return;

    try {
      // Send POST request to create milestone on backend
      const response = await api.post('/milestones/', {
        project_id: Number(projectId),
        name: newMilestone.name,
        due_date: newMilestone.date, // Send as YYYY-MM-DD
        description: newMilestone.desc || undefined,
      });

      // Map the response to frontend format
      const createdMilestone: Milestone = {
        id: String(response.data.id),
        name: response.data.name,
        date: formatDueDate(response.data.due_date),
        status: mapMilestoneStatus(response.data.status || 'upcoming'),
        desc: response.data.description || undefined,
      };

      // Add to list and sort chronologically; keep "All tasks" sentinel first
      const sentinel = milestonesList.find((m) => m.id === ALL_MILESTONES_ID);
      const rest = milestonesList.filter((m) => m.id !== ALL_MILESTONES_ID);
      const sortedRest = [...rest, createdMilestone].sort((a, b) => {
        const ta = new Date(a.date || '').getTime();
        const tb = new Date(b.date || '').getTime();
        return (Number.isNaN(ta) ? 0 : ta) - (Number.isNaN(tb) ? 0 : tb);
      });
      const updated = sentinel ? [sentinel, ...sortedRest] : sortedRest;

      setMilestonesList(updated);
      setIsAddMilestoneOpen(false);
      setNewMilestone({ name: '', desc: '', date: '' });
      setSelectedMilestoneId(createdMilestone.id);

      toast.success('Milestone created successfully');
    } catch (err: unknown) {
      console.error('Failed to create milestone:', err);
      type ErrShape = { response?: { data?: { detail?: string | Array<{ msg?: string }>; message?: string }; message?: string }; message?: string };
      const data = (err as ErrShape)?.response?.data;
      const detail = data?.detail;
      let errorMessage: string =
        data?.message ?? (err as ErrShape).message ?? 'Failed to create milestone';
      if (typeof detail === 'string' && detail) {
        errorMessage = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        const messages = detail
          .map((d: { msg?: string }) => (d?.msg != null ? d.msg : String(d)))
          .filter(Boolean);
        if (messages.length > 0) errorMessage = messages.join('. ');
      }
      toast.error(errorMessage);
      // Dialog stays open on error; user can fix validation errors and retry
    }
  };

  const handleMove = async (taskId: string, newStatus: TaskStatus) => {
    if (pendingMoveRef.current.has(taskId)) return;
    const taskToMove = tasks.find(t => t.id === taskId);
    if (!taskToMove) return;
    const oldStatus = taskToMove.status;

    pendingMoveRef.current.add(taskId);

    setTasks((prevTasks) => {
      const next = prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      tasksRef.current = next;
      return next;
    });

    const backendStatus = newStatus === 'in-progress' ? 'in_progress' : newStatus;

    try {
      await api.patch(`/tasks/${taskId}/status`, { status: backendStatus });
      toast.success(`Task moved to ${newStatus}`);
    } catch (err: unknown) {
      console.error('Failed to move task:', err);
      setTasks((prevTasks) => {
        const reverted = prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: oldStatus } : task
        );
        tasksRef.current = reverted;
        return reverted;
      });
      toast.error('Failed to update task status. Please try again.');
    } finally {
      pendingMoveRef.current.delete(taskId);
    }
  };

  const filteredTasks =
    selectedMilestoneId === ALL_MILESTONES_ID
      ? tasks
      : tasks.filter((t) => t.milestoneId === selectedMilestoneId);
  const todoTasks = filteredTasks.filter((t) => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in-progress');
  const doneTasks = filteredTasks.filter((t) => t.status === 'done');

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center justify-between">
          <div>
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-8 bg-muted rounded w-64"></div>
                <div className="h-4 bg-muted rounded w-96"></div>
              </div>
            ) : error ? (
              <div className="text-destructive font-medium mt-2">{error}</div>
            ) : (
              <>
                <h1 className="text-2xl mb-1 mt-1 capitalize">{project?.name || `Project ${projectId}`}</h1>
                <p className="text-muted-foreground">{project?.description || 'Track progress and manage tasks for the project'}</p>
              </>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Dialog open={isTeamModalOpen} onOpenChange={setIsTeamModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Team
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Project Team</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Add new member</h4>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Email address..."
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                        className="bg-input-background flex-1"
                      />
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger className="w-[140px] bg-input-background">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Member">Member</SelectItem>
                          <SelectItem value="Project Manager">Project Manager</SelectItem>
                          <SelectItem value="Developer">Developer</SelectItem>
                          <SelectItem value="Designer">Designer</SelectItem>
                          <SelectItem value="Client">Client</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleInvite} disabled={!inviteEmail}>Invite</Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Current Members ({teamMembers.length})</h4>
                    <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
                      {teamMembersLoading ? (
                        <div className="space-y-3 py-2">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                              <div className="flex-1 space-y-1">
                                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                                <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : teamMembersError ? (
                        <p className="text-sm text-destructive py-2">{teamMembersError}</p>
                      ) : teamMembers.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">No members yet.</p>
                      ) : (
                        teamMembers.map((member) => (
                          <div key={member.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8 border border-border">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">{member.initials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium leading-none mb-1">{member.name}</p>
                                <p className="text-xs text-muted-foreground">{member.email}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-[10px] font-normal">{member.role}</Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button
                onClick={() => navigate("/tasks/new", { state: { projectId, milestoneId: selectedMilestoneId } })}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
          </div>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-semibold mb-1">{filteredTasks.length}</div>
          <div className="text-sm text-muted-foreground">Total Tasks</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-semibold mb-1">{doneTasks.length}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-semibold mb-1">{inProgressTasks.length}</div>
          <div className="text-sm text-muted-foreground">In Progress</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-semibold mb-1">
            {filteredTasks.length > 0
              ? Math.round((doneTasks.length / filteredTasks.length) * 100)
              : 0}%
          </div>
          <div className="text-sm text-muted-foreground">Milestone Progress</div>
        </div>
      </div>

      {/* Milestone Timeline */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-muted-foreground text-sm font-bold tracking-widest uppercase">Milestone Timeline</h3>
          <Dialog open={isAddMilestoneOpen} onOpenChange={setIsAddMilestoneOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Milestone
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Milestone</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Milestone Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Phase 2: Beta Launch"
                    value={newMilestone.name}
                    onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Target Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newMilestone.date}
                    onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Description (Optional)</Label>
                  <Textarea
                    id="desc"
                    placeholder="Brief objective summary..."
                    value={newMilestone.desc}
                    onChange={(e) => setNewMilestone({ ...newMilestone, desc: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddMilestoneOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateMilestone} disabled={!newMilestone.name || !newMilestone.date}>Create Milestone</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="bg-card border border-border rounded-lg p-6 overflow-x-auto relative min-h-[160px]">

          {/* Loading skeleton */}
          {milestonesLoading && (
            <div className="flex items-start gap-8 min-w-[800px] relative pt-2 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="h-3 bg-muted rounded w-24" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!milestonesLoading && milestonesList.length === 0 && (
            <div className="flex flex-col items-center justify-center h-28 text-muted-foreground">
              <Calendar className="w-6 h-6 mb-2 opacity-40" />
              <p className="text-sm">No milestones yet. Add one to get started.</p>
            </div>
          )}

          {/* Milestone nodes */}
          {!milestonesLoading && milestonesList.length > 0 && (
            <div className="flex items-start min-w-[800px] relative pt-2">

              {/* Horizontal Connecting Line */}
              <div className="absolute top-7 left-[5%] right-[5%] h-[2px] bg-border -z-0" />

              {milestonesList.map((milestone) => {
                const isSelected = selectedMilestoneId === milestone.id;
                const isCompleted = milestone.status === 'completed';
                const isActive = milestone.status === 'active';
                const isOverdue = milestone.status === 'overdue';

                return (
                  <div
                    key={milestone.id}
                    className={`flex-1 flex flex-col items-center relative z-10 cursor-pointer group px-2 text-center transition-all ${isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                    onClick={() => setSelectedMilestoneId(milestone.id)}
                  >
                    {/* Timeline Node */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 transition-colors relative bg-card ${isCompleted
                      ? 'border-2 border-foreground text-foreground'
                      : isOverdue
                        ? 'border-2 border-destructive text-destructive'
                        : isActive || isSelected
                          ? 'border-2 border-foreground bg-card text-foreground'
                          : 'border-2 border-muted bg-card text-muted-foreground'
                      }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isActive || isSelected ? (
                        <CircleDot className="w-5 h-5" />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                      )}
                    </div>

                    {/* Content */}
                    <h4 className="text-sm font-semibold mb-1 text-foreground">
                      {milestone.name}
                    </h4>
                    <div className={`text-xs mb-2 flex items-center justify-center gap-1 font-mono ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                      <Calendar className="w-3 h-3" />
                      {milestone.date}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 px-4">
                      {milestone.desc || 'No description provided.'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <DndProvider backend={HTML5Backend}>
        <div className="flex gap-6 overflow-x-auto pb-4">
          <Column
            title="To Do"
            status="todo"
            tasks={todoTasks}
            onMove={handleMove}
          />
          <Column
            title="In Progress"
            status="in-progress"
            tasks={inProgressTasks}
            onMove={handleMove}
          />
          <Column
            title="Done"
            status="done"
            tasks={doneTasks}
            onMove={handleMove}
          />
        </div>
      </DndProvider>
    </div>
  );
}
