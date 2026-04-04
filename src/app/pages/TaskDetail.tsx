import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation, useParams } from 'react-router';
import {
  ArrowLeft,
  CalendarPlus,
  Check,
  ChevronDown,
  FileText,
  Flag,
  Link2,
  Plus,
  Tag,
  UserRoundPlus,
  X,
  Activity,
} from 'lucide-react';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import {
  formatDueDate,
  useTask,
  useUpdateTask,
  useTaskAttachments,
  useDeleteAttachment,
  downloadTaskAttachment,
  mapAttachment,
  getAttachmentLinkHref,
  getAttachmentLinkLabel,
  useTaskTimeline,
  useProjectMembers,
  useAddTaskLabel,
  useRemoveTaskLabel,
} from '@/api';
import { formatDistanceToNow } from 'date-fns';
import type { TaskStatus, ScopeWeight, TaskTimelineEntry } from '@/types/task';
import type { Member } from '@/types/member';
import { AddTaskResourceModal } from '../components/AddTaskResourceModal';
import { AssignMemberModal } from '../components/AssignMemberModal';

/* ─── helpers ─── */

function taskStatusToDisplay(s: string): string {
  if (s === 'in_progress') return 'in-progress';
  return s === 'todo' || s === 'done' ? s : 'todo';
}

function statusLabel(s: string): string {
  if (s === 'in-progress' || s === 'in_progress') return 'In Progress';
  if (s === 'done') return 'Done';
  return 'To-Do';
}

function scopeLabel(s: string): string {
  const map: Record<string, string> = { XS: 'Extra Small (XS)', S: 'Small (S)', M: 'Medium (M)', L: 'Large (L)', XL: 'Extra Large (XL)' };
  return map[s] ?? 'Medium (M)';
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'todo', label: 'To-Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const SCOPE_OPTIONS: { value: ScopeWeight; label: string }[] = [
  { value: 'XS', label: 'Extra Small (XS)' },
  { value: 'S', label: 'Small (S)' },
  { value: 'M', label: 'Medium (M)' },
  { value: 'L', label: 'Large (L)' },
  { value: 'XL', label: 'Extra Large (XL)' },
];

const AVATAR_COLORS = ['#E8A303', '#EE7F84', '#7157E7', '#4A9FF8', '#10b981', '#f17173'];

function resolveAssigneeLabel(idStr: string | null | undefined, members: Member[] | undefined): string {
  if (idStr == null || idStr === '') return 'Unassigned';
  const id = Number(idStr);
  if (Number.isNaN(id)) return String(idStr);
  const m = members?.find((mem) => mem.userId === id);
  return m?.name || `User #${id}`;
}

function timelineActorName(entry: TaskTimelineEntry): string {
  const u = entry.user;
  if (u) return u.name || u.display_name || u.username || 'Someone';
  if (entry.activity_type === 'branch_push' && entry.data?.author) return String(entry.data.author);
  return 'Someone';
}

