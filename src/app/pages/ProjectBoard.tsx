import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useParams, useNavigate, useLocation } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  ArrowLeft,
  MoreVertical,
  Calendar,
  Users,
  Paperclip,
  MessageSquare,
  CheckCircle2,
  CircleDot,
  GripVertical,
  GitBranch,
  Trash2,
  Loader2,
  Search,
} from 'lucide-react';
import type { Task, TaskStatus } from '@/types/task';
import type { Milestone } from '@/types/milestone';
import type { Repository } from '@/types/repository';
import type { RepositoryProvider } from '@/types/repository';
import {
  useProject,
  useProjectTasks,
  useProjectMilestones,
  useProjectMembers,
  useUpdateTaskStatus,
  useCreateMilestone,
  useAddMember,
  useProjectRepositories,
  useLinkRepository,
  useUnlinkRepository,
  useWikiScanStatus,
  useScanRepository,
  projectKeys,
  mapMilestone,
  fetchTask,
  getApiErrorMessage,
} from '@/api';
import { useRole } from '@/app/context/RoleContext';
import { toast } from 'sonner';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

interface TaskCardProps {
  task: Task;
}

const TASK_DETAIL_QUERY_KEY = ['tasks', 'detail'] as const;

function TaskCard({ task }: TaskCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const didDragRef = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const prefetchTaskDetail = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: [...TASK_DETAIL_QUERY_KEY, task.id],
      queryFn: () => fetchTask(task.id),
    });
  }, [queryClient, task.id]);

  useEffect(() => {
    prefetchTaskDetail();
  }, [prefetchTaskDetail]);

  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    type: 'task',
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    end: () => {
      didDragRef.current = true;
      setTimeout(() => { didDragRef.current = false; }, 100);
    },
  }));

  const setCardRef = (node: HTMLDivElement | null) => {
    (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    dragPreview(node);
  };

  const scopeColors = {
    XS: 'bg-green-500/10 text-green-600 dark:text-green-400',
    S: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    M: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    L: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    XL: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (didDragRef.current || (e.target as HTMLElement).closest('button, [role="button"], [data-drag-handle]')) {
      return;
    }
    const taskUrl = `/tasks/${task.id}`;
    navigate(taskUrl);
  };

  return (
    <div
      ref={setCardRef}
      className="bg-card border border-border rounded-lg p-4 transition-shadow flex flex-col gap-3"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : undefined,
      }}
      onMouseEnter={prefetchTaskDetail}
    >
        <div className="flex items-start justify-between gap-2 mb-0">
          <div
            data-drag-handle
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={drag as any}
            className="touch-none cursor-grab active:cursor-grab shrink-0 mt-0.5 p-1 -ml-1 rounded hover:bg-muted/50 text-muted-foreground"
            onClick={(e) => e.stopPropagation()}
            title="Drag to move"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <h4 className="font-medium flex-1 min-w-0 cursor-pointer pr-2" onClick={handleCardClick}>{task.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" aria-label="Task menu">
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

        <div className="cursor-pointer flex-1 min-h-0" onClick={handleCardClick}>
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
      </div>
  );
}

interface ColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onMove: (taskId: string, newStatus: TaskStatus) => void;
}

const TASK_CARD_ESTIMATE_HEIGHT = 140;
const COLUMN_LIST_HEIGHT = 560;

