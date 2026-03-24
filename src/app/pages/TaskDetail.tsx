import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { useNavigate, useLocation, useParams } from 'react-router';
import {
  ArrowLeft,
  User,
  Paperclip,
  MoreVertical,
  Send,
  Check,
  CheckCircle2,
  Clock,
  Tag,
  AlertCircle,
  Calendar as CalendarIcon,
  MessageSquare,
  ArrowRight,
  History,
  GitBranch,
  Link2,
  Unlink,
  ExternalLink,
  Link as LinkIcon,
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
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { formatDueDate, useTask, useUpdateTask, useTaskComments, useCreateTaskComment, useTaskAttachments, useUploadAttachment, useAddAttachmentLink, useDeleteAttachment, downloadTaskAttachment, mapAttachment, useTaskTimeline, useProjectMembers, useAssignTask, useProjectRepositories, useRepositoryBranches, useAddTaskLabel, useRemoveTaskLabel } from '@/api';
import { formatDistanceToNow } from 'date-fns';
import type { TaskStatus, TaskStatusAPI, ScopeWeight, TaskTimelineEntry } from '@/types/task';

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

const getActivityLabel = (entry: TaskTimelineEntry) => {
  const formatStatus = (status: string) => {
    return status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1);
  };

  switch (entry.activity_type) {
    case 'task_created':
      return 'created this task';
    case 'status_changed':
      return `changed status from ${formatStatus(entry.data?.old_status as string || 'unknown')} to ${formatStatus(entry.data?.new_status as string || 'unknown')}`;
    case 'comment_added':
      return 'added a comment';
    case 'attachment_uploaded':
      return `added attachment ${entry.data?.original_filename || entry.data?.filename || 'a file'}`;
    case 'hours_logged': {
      const hours = Number(entry.data?.hours) || 0;
      return `logged ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    case 'branch_push': {
      const branch = (entry.data?.branch as string) || 'branch';
      const msg = (entry.data?.commit_message as string) || '';
      return msg ? `pushed to ${branch}: ${msg}` : `pushed to ${branch}`;
    }
    default:
      return 'performed an action';
  }
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'task_created': return CheckCircle2;
    case 'status_changed': return ArrowRight;
    case 'comment_added': return MessageSquare;
    case 'attachment_uploaded': return Paperclip;
    case 'hours_logged': return Clock;
    case 'branch_push': return GitBranch;
    default: return History;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'task_created': return 'text-success bg-success/10';
    case 'status_changed': return 'text-primary bg-primary/10';
    case 'comment_added': return 'text-info bg-info/10';
    case 'attachment_uploaded': return 'text-warning bg-warning/10';
    case 'hours_logged': return 'text-secondary bg-secondary/10';
    case 'branch_push': return 'text-info bg-info/10';
    default: return 'text-muted-foreground bg-muted';
  }
};

function taskStatusToDisplay(s: string): string {
  if (s === 'in_progress') return 'in-progress';
  return s === 'todo' || s === 'done' ? s : 'todo';
}

export function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const state = (location.state as { projectId?: string | number } | undefined) || {};
  const fileInputRef = useRef<HTMLInputElement>(null);
  const taskDetailQueryKey = ['tasks', 'detail', taskId] as const;
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('');
  const [scope, setScope] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [selectedRepoId, setSelectedRepoId] = useState<number | ''>('');
  const [selectedBranchName, setSelectedBranchName] = useState('');
  const [newLabelValue, setNewLabelValue] = useState('');
  const [isAddLabelOpen, setIsAddLabelOpen] = useState(false);
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Use the new useTask hook for main task data
  const { data: task, isLoading: loading, error: taskError } = useTask(taskId);
  const error = taskError ? 'Failed to load task' : null;

  // Initialize the update task mutation
  const updateTaskMutation = useUpdateTask();

  // Comments hooks
  const { data: comments, isLoading: commentsLoading } = useTaskComments(taskId);
  const postCommentMutation = useCreateTaskComment(taskId);
  // Attachments hooks
  const { data: attachments, isLoading: attachmentsLoading } = useTaskAttachments(taskId);
  const uploadAttachmentMutation = useUploadAttachment(taskId);
  const addAttachmentLinkMutation = useAddAttachmentLink(taskId);
  const deleteAttachmentMutation = useDeleteAttachment(taskId);

  // Timeline hook
  const { data: timeline, isLoading: timelineLoading } = useTaskTimeline(taskId);

  // Members and Assign hook
  const { data: members } = useProjectMembers(task?.project_id, { enabled: !!task?.project_id });
  const assignTaskMutation = useAssignTask();
  const addTaskLabelMutation = useAddTaskLabel(taskId);
  const removeTaskLabelMutation = useRemoveTaskLabel(taskId);

  // Repos and branches for linked-branch dropdowns
  const { data: projectRepos } = useProjectRepositories(task?.project_id);
  const { data: branches, isLoading: branchesLoading } = useRepositoryBranches(
    task?.project_id,
    selectedRepoId === '' ? undefined : selectedRepoId
  );

  // Initialize state when task is loaded
  useEffect(() => {
    if (task) {
      setStatus(taskStatusToDisplay(task.status ?? 'todo'));
      setScope((task.scope_weight ?? 'M') as ScopeWeight);
      if (task.due_date) {
        setDueDate(new Date(task.due_date));
      }
    }
  }, [task]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      postCommentMutation.mutate(comment, {
        onSuccess: () => {
          setComment('');
        },
      });
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

  const handleAssigneeChange = (userId: string) => {
    if (!taskId) return;
    const newUserId = userId === 'unassigned' ? null : Number(userId);

    // Call API - mutation will invalidate task cache automatically
    assignTaskMutation.mutate({ taskId, userId: newUserId });
  };

  const handleAttachBranch = () => {
    if (!taskId || selectedRepoId === '' || !selectedBranchName.trim()) return;
    const repo = projectRepos?.find((r) => r.id === selectedRepoId);
    const linkedRepo = repo?.fullName ?? repo?.repositoryName ?? '';
    if (!linkedRepo) return;
    updateTaskMutation.mutate(
      { taskId, linked_repo: linkedRepo, linked_branch: selectedBranchName.trim() },
      {
        onSuccess: () => {
          setSelectedRepoId('');
          setSelectedBranchName('');
        },
      }
    );
  };

  const handleDetachBranch = () => {
    if (!taskId) return;
    updateTaskMutation.mutate(
      { taskId, linked_repo: null, linked_branch: null }
    );
  };

  if (loading) return <TaskDetailSkeleton />;
  if (error || !task) return <TaskNotFound />;

  const taskChecklists = task.checklists && Array.isArray(task.checklists) ? task.checklists : [];
  const totalChecklists = taskChecklists.length;
  const completedChecklists = taskChecklists.filter((c) => c.done).length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      uploadAttachmentMutation.mutate(file, {
        onSuccess: () => {
          if (fileInputRef.current) fileInputRef.current.value = '';
          setAttachDialogOpen(false);
        },
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      uploadAttachmentMutation.mutate(file, {
        onSuccess: () => {
          setAttachDialogOpen(false);
        },
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);
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

            {/* Checklists */}
            {task.checklists && task.checklists.length > 0 && (
              <div className="mb-8 bg-card border border-border rounded-lg p-6">
                <h3 className="mb-4">Checklist ({completedChecklists}/{totalChecklists})</h3>
                <div className="space-y-3">
                  {task.checklists.map((checklist, idx) => {
                    const handleToggle = () => {
                      if (!taskId) return;
                      const next = (task.checklists ?? []).map((c, i) =>
                        i === idx ? { ...c, done: !c.done } : c
                      );
                      updateTaskMutation.mutate(
                        { taskId, checklists: next }
                      );
                    };
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={handleToggle}
                        className="flex items-center space-x-3 w-full text-left rounded p-1 -m-1 hover:bg-muted/50 transition-colors"
                        disabled={updateTaskMutation.isPending}
                      >
                        {checklist.done ? (
                          <div className="w-5 h-5 rounded border-2 border-blue-500 bg-blue-500 flex items-center justify-center flex-shrink-0">
                            <Check className="h-3.5 w-3.5 text-white stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded border-2 border-muted-foreground/30 flex items-center justify-center flex-shrink-0" />
                        )}
                        <span className={`text-sm ${checklist.done ? 'text-muted-foreground line-through' : ''}`}>
                          {checklist.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Attachments */}
            <div className="mb-8 bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3>Attachments</h3>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="*/*"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAttachDialogOpen(true)}
                    disabled={uploadAttachmentMutation.isPending || addAttachmentLinkMutation.isPending}
                  >
                    {uploadAttachmentMutation.isPending
                      ? "Uploading..."
                      : addAttachmentLinkMutation.isPending
                        ? "Adding..."
                        : "Add"}
                  </Button>
                  <Dialog open={attachDialogOpen} onOpenChange={setAttachDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">Attach</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 pt-2">
                        {/* File section */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">Attach a file from your computer</h4>
                          <p className="text-sm text-muted-foreground">
                            You can also drag and drop files to upload them
                          </p>
                          <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                              isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 bg-muted/30'
                            }`}
                          >
                            <Button
                              type="button"
                              variant="secondary"
                              className="w-full"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadAttachmentMutation.isPending}
                            >
                              Choose a file
                            </Button>
                          </div>
                        </div>
                        <div className="border-t border-border" />
                        {/* Link section */}
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-semibold mb-1.5 block">
                              Search or paste a link <span className="text-destructive">*</span>
                            </label>
                            <Input
                              placeholder="Find recent links or paste a new link."
                              value={linkUrl}
                              onChange={(e) => setLinkUrl(e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold mb-1.5 block">
                              Display text (optional)
                            </label>
                            <Input
                              placeholder="Text to display."
                              value={linkName}
                              onChange={(e) => setLinkName(e.target.value)}
                              className="w-full"
                            />
                            <p className="text-xs text-muted-foreground mt-1.5">
                              Give this link a title or description.
                            </p>
                          </div>
                          <Button
                            onClick={() => {
                              const url = linkUrl?.trim();
                              if (!url) return;
                              addAttachmentLinkMutation.mutate(
                                { url, name: linkName?.trim() || undefined },
                                {
                                  onSuccess: () => {
                                    setLinkUrl('');
                                    setLinkName('');
                                    setAttachDialogOpen(false);
                                  },
                                }
                              );
                            }}
                            disabled={!linkUrl?.trim() || addAttachmentLinkMutation.isPending}
                            className="w-full"
                          >
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Add link
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              {attachmentsLoading ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Loading attachments...</p>
                </div>
              ) : attachments && attachments.length > 0 ? (
                <div className="space-y-2">
                  {(attachments ?? []).map(mapAttachment).map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-2 bg-input-background rounded">
                      <div className="min-w-0 flex-1">
                        {attachment.url ? (
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline truncate block"
                          >
                            {attachment.filename}
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const { blob, filename } = await downloadTaskAttachment(attachment.id);
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = filename || attachment.filename;
                                a.click();
                                URL.revokeObjectURL(url);
                              } catch {
                                // Error toast can be added here if needed
                              }
                            }}
                            className="text-sm text-primary hover:underline text-left"
                          >
                            {attachment.filename}
                          </button>
                        )}
                        <span className="text-sm text-muted-foreground ml-2">{attachment.size}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                        disabled={deleteAttachmentMutation.isPending}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No attachments yet</p>
              )}
            </div>

            {/* Comments */}
            <div className="mb-8 bg-card border border-border rounded-lg p-6">
              <h3 className="mb-6">Comments</h3>
              <div className="space-y-6 mb-6">
                {commentsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading comments...</p>
                ) : comments && comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((c) => (
                      <div key={c.id} className="flex items-start space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{(c.author?.display_name || c.author?.username || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">{c.author?.display_name || c.author?.username || 'Unknown'}</div>
                            <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</div>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">{c.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
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
                    <Button type="submit" size="sm" disabled={!comment.trim() || postCommentMutation.isPending}>
                      <Send className="mr-2 h-4 w-4" />
                      Comment
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            {/* Activity Timeline */}
            <div className="mb-8 bg-card border border-border rounded-lg p-6">
              <h3 className="mb-6 flex items-center">
                <History className="mr-2 h-5 w-5 text-muted-foreground" />
                Activity
              </h3>
              {timelineLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : timeline && timeline.length > 0 ? (
                <div className="relative space-y-6 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:via-border before:to-transparent">
                  {timeline.map((entry) => {
                    if (entry.activity_type === 'branch_push') {
                      const branch = (entry.data?.branch as string) || 'branch';
                      const commitMessage = (entry.data?.commit_message as string) || '';
                      const commitUrlRaw = entry.data?.commit_url as string | undefined;
                      const repo = entry.data?.repo as string | undefined;
                      const sha = entry.data?.commit_sha as string | undefined;
                      const commitUrl =
                        commitUrlRaw || (repo && sha ? `https://github.com/${repo}/commit/${sha}` : null);
                      return (
                        <div key={entry.id} className="relative flex items-start space-x-4 pl-1">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full border border-border shrink-0 z-10 ${getActivityColor(entry.activity_type)}`}>
                            <GitBranch className="h-4 w-4" />
                          </div>
                          <div className="flex-1 pt-1">
                            <div className="rounded-lg border border-border bg-card p-3">
                              <div className="text-sm">
                                <span className="font-semibold">{entry.user?.display_name || entry.user?.username || 'Someone'}</span>
                                <span className="text-muted-foreground"> pushed to </span>
                                <span className="font-mono text-xs font-medium">{branch}</span>
                                {commitMessage && (
                                  <>
                                    <span className="text-muted-foreground">: </span>
                                    <span className="text-foreground">{commitMessage}</span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {commitUrl && (
                                  <a
                                    href={commitUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    View commit
                                  </a>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    const Icon = getActivityIcon(entry.activity_type);
                    return (
                      <div key={entry.id} className="relative flex items-start space-x-4 pl-1">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full border border-border shrink-0 z-10 ${getActivityColor(entry.activity_type)}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="text-sm">
                            <span className="font-semibold">{entry.user?.display_name || entry.user?.username || 'Someone'}</span>
                            {' '}
                            <span className="text-muted-foreground">{getActivityLabel(entry)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No activity logged yet.</p>
              )}
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
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm text-muted-foreground">Status</label>
              <span
                className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                  status === 'done'
                    ? 'bg-success'
                    : status === 'in_progress'
                      ? 'bg-primary'
                      : 'bg-muted-foreground'
                }`}
                aria-hidden
              />
            </div>
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
                (() => {
                  const member = members?.find(m => m.userId === task.assigned_to);
                  return (
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{member ? member.initials : `U${task.assigned_to}`}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member ? member.name : `User ${task.assigned_to}`}</p>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p className="text-sm text-muted-foreground">Not assigned</p>
              )}

              <Select
                value={task.assigned_to?.toString() || 'unassigned'}
                onValueChange={handleAssigneeChange}
                disabled={assignTaskMutation.isPending}
              >
                <SelectTrigger className="w-full mt-2">
                  <SelectValue placeholder="Add Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members?.map(m => (
                    <SelectItem key={m.userId} value={m.userId.toString()}>
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback className="text-[10px]">{m.initials}</AvatarFallback>
                        </Avatar>
                        <span>{m.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center text-sm text-muted-foreground mb-3">
              <CalendarIcon className="h-4 w-4 mr-2" />
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
              {(task.labels ?? []).map((label) => (
                <Badge key={label} variant="secondary" className="pr-1 gap-1">
                  {label}
                  <button
                    type="button"
                    onClick={() => {
                      if (!taskId) return;
                      removeTaskLabelMutation.mutate(label, {
                        onSuccess: () => {
                          if (taskId) queryClient.invalidateQueries({ queryKey: taskDetailQueryKey });
                        },
                      });
                    }}
                    className="rounded-full hover:bg-muted-foreground/20 p-0.5"
                    disabled={removeTaskLabelMutation.isPending}
                    aria-label={`Remove label ${label}`}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <Popover open={isAddLabelOpen} onOpenChange={setIsAddLabelOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Add Label
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const value = newLabelValue.trim();
                    if (!value || !taskId) return;
                    addTaskLabelMutation.mutate(value, {
                      onSuccess: () => {
                        if (taskId) queryClient.invalidateQueries({ queryKey: taskDetailQueryKey });
                        setNewLabelValue('');
                        setIsAddLabelOpen(false);
                      },
                    });
                  }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Label name"
                    value={newLabelValue}
                    onChange={(e) => setNewLabelValue(e.target.value)}
                    maxLength={64}
                    className="w-40"
                  />
                  <Button type="submit" size="sm" disabled={!newLabelValue.trim() || addTaskLabelMutation.isPending}>
                    Add
                  </Button>
                </form>
              </PopoverContent>
            </Popover>
          </div>

          <Separator />

          <div>
            <div className="flex items-center text-sm text-muted-foreground mb-3">
              <GitBranch className="h-4 w-4 mr-2" />
              Linked branch
            </div>
            {task.linked_repo && task.linked_branch ? (
              <div className="space-y-2">
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                  <p className="font-medium font-mono truncate" title={task.linked_repo}>{task.linked_repo}</p>
                  <p className="text-muted-foreground font-mono text-xs truncate" title={task.linked_branch}>{task.linked_branch}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleDetachBranch}
                  disabled={updateTaskMutation.isPending}
                >
                  <Unlink className="mr-2 h-4 w-4" />
                  Detach
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {!projectRepos?.length ? (
                  <p className="text-sm text-muted-foreground">No repositories linked to this project. Link a repo in project settings to attach a branch.</p>
                ) : (
                  <>
                    <Select
                      value={selectedRepoId === '' ? '__none__' : String(selectedRepoId)}
                      onValueChange={(v) => {
                        setSelectedRepoId(v === '__none__' ? '' : Number(v));
                        setSelectedBranchName('');
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select repository" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Select repository</SelectItem>
                        {projectRepos.map((r) => (
                          <SelectItem key={r.id} value={String(r.id)}>
                            {r.repositoryName}
                            {r.fullName ? ` (${r.fullName})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedRepoId !== '' && (
                      <Select
                        value={selectedBranchName || '__none__'}
                        onValueChange={(v) => setSelectedBranchName(v === '__none__' ? '' : v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={branchesLoading ? 'Loading branches…' : 'Select branch'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Select branch</SelectItem>
                          {(branches ?? []).map((b) => (
                            <SelectItem key={b.name} value={b.name}>
                              {b.name}
                              {b.default ? ' (default)' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {(selectedRepoId !== '' && !branchesLoading && (branches?.length ?? 0) === 0) && (
                      <p className="text-xs text-muted-foreground">No branches found. Add an API token to the repo for private repos.</p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleAttachBranch}
                      disabled={selectedRepoId === '' || !selectedBranchName.trim() || updateTaskMutation.isPending}
                    >
                      <Link2 className="mr-2 h-4 w-4" />
                      {updateTaskMutation.isPending ? 'Attaching…' : 'Attach'}
                    </Button>
                  </>
                )}
              </div>
            )}
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
