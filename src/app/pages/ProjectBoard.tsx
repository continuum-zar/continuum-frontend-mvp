import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Link, useParams, useNavigate } from 'react-router';
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



const ALL_MILESTONES_ID = '';
const initialMilestones = [
  { id: ALL_MILESTONES_ID, name: 'All tasks', date: '', status: 'active', desc: '' },
];

interface TaskCardProps {
  task: Task;
}

function TaskCard({ task }: TaskCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'task',
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const scopeColors = {
    XS: 'bg-green-500/10 text-green-600 dark:text-green-400',
    S: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    M: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    L: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    XL: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };

  return (
    <Link to={`/tasks/${task.id}`}>
      <motion.div
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={drag as any}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: isDragging ? 0.5 : 1, scale: 1 }}
        className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:shadow-sm transition-shadow"
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
      </motion.div>
    </Link>
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
      if (item.status !== status) {
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
  const [project, setProject] = useState<{ name?: string; description?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestonesList, setMilestonesList] = useState(initialMilestones);

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

        const [projectRes, tasksRes] = await Promise.all([
          api.get(`/projects/${projectId}`),
          api.get(`/tasks/?project_id=${projectId}`)
        ]);

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

        setTasks(mappedTasks);

        try {
          const milestonesRes = await api.get(`/projects/${projectId}/milestones`);
          const apiMilestones = (milestonesRes.data as { id: number; name?: string; due_date?: string; status?: string; display_status?: string; description?: string }[]) ?? [];
          const mappedMilestones = apiMilestones.map((m) => ({
            id: String(m.id),
            name: m.name || '',
            date: m.due_date
              ? new Date(m.due_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
              : '',
            status: (m.display_status ?? (m.status === 'completed' ? 'completed' : m.status === 'in_progress' ? 'active' : 'upcoming')) as 'completed' | 'active' | 'upcoming',
            desc: m.description || '',
          }));
          setMilestonesList([{ id: ALL_MILESTONES_ID, name: 'All tasks', date: '', status: 'active', desc: '' }, ...mappedMilestones]);
        } catch {
          setMilestonesList([{ id: ALL_MILESTONES_ID, name: 'All tasks', date: '', status: 'active', desc: '' }]);
        }
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
  }, [projectId, navigate]);

  // Dialog State
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ name: '', desc: '', date: '' });

  // Team Modal State
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'Sarah Anderson', email: 'sarah@example.com', role: 'Project Manager', initials: 'SA' },
    { id: 2, name: 'Mike Torres', email: 'mike@example.com', role: 'Developer', initials: 'MT' },
    { id: 3, name: 'Emily Wang', email: 'emily@example.com', role: 'Designer', initials: 'EW' },
  ]);

  const handleInvite = () => {
    if (!inviteEmail) return;
    setTeamMembers([
      ...teamMembers,
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

  const handleCreateMilestone = () => {
    if (!newMilestone.name || !newMilestone.date) return;

    // Parse the input HTML date YYYY-MM-DD
    const dateObj = new Date(newMilestone.date + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    const newM = {
      id: `m${Date.now()}`,
      name: newMilestone.name,
      desc: newMilestone.desc,
      date: formattedDate,
      status: 'upcoming'
    };

    // Add to list and sort chronologically
    const updated = [...milestonesList, newM].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    setMilestonesList(updated);
    setIsAddMilestoneOpen(false);
    setNewMilestone({ name: '', desc: '', date: '' });
    setSelectedMilestoneId(newM.id);
  };

  const handleMove = async (taskId: string, newStatus: TaskStatus) => {
    // 1. Find the task to get its current (old) status for reversion
    const taskToMove = tasks.find(t => t.id === taskId);
    if (!taskToMove) return;
    const oldStatus = taskToMove.status;

    // 2. Optimistic local update
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    // 3. Map frontend status to backend status
    const backendStatus = newStatus === 'in-progress' ? 'in_progress' : newStatus;

    // 4. Send PATCH request to backend
    try {
      await api.patch(`/tasks/${taskId}`, { status: backendStatus });
      // Optionally show a success toast if you want, but usually silent success is better for DND
      // toast.success(`Task moved to ${newStatus}`);
    } catch (err: any) {
      console.error('Failed to move task:', err);
      // 5. Revert the optimistic update on error
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: oldStatus } : task
        )
      );
      toast.error('Failed to update task status. Please try again.');
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
                      {teamMembers.map((member) => (
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
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Link to="/tasks/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </Link>
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

          <div className="flex items-start min-w-[800px] relative pt-2">

            {/* Horizontal Connecting Line */}
            <div className="absolute top-7 left-[5%] right-[5%] h-[2px] bg-border -z-0" />

            {milestonesList.map((milestone) => {
              const isSelected = selectedMilestoneId === milestone.id;
              const isCompleted = milestone.status === 'completed';
              const isActive = milestone.status === 'active';

              return (
                <div
                  key={milestone.id}
                  className={`flex-1 flex flex-col items-center relative z-10 cursor-pointer group px-2 text-center transition-all ${isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                  onClick={() => setSelectedMilestoneId(milestone.id)}
                >
                  {/* Timeline Node */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 transition-colors relative bg-card ${isCompleted
                    ? 'border-2 border-foreground text-foreground'
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
                  <h4 className={`text-sm font-semibold mb-1 text-foreground`}>
                    {milestone.name}
                  </h4>
                  <div className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1 font-mono">
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
    </div >
  );
}