function Column({ title, status, tasks, onMove }: ColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
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

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => TASK_CARD_ESTIMATE_HEIGHT,
    overscan: 3,
  });

  const columnAccent =
    status === 'todo'
      ? 'border-muted-foreground/40'
      : status === 'in-progress'
        ? 'border-primary'
        : 'border-success';

  return (
    <div
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={drop as any}
      className={`flex-1 min-w-[320px] border-l-4 rounded pl-3 ${columnAccent} min-h-[640px] rounded-lg transition-colors ${isOver ? 'bg-accent/30' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3>{title}</h3>
          <Badge variant="secondary">{tasks.length}</Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Add task">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={scrollRef}
        className="overflow-auto p-3 rounded-lg bg-muted/30 space-y-3"
        style={{ height: COLUMN_LIST_HEIGHT }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const task = tasks[virtualItem.index];
            return (
              <div
                key={task.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="pb-3"
              >
                <TaskCard task={task} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ProjectBoard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const { role } = useRole();
  const projectQuery = useProject(projectId);
  const tasksQuery = useProjectTasks(projectId);
  const milestonesQuery = useProjectMilestones(projectId);
  const updateStatusMutation = useUpdateTaskStatus(projectId);
  const createMilestoneMutation = useCreateMilestone(projectId);
  const addMemberMutation = useAddMember(projectId);
  const repositoriesQuery = useProjectRepositories(projectId);
  const linkRepositoryMutation = useLinkRepository(projectId);
  const unlinkRepositoryMutation = useUnlinkRepository(projectId);
  const wikiScanStatusQuery = useWikiScanStatus(projectId);
  const scanRepositoryMutation = useScanRepository(projectId);

  const project = projectQuery.data ?? null;
  const isLoading = projectQuery.isLoading || tasksQuery.isLoading;
  const error = projectQuery.error
    ? (projectQuery.error as { response?: { status?: number } })?.response?.status === 404
      ? 'Project not found'
      : 'Failed to load project details or tasks'
    : null;

  const tasks: Task[] = tasksQuery.data ?? [];
  const milestonesList = useMemo<Milestone[]>(() => {
    const list = milestonesQuery.data ?? [];
    return [...list].sort((a, b) => {
      const tA = new Date(a.date).getTime();
      const tB = new Date(b.date).getTime();
      if (Number.isNaN(tA) && Number.isNaN(tB)) return 0;
      if (Number.isNaN(tA)) return 1;
      if (Number.isNaN(tB)) return -1;
      return tA - tB;
    });
  }, [milestonesQuery.data]);
  const milestonesLoading = milestonesQuery.isLoading;

  useEffect(() => {
    if (!projectId || isNaN(Number(projectId))) {
      navigate('/projects');
      return;
    }
  }, [projectId, navigate]);

  useEffect(() => {
    const state = location.state as { newTaskCreated?: boolean } | null;
    if (state?.newTaskCreated && projectId) {
      queryClient.invalidateQueries({ queryKey: projectKeys.tasks(projectId) });
      window.history.replaceState({}, document.title);
    }
  }, [location.state, projectId, queryClient]);

  const PREFETCH_TASK_DETAIL_COUNT = 5;
  useEffect(() => {
    const taskList = tasksQuery.data;
    if (!taskList?.length) return;
    const firstFew = taskList.slice(0, PREFETCH_TASK_DETAIL_COUNT);
    firstFew.forEach((t) => {
      queryClient.prefetchQuery({
        queryKey: ['tasks', 'detail', t.id],
        queryFn: () => fetchTask(t.id),
      });
    });
  }, [tasksQuery.data, queryClient]);

  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ name: '', desc: '', date: '' });

  const [isAddRepoOpen, setIsAddRepoOpen] = useState(false);
  const [newRepo, setNewRepo] = useState({
    repository_url: '',
    repository_name: '',
    provider: 'github' as RepositoryProvider,
    webhook_secret: '',
    api_token: '',
  });
  const [unlinkRepoId, setUnlinkRepoId] = useState<number | null>(null);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [inviteError, setInviteError] = useState<string | null>(null);

  const membersQuery = useProjectMembers(projectId, { enabled: isTeamModalOpen });
  const teamMembers = membersQuery.data ?? [];
  const teamMembersLoading = membersQuery.isLoading;
  const teamMembersError = membersQuery.error
    ? String((membersQuery.error as { message?: string })?.message ?? 'Failed to load team members')
    : null;

  const inviteRoleToBackend = (label: string): string => {
    if (label === 'Project Manager') return 'manager';
    if (label === 'Client') return 'client';
    return 'member';
  };

  const handleInvite = () => {
    const email = inviteEmail?.trim();
    if (!email || !projectId) return;
    setInviteError(null);
    addMemberMutation.mutate(
      { email, role: inviteRoleToBackend(inviteRole) },
      {
        onSuccess: () => {
          setInviteEmail('');
          setInviteRole('Member');
        },
        onError: (err: unknown) => {
          const status = (err as { response?: { status?: number } })?.response?.status;
          let fallback = 'Failed to add member';
          if (status === 404) fallback = 'User not found. They must have an account with this email.';
          else if (status === 409) fallback = 'User is already a member of this project.';
          setInviteError(getApiErrorMessage(err, fallback));
        },
      }
    );
  };

  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const pendingMoveRef = useRef<Set<string>>(new Set());
  const previouslyScanningRepoIdsRef = useRef<Set<number>>(new Set());

  // Toast when a repo finishes indexing (polling sees is_scanning flip to false)
  useEffect(() => {
    const data = wikiScanStatusQuery.data;
    if (!data) return;
    const nowScanning = new Set(data.filter((s) => s.is_scanning).map((s) => s.repository_id));
    const prev = previouslyScanningRepoIdsRef.current;
    const finished = [...prev].filter((id) => !nowScanning.has(id));
    if (finished.length > 0) {
      toast.success(
        finished.length === 1
          ? 'Repository indexing complete. You can create tasks from AI with code context.'
          : `${finished.length} repositories finished indexing.`
      );
    }
    previouslyScanningRepoIdsRef.current = nowScanning;
  }, [wikiScanStatusQuery.data]);

  useEffect(() => {
    setSelectedMilestoneId('');
  }, [projectId]);

  useEffect(() => {
    if (milestonesList.length > 0 && !selectedMilestoneId) {
      const firstNonCompleted = milestonesList.find(m => m.status !== 'completed');
      const initial = firstNonCompleted ?? milestonesList[0];
      setSelectedMilestoneId(initial.id);
    }
  }, [milestonesList, selectedMilestoneId]);

  const handleCreateMilestone = async () => {
    if (!newMilestone.name || !newMilestone.date || !projectId) return;
    try {
      const data = await createMilestoneMutation.mutateAsync({
        name: newMilestone.name,
        due_date: newMilestone.date,
        description: newMilestone.desc || undefined,
      });
      const createdMilestone = mapMilestone(data);
      setIsAddMilestoneOpen(false);
      setNewMilestone({ name: '', desc: '', date: '' });
      setSelectedMilestoneId(createdMilestone.id);
    } catch {
      // Toast handled in hook
    }
  };

  const handleLinkRepository = () => {
    if (!newRepo.repository_url.trim() || !newRepo.repository_name.trim() || !projectId) return;
    linkRepositoryMutation.mutate(
      {
        repository_url: newRepo.repository_url.trim(),
        repository_name: newRepo.repository_name.trim(),
        provider: newRepo.provider,
        webhook_secret: newRepo.webhook_secret.trim() || undefined,
        api_token: newRepo.api_token.trim() || undefined,
      },
      {
        onSuccess: () => {
          setIsAddRepoOpen(false);
          setNewRepo({
            repository_url: '',
            repository_name: '',
            provider: 'github',
            webhook_secret: '',
            api_token: '',
          });
        },
      }
    );
  };

  const handleUnlinkRepository = () => {
    if (unlinkRepoId == null) return;
    unlinkRepositoryMutation.mutate(unlinkRepoId, {
      onSettled: () => setUnlinkRepoId(null),
    });
  };

  const handleMove = (taskId: string, newStatus: TaskStatus) => {
    if (pendingMoveRef.current.has(taskId)) return;
    const taskToMove = tasks.find(t => t.id === taskId);
    if (!taskToMove) return;
    pendingMoveRef.current.add(taskId);
    updateStatusMutation.mutate(
      { taskId, status: newStatus },
      {
        onSettled: () => {
          pendingMoveRef.current.delete(taskId);
        },
      }
    );
  };

  const filteredTasks = selectedMilestoneId
    ? tasks.filter((t) => t.milestoneId === selectedMilestoneId)
    : [];
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
                        onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                        className="bg-input-background flex-1"
                        disabled={addMemberMutation.isPending}
                      />
                      <Select value={inviteRole} onValueChange={setInviteRole} disabled={addMemberMutation.isPending}>
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
                      <Button onClick={handleInvite} disabled={!inviteEmail?.trim() || addMemberMutation.isPending}>
                        {addMemberMutation.isPending ? 'Adding…' : 'Invite'}
                      </Button>
                    </div>
                    {inviteError && (
                      <p className="text-sm text-destructive">{inviteError}</p>
                    )}
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

      {/* Repositories */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-muted-foreground text-sm font-bold tracking-widest uppercase">Repositories</h3>
          {(role === 'Admin' || role === 'Project Manager') && (
            <Dialog open={isAddRepoOpen} onOpenChange={setIsAddRepoOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <GitBranch className="w-4 h-4 mr-2" />
                  Add repository
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Link repository</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="repo-url">Repository URL</Label>
                    <Input
                      id="repo-url"
                      placeholder="https://github.com/org/repo"
                      value={newRepo.repository_url}
                      onChange={(e) => setNewRepo({ ...newRepo, repository_url: e.target.value })}
                      className="bg-input-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repo-name">Repository name</Label>
                    <Input
                      id="repo-name"
                      placeholder="org/repo"
                      value={newRepo.repository_name}
                      onChange={(e) => setNewRepo({ ...newRepo, repository_name: e.target.value })}
                      className="bg-input-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repo-provider">Provider</Label>
                    <Select
                      value={newRepo.provider}
                      onValueChange={(v) => setNewRepo({ ...newRepo, provider: v as RepositoryProvider })}
                    >
                      <SelectTrigger id="repo-provider" className="bg-input-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="github">GitHub</SelectItem>
                        <SelectItem value="gitlab">GitLab</SelectItem>
                        <SelectItem value="bitbucket">Bitbucket</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhook-secret">Webhook secret (optional)</Label>
                    <Input
                      id="webhook-secret"
                      type="password"
                      placeholder="Secret from GitHub/GitLab/Bitbucket webhook"
                      value={newRepo.webhook_secret}
                      onChange={(e) => setNewRepo({ ...newRepo, webhook_secret: e.target.value })}
                      className="bg-input-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api-token">API token (optional, for private repos / scanning)</Label>
                    <Input
                      id="api-token"
                      type="password"
                      placeholder="Personal access token"
                      value={newRepo.api_token}
                      onChange={(e) => setNewRepo({ ...newRepo, api_token: e.target.value })}
                      className="bg-input-background"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  After linking, add a webhook in your repo settings pointing to this app with the same URL and secret.
                </p>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddRepoOpen(false)}>Cancel</Button>
                  <Button
                    onClick={handleLinkRepository}
                    disabled={!newRepo.repository_url.trim() || !newRepo.repository_name.trim() || linkRepositoryMutation.isPending}
                  >
                    {linkRepositoryMutation.isPending ? 'Linking…' : 'Link repository'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Index a repository so the AI can use code context when generating tasks (Create Task → AI Assistant).
        </p>
        <div className="bg-card border border-border rounded-lg p-6">
          {repositoriesQuery.isLoading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">Loading repositories…</div>
          )}
          {!repositoriesQuery.isLoading && (repositoriesQuery.data?.length ?? 0) === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
              <GitBranch className="w-8 h-8 mb-2 opacity-40" />
              <p>No repositories linked. Connect a repo to enable webhooks and code insights.</p>
            </div>
          )}
          {!repositoriesQuery.isLoading && (repositoriesQuery.data?.length ?? 0) > 0 && (
            <ul className="space-y-3">
              {(repositoriesQuery.data ?? []).map((repo: Repository) => {
                const scanStatus = wikiScanStatusQuery.data?.find((s) => s.repository_id === repo.id);
                const isScanning =
                  (scanStatus?.is_scanning ?? false) ||
                  (scanRepositoryMutation.isPending &&
                    scanRepositoryMutation.variables?.repository_id === repo.id);
                const filesIndexed = scanStatus?.files_indexed ?? 0;
                const lastScanned = scanStatus?.last_scanned_at
                  ? new Date(scanStatus.last_scanned_at).toLocaleString()
                  : null;
                return (
                  <li
                    key={repo.id}
                    className="flex flex-col gap-2 py-3 px-3 rounded-md bg-muted/30 border border-border"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{repo.repositoryName}</p>
                        <p className="text-xs text-muted-foreground truncate">{repo.repositoryUrl}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 capitalize">
                        {repo.provider}
                      </Badge>
                      <div className="flex items-center gap-1 shrink-0">
                        {(role === 'Admin' || role === 'Project Manager') && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="shrink-0"
                              onClick={() => scanRepositoryMutation.mutate({ repository_id: repo.id })}
                              disabled={isScanning}
                              title="Index this repo so AI can use code context when generating tasks"
                            >
                              {isScanning ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Search className="h-4 w-4 mr-1" />
                              )}
                              {isScanning ? 'Indexing…' : 'Index'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 text-destructive hover:text-destructive"
                              onClick={() => setUnlinkRepoId(repo.id)}
                              title="Unlink repository"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-0">
                      <span>
                        {filesIndexed > 0
                          ? `${filesIndexed} file${filesIndexed === 1 ? '' : 's'} indexed`
                          : 'Not indexed yet'}
                      </span>
                      {lastScanned && <span>Last scanned: {lastScanned}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <AlertDialog open={unlinkRepoId !== null} onOpenChange={(open) => !open && setUnlinkRepoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink repository?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the repository link from the project. Webhooks and code insights for this repo will stop. You can link it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlinkRepository} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