function getActivityLabel(entry: TaskTimelineEntry, members?: Member[]) {
  const formatStatus = (status: string) =>
    status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1);

  switch (entry.activity_type) {
    case 'task_created':
      return 'created this task';
    case 'status_changed':
      return `changed status from ${formatStatus(entry.data?.old_status as string || 'unknown')} to ${formatStatus(entry.data?.new_status as string || 'unknown')}`;
    case 'assignment_changed':
      return `changed assignee from ${resolveAssigneeLabel(entry.data?.old_assignee_id as string | undefined, members)} to ${resolveAssigneeLabel(entry.data?.new_assignee_id as string | undefined, members)}`;
    case 'comment_added': {
      const preview = (entry.data?.content as string) || '';
      return preview ? `commented: ${preview}` : 'added a comment';
    }
    case 'attachment_uploaded':
      return `added attachment ${entry.data?.original_filename || entry.data?.filename || 'a file'}`;
    case 'hours_logged': {
      const hours = Number(entry.data?.hours) || 0;
      return `logged ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    case 'commit_linked': {
      const hash = (entry.data?.commit_hash as string) || '';
      const short = hash.length > 7 ? hash.slice(0, 7) : hash;
      const br = (entry.data?.branch as string) || 'branch';
      return short ? `linked commit ${short} on ${br}` : `linked a commit on ${br}`;
    }
    case 'branch_push': {
      const branch = (entry.data?.branch as string) || 'branch';
      const msg = (entry.data?.commit_message as string) || '';
      return msg ? `pushed to ${branch}: ${msg}` : `pushed to ${branch}`;
    }
    default:
      return 'performed an action';
  }
}

/* ─── skeleton ─── */

function TaskDetailSkeleton() {
  return (
    <div className="flex h-full w-full min-h-0 items-stretch font-['Satoshi',sans-serif]">
      <main className="min-h-0 flex-1 overflow-y-auto rounded-[12px] bg-[#f9fafb] p-4">
        <div className="mx-auto w-full max-w-[600px] space-y-6 py-4">
          <div className="h-6 w-32 animate-pulse rounded bg-[#e4eaec]" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-[#e4eaec]" />
          <div className="h-[106px] w-full animate-pulse rounded-[8px] bg-[#e4eaec]" />
          <div className="h-40 w-full animate-pulse rounded-[8px] bg-[#e4eaec]" />
        </div>
      </main>
      <aside className="min-h-0 w-[362px] overflow-y-auto border-l border-[#ebedee] bg-white p-9">
        <div className="space-y-6">
          <div className="h-10 w-full animate-pulse rounded bg-[#e4eaec]" />
          <div className="h-10 w-full animate-pulse rounded bg-[#e4eaec]" />
          <div className="h-20 w-full animate-pulse rounded bg-[#e4eaec]" />
        </div>
      </aside>
    </div>
  );
}

function TaskNotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex h-full items-center justify-center font-['Satoshi',sans-serif]">
      <div className="text-center">
        <h2 className="mb-2 text-[24px] font-medium text-[#0b191f]">Task not found</h2>
        <p className="mb-6 text-[14px] text-[#727d83]">The task you're looking for doesn't exist or has been deleted.</p>
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="rounded-[8px] bg-[#24B5F8] px-6 py-2 text-[14px] font-bold text-white"
        >
          Go to Projects
        </button>
      </div>
    </div>
  );
}

/* ─── main component ─── */

export interface TaskDetailProps {
  /** Override the taskId from route params (useful when embedding in another layout). */
  taskIdOverride?: string;
  /** Custom back navigation handler. When omitted, navigates to the project board. */
  onBack?: () => void;
}

export function TaskDetail({ taskIdOverride, onBack }: TaskDetailProps = {}) {
  const { taskId: routeTaskId } = useParams<{ taskId: string }>();
  const taskId = taskIdOverride ?? routeTaskId;
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const state = (location.state as { projectId?: string | number } | undefined) || {};

  /* ─ data hooks ─ */
  const { data: task, isLoading: loading, error: taskError } = useTask(taskId);
  const updateTaskMutation = useUpdateTask();
  const { data: attachments } = useTaskAttachments(taskId);
  const deleteAttachmentMutation = useDeleteAttachment(taskId);
  const { data: timeline, isLoading: timelineLoading } = useTaskTimeline(taskId);
  const { data: members } = useProjectMembers(task?.project_id, { enabled: !!task?.project_id });
  const addTaskLabelMutation = useAddTaskLabel(taskId);
  const removeTaskLabelMutation = useRemoveTaskLabel(taskId);
  const taskDetailQueryKey = ['tasks', 'detail', taskId] as const;

  /* ─ local state ─ */
  const [status, setStatus] = useState('');
  const [scope, setScope] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [localChecklists, setLocalChecklists] = useState<Array<{ id?: string; text: string; done: boolean }>>([]);
  const [editingChecklistIdx, setEditingChecklistIdx] = useState<number | null>(null);
  const [checklistDraft, setChecklistDraft] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState('New tag');
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [scopeDropdownOpen, setScopeDropdownOpen] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const checklistInputRef = useRef<HTMLInputElement>(null);

  /* ─ init from task ─ */
  useEffect(() => {
    if (task) {
      setStatus(taskStatusToDisplay(task.status ?? 'todo'));
      setScope((task.scope_weight ?? 'M') as string);
      if (task.due_date) setDueDate(new Date(task.due_date));
      setLocalChecklists(task.checklists && Array.isArray(task.checklists) ? [...task.checklists] : []);
    }
  }, [task]);

  /* ─ navigation ─ */
  const handleNavigateBack = () => {
    if (onBack) { onBack(); return; }
    const projectId = task?.project_id ?? state.projectId;
    if (projectId != null) navigate(`/projects/${projectId}`);
    else navigate(-1);
  };

  /* ─ title editing ─ */
  const startEditTitle = () => {
    setTitleDraft(task?.title ?? '');
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const saveTitle = useCallback(() => {
    setEditingTitle(false);
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === task?.title || !taskId) return;
    updateTaskMutation.mutate({ taskId, title: trimmed });
  }, [titleDraft, task?.title, taskId, updateTaskMutation]);

  /* ─ description editing ─ */
  const startEditDesc = () => {
    setDescDraft(task?.description ?? '');
    setEditingDesc(true);
    setTimeout(() => descTextareaRef.current?.focus(), 0);
  };

  const saveDesc = useCallback(() => {
    setEditingDesc(false);
    const trimmed = descDraft.trim();
    if (trimmed === (task?.description ?? '') || !taskId) return;
    updateTaskMutation.mutate({ taskId, description: trimmed || null });
  }, [descDraft, task?.description, taskId, updateTaskMutation]);

  /* ─ checklist ─ */
  const saveChecklists = useCallback((next: Array<{ id?: string; text: string; done: boolean }>) => {
    setLocalChecklists(next);
    if (taskId) updateTaskMutation.mutate({ taskId, checklists: next });
  }, [taskId, updateTaskMutation]);

  const addChecklistItem = () => {
    const next = [...localChecklists, { text: 'New checklist', done: false }];
    saveChecklists(next);
    setEditingChecklistIdx(next.length - 1);
    setChecklistDraft('New checklist');
    setTimeout(() => {
      checklistInputRef.current?.focus();
      checklistInputRef.current?.select();
    }, 0);
  };

  const toggleChecklist = (idx: number) => {
    const next = localChecklists.map((c, i) => i === idx ? { ...c, done: !c.done } : c);
    saveChecklists(next);
  };

  const startEditChecklist = (idx: number) => {
    setEditingChecklistIdx(idx);
    setChecklistDraft(localChecklists[idx].text);
    setTimeout(() => {
      checklistInputRef.current?.focus();
      checklistInputRef.current?.select();
    }, 0);
  };

  const saveChecklistEdit = () => {
    if (editingChecklistIdx === null) return;
    const trimmed = checklistDraft.trim();
    if (!trimmed) {
      const next = localChecklists.filter((_, i) => i !== editingChecklistIdx);
      saveChecklists(next);
    } else {
      const next = localChecklists.map((c, i) => i === editingChecklistIdx ? { ...c, text: trimmed } : c);
      saveChecklists(next);
    }
    setEditingChecklistIdx(null);
  };

  /* ─ tags (labels) ─ */
  const startAddTag = () => {
    setTagDraft('New tag');
    setAddingTag(true);
    setTimeout(() => {
      tagInputRef.current?.focus();
      tagInputRef.current?.select();
    }, 0);
  };

  const saveTag = () => {
    setAddingTag(false);
    const trimmed = tagDraft.trim();
    if (!trimmed || !taskId) return;
    addTaskLabelMutation.mutate(trimmed, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: taskDetailQueryKey }),
    });
  };

  const removeTag = (label: string) => {
    if (!taskId) return;
    removeTaskLabelMutation.mutate(label, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: taskDetailQueryKey }),
    });
  };

  /* ─ due date ─ */
  const handleDueDateChange = (date: Date | undefined) => {
    setDueDate(date);
    if (taskId) {
      const isoDate = date ? date.toISOString().split('T')[0] : null;
      updateTaskMutation.mutate({ taskId, due_date: isoDate });
    }
  };

  /* ─ status / scope ─ */
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setStatusDropdownOpen(false);
    const frontendStatus: TaskStatus = newStatus === 'in_progress' ? 'in-progress' : (newStatus as TaskStatus);
    if (taskId) updateTaskMutation.mutate({ taskId, status: frontendStatus });
  };

  const handleScopeChange = (newScope: string) => {
    setScope(newScope);
    setScopeDropdownOpen(false);
    if (taskId) updateTaskMutation.mutate({ taskId, scope_weight: newScope as ScopeWeight });
  };

  const handleUpdateTask = async () => {
    if (!taskId) return;
    setEditingTitle(false);
    setEditingDesc(false);
    const updates: Record<string, unknown> = {};
    if (titleDraft.trim() && titleDraft.trim() !== task?.title) updates.title = titleDraft.trim();
    if (descDraft.trim() !== (task?.description ?? '')) updates.description = descDraft.trim() || null;

    const doNavigate = async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      handleNavigateBack();
    };

    if (Object.keys(updates).length > 0) {
      updateTaskMutation.mutate(
        { taskId, ...updates } as Parameters<typeof updateTaskMutation.mutate>[0],
        { onSettled: () => { doNavigate(); } },
      );
    } else if (updateTaskMutation.isPending) {
      const check = setInterval(() => {
        if (!updateTaskMutation.isPending) {
          clearInterval(check);
          doNavigate();
        }
      }, 50);
    } else {
      doNavigate();
    }
  };

  /* ─ render ─ */
  if (loading) return <TaskDetailSkeleton />;
  if (taskError || !task) return <TaskNotFound />;

  const assignedMember = members?.find(m => m.userId === task.assigned_to);
  const mappedAttachments = (attachments ?? []).map(mapAttachment);

  return (
    <div className="flex h-full w-full min-h-0 items-stretch font-['Satoshi',sans-serif]">
      {/* ═══ MAIN PANEL ═══ */}
      <main className="min-h-0 flex-1 overflow-y-auto rounded-[12px] bg-[#f9fafb] p-4">
        <div className="mx-auto w-full max-w-[600px]">
          {/* Header bar */}
          <div className="flex items-center justify-between py-4">
            <button type="button" onClick={handleNavigateBack} className="text-[#606d76]">
              <ArrowLeft size={20} />
            </button>
            <p className="text-[16px] font-medium tracking-[-0.16px] text-[#595959]">Update Task</p>
            <Flag size={16} className="text-[#606d76]" />
          </div>

          <div className="space-y-12 py-4">
            {/* ─── Title + Description ─── */}
            <section className="space-y-4">
              {editingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                  className="w-full border-0 bg-transparent text-[24px] font-medium leading-[1.2] tracking-[-0.24px] text-[#0b191f] outline-none"
                />
              ) : (
                <h2
                  className="cursor-text text-[24px] font-medium leading-[1.2] tracking-[-0.24px] text-[#0b191f]"
                  onClick={startEditTitle}
                >
                  {task.title}
                </h2>
              )}
              <div>
                <p className="mb-1 text-[14px] font-medium text-[#606d76]">Description</p>
                {editingDesc ? (
                  <textarea
                    ref={descTextareaRef}
                    value={descDraft}
                    onChange={(e) => setDescDraft(e.target.value)}
                    onBlur={saveDesc}
                    onKeyDown={(e) => { if (e.key === 'Escape') { setEditingDesc(false); } }}
                    className="min-h-[106px] w-full resize-none rounded-[8px] border border-[#e9e9e9] bg-white p-4 text-[16px] font-medium text-[#0b191f] outline-none focus:ring-2 focus:ring-[#24b5f8]/40"
                  />
                ) : (
                  <div
                    className="min-h-[106px] cursor-text rounded-[8px] border border-[#e9e9e9] bg-white p-4"
                    onClick={startEditDesc}
                  >
                    <p className="text-[16px] font-medium text-[#0b191f]">
                      {task.description || 'Click to add a description…'}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* ─── Checklist ─── */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-medium text-[#0b191f]">Checklist</p>
                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="flex size-8 items-center justify-center rounded-[8px] border border-[#ebedee] bg-white shadow-sm"
                >
                  <Plus size={16} />
                </button>
              </div>
              {localChecklists.length === 0 ? (
                <p className="text-[13px] text-[#727d83]">No checklist items yet</p>
              ) : (
                <div className="space-y-2">
                  {localChecklists.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => toggleChecklist(idx)}
                        className={`flex size-5 shrink-0 items-center justify-center rounded-[4px] ${item.done ? 'bg-[#24B5F8]' : 'border border-[#ebedee] bg-[#f9f9f9]'}`}
                      >
                        {item.done ? <Check size={13} className="text-white" /> : null}
                      </button>
                      {editingChecklistIdx === idx ? (
                        <input
                          ref={checklistInputRef}
                          type="text"
                          value={checklistDraft}
                          onChange={(e) => setChecklistDraft(e.target.value)}
                          onBlur={saveChecklistEdit}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveChecklistEdit(); if (e.key === 'Escape') setEditingChecklistIdx(null); }}
                          className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-[#0b191f] outline-none"
                        />
                      ) : (
                        <p
                          className={`min-w-0 flex-1 cursor-text text-[13px] ${item.done ? 'text-[#0b191f]/50 line-through' : 'text-[#0b191f]'}`}
                          onClick={() => startEditChecklist(idx)}
                        >
                          {item.text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ─── Tags ─── */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-medium text-[#0b191f]">Tags</p>
                <button
                  type="button"
                  onClick={startAddTag}
                  className="inline-flex size-8 items-center justify-center rounded-[8px] border border-[#ebedee] bg-white text-[#606d76] shadow-[0px_8px_2px_0px_rgba(14,14,34,0),0px_5px_2px_0px_rgba(14,14,34,0.01),0px_3px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                >
                  <Tag size={14} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(task.labels ?? []).map((tag, idx) => (
                  <span
                    key={tag}
                    className={`group relative rounded-[16px] px-4 py-1 text-[14px] font-medium ${
                      idx === 0 ? 'bg-[#0b191f] text-white' : 'border border-[#cdd2d5] text-[#606d76]'
                    }`}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1.5 inline-flex size-4 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={`Remove ${tag}`}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {addingTag && (
                  <span className="rounded-[16px] border border-[#cdd2d5] px-1 py-1">
                    <input
                      ref={tagInputRef}
                      type="text"
                      value={tagDraft}
                      onChange={(e) => setTagDraft(e.target.value)}
                      onBlur={saveTag}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveTag(); if (e.key === 'Escape') setAddingTag(false); }}
                      className="w-24 border-0 bg-transparent text-[14px] font-medium text-[#606d76] outline-none"
                    />
                  </span>
                )}
              </div>
            </section>

            {/* ─── Due Date ─── */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-medium text-[#0b191f]">Due Date</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex size-8 items-center justify-center rounded-[8px] border border-[#ebedee] bg-white text-[#606d76] shadow-[0px_8px_2px_0px_rgba(14,14,34,0),0px_5px_2px_0px_rgba(14,14,34,0.01),0px_3px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                    >
                      <CalendarPlus size={14} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={handleDueDateChange}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-wrap gap-2">
                {dueDate ? (
                  <span className="rounded-[16px] bg-[#0b191f] px-4 py-1 text-[14px] font-medium text-white">
                    {formatDueDate(dueDate.toISOString())}
                  </span>
                ) : (
                  <p className="text-[13px] text-[#727d83]">No due date set</p>
                )}
              </div>
            </section>

            {/* ─── Resources (Attachments) ─── */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-medium text-[#0b191f]">Resources</p>
                <button
                  type="button"
                  onClick={() => setResourceModalOpen(true)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[#ebedee] bg-white px-3 py-2 text-[14px] font-medium text-[#0b191f]"
                >
                  Add <Plus size={16} />
                </button>
              </div>
              {mappedAttachments.length === 0 ? (
                <p className="text-[13px] text-[#727d83]">No attachments yet</p>
              ) : (
                <div className="space-y-3">
                  {mappedAttachments.map((attachment) => {
                    const linkHref = getAttachmentLinkHref(attachment);
                    const linkLabel = getAttachmentLinkLabel(attachment);
                    return (
                      <div key={attachment.id} className="flex items-center gap-2">
                        <div className="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-[8px] border border-[#ededed] pr-2">
                          <div className="flex w-[50px] items-center justify-center bg-[#edf0f3]">
                            {attachment.kind === 'link' ? (
                              <Link2 className="size-4 text-[#606d76]" />
                            ) : (
                              <FileText className="size-4 text-[#606d76]" />
                            )}
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col justify-center border-l border-[#ededed] px-4 py-1.5">
                            {attachment.kind === 'link' && linkHref ? (
                              <a
                                href={linkHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate text-[16px] font-medium text-[#0b191f] hover:underline"
                              >
                                {linkLabel}
                              </a>
                            ) : attachment.kind === 'file' ? (
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
                                  } catch { /* handled */ }
                                }}
                                className="truncate text-left text-[16px] font-medium text-[#0b191f] hover:underline"
                              >
                                {attachment.filename}
                              </button>
                            ) : (
                              <p className="truncate text-[16px] font-medium text-[#0b191f]">{attachment.filename}</p>
                            )}
                            {attachment.kind === 'file' && attachment.size ? (
                              <p className="text-[12px] text-[#727d83]">{attachment.size}</p>
                            ) : null}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                          disabled={deleteAttachmentMutation.isPending}
                          className="text-[#606d76]"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ─── Assigned To ─── */}
            <section className="space-y-4 pb-2">
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-medium text-[#0b191f]">Assigned to</p>
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(true)}
                  className="inline-flex size-10 items-center justify-center rounded-[12px] border border-[#ebedee] bg-white text-[#0b191f] shadow-[0px_8px_2px_0px_rgba(14,14,34,0),0px_5px_2px_0px_rgba(14,14,34,0.01),0px_3px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                >
                  <UserRoundPlus size={16} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                {assignedMember ? (
                  <div className="relative">
                    <div
                      className="flex size-[40px] items-center justify-center rounded-full border-2 border-[#0b191f] text-[16px] font-medium leading-none text-white"
                      style={{ backgroundColor: AVATAR_COLORS[assignedMember.id % AVATAR_COLORS.length] }}
                    >
                      {assignedMember.initials}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-white bg-black">
                      <Check size={10} className="text-white" />
                    </div>
                  </div>
                ) : task.assigned_to ? (
                  <div className="relative">
                    <div
                      className="flex size-[40px] items-center justify-center rounded-full border-2 border-[#0b191f] text-[16px] font-medium leading-none text-white"
                      style={{ backgroundColor: AVATAR_COLORS[0] }}
                    >
                      U{task.assigned_to}
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] text-[#727d83]">No one assigned</p>
                )}
              </div>
            </section>

            {/* ─── Update Task button ─── */}
            <div className="border-t border-[#ebedee] pt-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleUpdateTask}
                  className={`h-12 rounded-[12px] px-8 text-[14px] font-medium ${
                    updateTaskMutation.isPending
                      ? 'bg-[#ebedee] text-[#9ea7ad] cursor-not-allowed'
                      : 'bg-[#24B5F8] text-white hover:bg-[#1da8ea]'
                  }`}
                  disabled={updateTaskMutation.isPending}
                >
                  {updateTaskMutation.isPending ? 'Saving…' : 'Update Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ═══ RIGHT SIDEBAR ═══ */}
      <aside className="min-h-0 w-[362px] overflow-y-auto border-l border-[#ebedee] bg-white p-9">
        <div className="space-y-12 pb-10">
          {/* Status */}
          <div className="space-y-4">
            <p className="text-[16px] font-medium text-[#0b191f]">Status</p>
            <div className="relative">
              <button
                type="button"
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="flex h-[46px] w-full items-center justify-between rounded-[8px] border border-[#e9e9e9] bg-white px-4"
              >
                <span className="text-[16px] font-medium text-[#0b191f]">{statusLabel(status)}</span>
                <ChevronDown size={16} />
              </button>
              {statusDropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-[8px] border border-[#e9e9e9] bg-white shadow-md">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleStatusChange(opt.value)}
                      className={`flex w-full items-center px-4 py-3 text-left text-[14px] font-medium hover:bg-[#f0f3f5] ${
                        status === opt.value || (status === 'in-progress' && opt.value === 'in_progress') ? 'bg-[#f0f3f5] text-[#0b191f]' : 'text-[#606d76]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Scope */}
          <div className="space-y-4">
            <p className="text-[16px] font-medium text-[#0b191f]">Scope</p>
            <div className="relative">
              <button
                type="button"
                onClick={() => setScopeDropdownOpen(!scopeDropdownOpen)}
                className="flex h-[46px] w-full items-center justify-between rounded-[8px] border border-[#e9e9e9] bg-white px-4"
              >
                <span className="text-[16px] font-medium text-[#0b191f]">{scopeLabel(scope)}</span>
                <ChevronDown size={16} />
              </button>
              {scopeDropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-[8px] border border-[#e9e9e9] bg-white shadow-md">
                  {SCOPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleScopeChange(opt.value)}
                      className={`flex w-full items-center px-4 py-3 text-left text-[14px] font-medium hover:bg-[#f0f3f5] ${
                        scope === opt.value ? 'bg-[#f0f3f5] text-[#0b191f]' : 'text-[#606d76]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-2 text-[16px]">
            <p className="mb-4 text-[16px] font-medium text-[#0b191f]">Dates</p>
            {task.created_at && (
              <div className="flex justify-between">
                <span className="text-[#727d83]">Created</span>
                <span className="text-[#0b191f]">{formatDueDate(task.created_at)}</span>
              </div>
            )}
            {task.updated_at && (
              <div className="flex justify-between">
                <span className="text-[#727d83]">Last update</span>
                <span className="text-[#0b191f]">{formatDueDate(task.updated_at)}</span>
              </div>
            )}
          </div>

          {/* Time tracked */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[16px] font-medium text-[#0b191f]">Time tracked</p>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-[#24B5F8] px-4 text-[14px] font-medium text-white"
              >
                <Plus size={16} />
                Log Time
              </button>
            </div>
            <div className="flex justify-between text-[16px]">
              <span className="text-[#727d83]">Logged</span>
              <span className="text-[#0b191f]">—</span>
            </div>
          </div>

          {/* Activity */}
          <div className="space-y-4">
            <p className="text-[16px] font-medium text-[#0b191f]">Activity</p>
            {timelineLoading ? (
              <div className="space-y-4">
                {[0, 1].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="size-[50px] shrink-0 animate-pulse rounded-[99px] bg-[#e4eaec]" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 w-20 animate-pulse rounded bg-[#e4eaec]" />
                      <div className="h-4 w-40 animate-pulse rounded bg-[#e4eaec]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : timeline && timeline.length > 0 ? (
              timeline.map((entry) => (
                <div key={entry.id} className="flex gap-4">
                  <div className="mt-1 flex size-[50px] shrink-0 items-center justify-center rounded-[99px] bg-[#edf0f3]">
                    <Activity size={16} className="text-[#727d83]" />
                  </div>
                  <div>
                    <p className="text-[12px] text-[#727d83]">
                      {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                    </p>
                    <p className="text-[16px] leading-none text-[#0b191f]">{timelineActorName(entry)}</p>
                    <p className="text-[12px] text-[#727d83]">{getActivityLabel(entry, members)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[13px] text-[#727d83]">No activity logged yet.</p>
            )}
          </div>
        </div>
      </aside>

      {/* ═══ MODALS ═══ */}
      <AddTaskResourceModal
        open={resourceModalOpen}
        onOpenChange={setResourceModalOpen}
        taskId={taskId}
      />
      <AssignMemberModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        projectId={task.project_id}
        taskId={taskId}
        currentAssigneeId={task.assigned_to ?? null}
      />
    </div>
  );
}
