import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Calendar,
  User,
  Paperclip,
  MoreVertical,
  Send,
  CheckCircle2,
  Clock,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
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
import { fetchTask, formatDueDate } from '@/api';
import type { TaskAPIResponse } from '@/types/task';

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

export function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<TaskAPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('');
  const [scope, setScope] = useState('');

  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate taskId
        if (!taskId || isNaN(Number(taskId))) {
          setError('Invalid task ID');
          return;
        }

        const taskData = await fetchTask(taskId);
        if (!taskData) {
          setError('Task not found');
          return;
        }

        setTask(taskData);
        setStatus(taskData.status || 'todo');
        setScope(taskData.scope_weight || 'M');
      } catch (err) {
        console.error('Failed to load task:', err);
        setError('Failed to load task. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [taskId]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      // Handle comment submission
      setComment('');
    }
  };

  const handleNavigateBack = () => {
    if (task?.project_id) {
      navigate(`/projects/${task.project_id}`);
    } else {
      navigate(-1);
    }
  };

  if (loading) return <TaskDetailSkeleton />;
  if (error || !task) return <TaskNotFound />;

  const totalChecklists = task.checklists?.length ?? 0;
  const completedChecklists = task.checklists?.filter(c => c.done).length ?? 0;

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
                {task.id && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">TASK-{task.id}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div className="mb-8 bg-card border border-border rounded-lg p-6">
                <h3 className="mb-3">Description</h3>
                <div className="text-muted-foreground space-y-2">
                  <p>{task.description}</p>
                </div>
              </div>
            )}

            {/* Checklists */}
            {task.checklists && task.checklists.length > 0 && (
              <div className="mb-8 bg-card border border-border rounded-lg p-6">
                <h3 className="mb-4">Checklist ({completedChecklists}/{totalChecklists})</h3>
                <div className="space-y-3">
                  {task.checklists.map((checklist, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                      {checklist.done ? (
                        <div className="w-5 h-5 rounded border border-primary bg-primary flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded border border-border flex items-center justify-center flex-shrink-0" />
                      )}
                      <span className={`text-sm ${checklist.done ? 'text-muted-foreground line-through' : ''}`}>
                        {checklist.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            <div className="mb-8 bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3>Attachments</h3>
                <Button variant="outline" size="sm">
                  <Paperclip className="mr-2 h-4 w-4" />
                  Add File
                </Button>
              </div>
              {task.attachment_count && task.attachment_count > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{task.attachment_count} file(s) attached</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No attachments yet</p>
              )}
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
            <Select value={status} onValueChange={setStatus}>
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
            <Select value={scope} onValueChange={setScope}>
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
              <Calendar className="h-4 w-4 mr-2" />
              Dates
            </div>
            <div className="space-y-2 text-sm">
              {task.created_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDueDate(task.created_at)}</span>
                </div>
              )}
              {task.updated_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{formatDueDate(task.updated_at)}</span>
                </div>
              )}
              {task.due_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due date</span>
                  <span className="text-warning">{formatDueDate(task.due_date)}</span>
                </div>
              )}
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
