import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation, useParams } from 'react-router';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Paperclip,
  MoreVertical,
  Send,
  CheckCircle2,
  Clock,
  Tag,
  AlertCircle,
  Calendar as CalendarIcon,
  Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { Skeleton } from '../components/ui/skeleton';
import {
  fetchTask,
  fetchTaskAttachments,
  uploadTaskAttachment,
  mapTaskAttachment,
} from '@/api/projects';
import { formatDueDate } from '@/api/mappers';
import { useUpdateTask } from '@/api';
import type { TaskStatus, TaskStatusAPI, ScopeWeight } from '@/types/task';
import type { TaskAPIResponse, TaskAttachmentItem } from '@/types/task';

function TaskDetailSkeleton() {
  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
      <aside className="w-80 bg-card border-l border-border p-6">
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </aside>
    </div>
  );
}

function TaskNotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex h-full items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
        <h2 className="text-2xl font-bold mb-2">Task not found</h2>
        <p className="text-muted-foreground mb-6">The task you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate('/projects')}>Go to Projects</Button>
      </motion.div>
    </div>
  );
}

function taskStatusToDisplay(s: string): string {
  if (s === 'in_progress') return 'in-progress';
  return s === 'todo' || s === 'done' ? s : 'todo';
}

export function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as { projectId?: string | number } | undefined) || {};
  const [task, setTask] = useState<TaskAPIResponse | null>(null);
  const [attachments, setAttachments] = useState<TaskAttachmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('');
  const [scope, setScope] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  // Initialize the update task mutation
  const updateTaskMutation = useUpdateTask();

  useEffect(() => {
    if (!taskId || isNaN(Number(taskId))) {
      setLoading(false);
      setError('Invalid task ID');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchTask(taskId).catch((err: unknown) => err),
      fetchTaskAttachments(taskId),
    ]).then(([taskResult, attachmentList]) => {
      if (cancelled) return;
      if (taskResult && !(taskResult instanceof Error) && typeof taskResult === 'object' && 'id' in taskResult) {
        const t = taskResult as TaskAPIResponse;
        setTask(t);
        setStatus(taskStatusToDisplay(t.status ?? 'todo'));
        setScope((t.scope_weight ?? 'M') as ScopeWeight);
        if (t.due_date) setDueDate(new Date(t.due_date));
      } else {
        setTask(null);
        setError(taskResult instanceof Error ? taskResult.message : 'Failed to load task');
      }
      setAttachments((attachmentList ?? []).map(mapTaskAttachment));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [taskId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !taskId) return;
    setUploading(true);
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      try {
        const data = await uploadTaskAttachment(taskId, file);
        setAttachments((prev) => [...prev, mapTaskAttachment(data)]);
        toast.success(`Added "${file.name}"`);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
          ?? (err as { message?: string })?.message
          ?? 'Upload failed';
        toast.error(`${msg} You can try again on this task page.`);
      }
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      // Handle comment submission
      setComment('');
    }
  };

  const handleNavigateBack = () => {
    const projectId = task?.project_id ?? state.projectId;
    if (projectId != null) {
      navigate(`/projects/${projectId}`);
    } else {
      navigate(-1);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    const previousStatus = status;
    setStatus(newStatus);
    const frontendStatus: TaskStatus = newStatus === 'in_progress' ? 'in-progress' : (newStatus as TaskStatusAPI as TaskStatus);
    if (taskId && task) {
      updateTaskMutation.mutate(
        { taskId, status: frontendStatus },
        { onError: () => setStatus(previousStatus) }
      );
    }
  };

  const handleScopeChange = (newScope: string) => {
    const previousScope = scope;
    setScope(newScope);
    if (taskId && task) {
      updateTaskMutation.mutate(
        { taskId, scope_weight: newScope as ScopeWeight },
        { onError: () => setScope(previousScope) }
      );
    }
  };

  const handleDueDateChange = (date: Date | undefined) => {
    const previousDueDate = dueDate;
    setDueDate(date);
    if (taskId && task) {
      const isoDate = date ? date.toISOString().split('T')[0] : null;
      updateTaskMutation.mutate(
        { taskId, due_date: isoDate },
        { onError: () => setDueDate(previousDueDate) }
      );
    }
  };

  if (loading) return <TaskDetailSkeleton />;
  if (error || !task) return <TaskNotFound />;

  const taskChecklists = task.checklists && Array.isArray(task.checklists) ? task.checklists : [];
  const totalChecklists = taskChecklists.length;
  const completedChecklists = taskChecklists.filter((c) => c.done).length;

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Button
            variant="ghost"
            onClick={handleNavigateBack}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Board
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Task Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl mb-2">{task.title}</h1>
                  <p className="text-muted-foreground">
                    {task.description || 'No description provided'}
                  </p>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center space-x-4">
                {task.project_name && (
                  <Badge variant="secondary">{task.project_name}</Badge>
                )}
                {task.id != null && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">TASK-{task.id}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {task.description ? (
              <div className="mb-8 bg-card border border-border rounded-lg p-6">
                <h3 className="mb-3">Description</h3>
                <div className="text-muted-foreground space-y-2">
                  <p>{task.description}</p>
                </div>
              </div>
            ) : null}

            {/* Checklists */}
            <div className="mb-8 bg-card border border-border rounded-lg p-6">
              <h3 className="mb-4">Checklist ({completedChecklists}/{totalChecklists})</h3>
              {taskChecklists.length > 0 ? (
                <div className="space-y-3">
                  {taskChecklists.map((item, index) => (
                    <div key={item.id ?? index} className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${item.done ? 'border-primary bg-primary' : 'border-border'}`}>
                        {item.done ? <CheckCircle2 className="h-3 w-3 text-primary-foreground" /> : null}
                      </div>
                      <span className={`text-sm ${item.done ? 'text-muted-foreground line-through' : ''}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No checklist items.</p>
              )}
            </div>

            {/* Attachments */}
            <div className="mb-8 bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3>Attachments</h3>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  accept="*/*"
                  onChange={handleFileSelect}
                  disabled={!taskId || uploading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!taskId || uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Paperclip className="mr-2 h-4 w-4" />
                      Add File
                    </>
                  )}
                </Button>
              </div>
              <div className="space-y-2">
                {attachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No attachments yet. Use &quot;Add File&quot; to upload.</p>
                ) : (
                  attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                          <Paperclip className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">{attachment.size}</p>
                        </div>
                      </div>
                      {attachment.url ? (
                        <a href={attachment.url} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="sm">Download</Button>
                        </a>
                      ) : (
                        <Button variant="ghost" size="sm" disabled>Download</Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="mb-8 bg-card border border-border rounded-lg p-6">
              <h3 className="mb-6">Comments</h3>
              <div className="space-y-6 mb-6">
                {task.comment_count && task.comment_count > 0 ? (
                  <p className="text-sm text-muted-foreground">{task.comment_count} comment(s)</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No comments yet</p>
                )}
              </div>

              <Separator className="my-6" />

              <form onSubmit={handleSubmitComment} className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mb-2 bg-input-background"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={!comment.trim()}>
                      <Send className="mr-2 h-4 w-4" />
                      Comment
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-80 bg-card border-l border-border p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="space-y-6"
        >
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Status</label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Scope</label>
            <Select value={scope} onValueChange={handleScopeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="XS">Extra Small (XS)</SelectItem>
                <SelectItem value="S">Small (S)</SelectItem>
                <SelectItem value="M">Medium (M)</SelectItem>
                <SelectItem value="L">Large (L)</SelectItem>
                <SelectItem value="XL">Extra Large (XL)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div>
            <div className="flex items-center text-sm text-muted-foreground mb-3">
              <User className="h-4 w-4 mr-2" />
              Assignees
            </div>
            <div className="space-y-2">
              {task.assigned_to ? (
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>U{task.assigned_to}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">User {task.assigned_to}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not assigned</p>
              )}
              <Button variant="outline" size="sm" className="w-full mt-2">
                Add Assignee
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center text-sm text-muted-foreground mb-3">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Dates
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{task.created_at ? formatDueDate(task.created_at) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{task.updated_at ? formatDueDate(task.updated_at) : '—'}</span>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm text-muted-foreground block mb-2">Due date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {dueDate ? formatDueDate(dueDate.toISOString()) : 'Set due date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={handleDueDateChange}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center text-sm text-muted-foreground mb-3">
              <Tag className="h-4 w-4 mr-2" />
              Labels
            </div>
            <div className="flex flex-wrap gap-2">
              {task.project_name && (
                <Badge variant="secondary">{task.project_name}</Badge>
              )}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2">
              Add Label
            </Button>
          </div>

          <Separator />

          <div>
            <div className="flex items-center text-sm text-muted-foreground mb-3">
              <Clock className="h-4 w-4 mr-2" />
              Time Tracking
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated</span>
                <span>—</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Logged</span>
                <span>—</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2">
              Log Time
            </Button>
          </div>
        </motion.div>
      </aside>
    </div>
  );
}
