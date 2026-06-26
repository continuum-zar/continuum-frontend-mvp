import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DEFAULT_KANBAN_COLUMNS, mapKanbanBoardFromApi, type KanbanColumnConfig } from '@/app/components/dashboard-placeholder/kanbanBoardTypes';
import { TaskDescriptionMarkdown } from '@/app/components/TaskDescriptionMarkdown';
import { useAutosizeTextarea } from '@/hooks/useAutosizeTextarea';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router';
import { projectSprintHref } from '@/app/data/dashboardPlaceholderProjects';
import { workspaceJoin } from '@/lib/workspacePaths';
import { resolveDefaultBoardPath } from '@/lib/defaultBoardPath';
import { shouldPauseTaskDetailChecklistSyncFromServer } from '@/lib/taskDetailChecklistSync';
import {
  ArrowLeft,
  Activity,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileText,
  Flag,
  GripVertical,
  Link2,
  Loader2,
  Plus,
  Tag,
  UserRoundPlus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  formatDueDate,
  formatEstimatedEffortLabel,
  useTask,
  useUpdateTask,
  useTaskAttachments,
  useDeleteAttachment,
  downloadTaskAttachment,
  mapAttachment,
  getAttachmentLinkHref,
  getAttachmentLinkLabel,
  useTaskTimelineInfinite,
  useProjectMembers,
  useAddTaskLabel,
  useRemoveTaskLabel,
  useProjectRepositories,
  useProjectKanbanBoard,
  useProjectTasks,
  useTaskCommentsInfinite,
  useCreateTaskComment,
  useSetTaskAssignees,
  useDeleteTask,
} from '@/api';
import { getApiErrorMessage, useTaskLoggedHoursTotal } from '@/api/hooks';
import type { Attachment } from '@/types/attachment';
import { formatDistanceToNow } from 'date-fns';
import {
  TASK_PRIORITY_OPTIONS,
  getTaskAssigneeUserIds,
  getTaskLinkedBranches,
  taskPriorityFlagClass,
  taskPriorityLabel,
  type ScopeWeight,
  type TaskPriority,
  type TaskTimelineEntry,
  type TaskAPIResponse,
  type TaskSection,
} from '@/types/task';
import type { CommentAuthorAPI } from '@/types/comment';
import { CommentBody } from '@/app/components/comments/CommentBody';
import { CommentMentionTextarea } from '@/app/components/comments/CommentMentionTextarea';
import type { Member } from '@/types/member';
import {
  AddTaskResourceModal,
  type TaskResourcePendingUploadRow,
} from '../components/AddTaskResourceModal';
import { TaskLinkedBranchesSection } from '../components/TaskLinkedBranchesSection';
import { AssignMemberModal } from '../components/AssignMemberModal';
import { useChecklistItemDrag, reorderChecklistItems } from '@/lib/useChecklistItemDrag';
import {
  ConfirmDialog,
} from '@/app/components/ui/confirm-dialog';
import { BuildTaskModal } from '../components/BuildTaskModal';
import { BuildRunDrawer } from '../components/BuildRunDrawer';
import { ReviewRunDrawer } from '../components/ReviewRunDrawer';
import { LogTimeModal } from '../components/dashboard-placeholder/LogTimeModal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import { buildCursorMcpTaskShareUrl } from '@/lib/cursorMcpShareUrl';
import { useAgentRun, useStartReview, useTaskAgentRuns } from '@/api';
import { isAgentRunActive, isAgentRunTerminal } from '@/types/agentRun';
import { memberAvatarBackground } from '@/lib/memberAvatar';

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

function statusLabelFromBoard(stored: string, columns: KanbanColumnConfig[]): string {
  const col = columns.find((c) => c.id === stored);
  if (col) return col.title;
  return statusLabel(taskStatusToDisplay(stored));
}

function scopeLabel(s: string): string {
  const map: Record<string, string> = { XS: 'Extra Small (XS)', S: 'Small (S)', M: 'Medium (M)', L: 'Large (L)', XL: 'Extra Large (XL)' };
  return map[s] ?? 'Medium (M)';
}

function formatLoggedHoursSum(hours: number): string {
  if (!Number.isFinite(hours) || hours < 0) return '0';
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(hours);
}

/**
 * Task URLs must include `?project=` (and related sprint params) or the workspace shell
 * renders the static Get started mock (`TaskPanels`) instead of real `TaskDetail`.
 */
function buildTaskWorkspaceHref(
  targetTaskId: number | string,
  searchParams: URLSearchParams,
  projectId?: number | string | null,
): string {
  const params = new URLSearchParams(searchParams);
  params.delete('edit');
  const project =
    params.get('project') ?? (projectId != null && projectId !== '' ? String(projectId) : null);
  if (project) params.set('project', project);
  const qs = params.toString();
  const path = workspaceJoin('task', String(targetTaskId));
  return qs ? `${path}?${qs}` : path;
}

const SCOPE_OPTIONS: { value: ScopeWeight; label: string }[] = [
  { value: 'XS', label: 'Extra Small (XS)' },
  { value: 'S', label: 'Small (S)' },
  { value: 'M', label: 'Medium (M)' },
  { value: 'L', label: 'Large (L)' },
  { value: 'XL', label: 'Extra Large (XL)' },
];

/** Task sidebar: initial rows and each “Show more” step for Comments + Activity. */
const TASK_DETAIL_FEED_PAGE = 3;

/** Coalesce rapid checklist edits into a single PUT. */
const TASK_DETAIL_CHECKLIST_DEBOUNCE_MS = 400;

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

  const statusLineLabel = (raw: unknown, label: unknown): string => {
    const fromApi = typeof label === 'string' && label.trim() ? label.trim() : '';
    if (fromApi) return fromApi;
    const s = typeof raw === 'string' && raw ? raw : 'unknown';
    return formatStatus(s);
  };

  switch (entry.activity_type) {
    case 'task_created':
      return 'created this task';
    case 'status_changed':
      return `changed status from ${statusLineLabel(entry.data?.old_status, entry.data?.old_status_label)} to ${statusLineLabel(entry.data?.new_status, entry.data?.new_status_label)}`;
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

function commentAuthorDisplayName(author: CommentAuthorAPI): string {
  const d = author.display_name?.trim();
  if (d) return d;
  const u = author.username?.trim();
  if (u) return u;
  return `User #${author.id}`;
}

function commentAuthorInitials(author: CommentAuthorAPI): string {
  const name = author.display_name?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  const u = author.username?.trim();
  if (u) return u.slice(0, 2).toUpperCase();
  return `U${author.id}`;
}

function TaskCommentAvatar({ author }: { author: CommentAuthorAPI }) {
  return (
    <div
      className="flex size-[40px] shrink-0 items-center justify-center rounded-full border-2 border-[#0b191f] text-[16px] font-medium leading-none text-white"
      style={{ backgroundColor: memberAvatarBackground(author.id) }}
    >
      {commentAuthorInitials(author)}
    </div>
  );
}

/* ─── skeleton ─── */

function TaskDetailSkeleton() {
  return (
    <div className="relative flex h-full w-full min-h-0 items-stretch font-['Satoshi',sans-serif]">
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

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function TaskResourceRow({
  attachment,
  onDelete,
  deletePending,
}: {
  attachment: Attachment;
  onDelete: () => void;
  deletePending: boolean;
}) {
  const [downloading, setDownloading] = useState(false);
  const linkHref = getAttachmentLinkHref(attachment);
  const linkLabel = getAttachmentLinkLabel(attachment);

  if (attachment.kind === 'link') {
    return (
      <div className="flex w-full items-center gap-2">
        <div className="flex min-h-[34px] min-w-0 flex-1 items-stretch overflow-hidden rounded-[8px] border border-solid border-[#ededed] pr-2">
          <div className="flex w-[50px] shrink-0 items-center justify-center self-stretch bg-[#edf0f3]">
            <Link2 className="size-4 text-[#606d76]" strokeWidth={1.75} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center border-l border-solid border-[#ededed] px-4 py-1.5">
            {linkHref ? (
              <a
                href={linkHref}
                target="_blank"
                rel="noopener noreferrer"
                title={linkHref}
                className="break-words font-['Satoshi',sans-serif] text-[16px] font-medium leading-normal text-[#1466ff] underline decoration-[#1466ff]/40 underline-offset-2 hover:text-[#0d52cc]"
              >
                {linkLabel}
              </a>
            ) : (
              <p className="break-words font-['Satoshi',sans-serif] text-[16px] font-medium leading-normal text-[#0b191f]">
                {attachment.filename}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 text-[#606d76] disabled:opacity-50"
          aria-label="Remove"
          disabled={deletePending}
          onClick={onDelete}
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-2">
      <div className="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-[8px] border border-solid border-[#ededed] pr-2">
        <div className="flex w-[50px] shrink-0 items-center justify-center self-stretch bg-[#edf0f3]">
          <FileText className="size-4 text-[#606d76]" strokeWidth={1.75} />
        </div>
        <div className="flex min-h-[50px] min-w-0 flex-1 flex-col justify-center border-l border-solid border-[#ededed] px-4 py-1.5">
          <p className="min-w-0 break-words font-['Satoshi',sans-serif] text-[16px] font-medium leading-normal text-[#0b191f]">
            {attachment.filename}
          </p>
          {attachment.size ? (
            <p className="font-['Satoshi',sans-serif] text-[12px] font-medium leading-normal text-[#727d83]">
              {attachment.size}
            </p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        disabled={downloading || deletePending}
        className="inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-[#606d76] transition-colors hover:bg-[#edf0f3] hover:text-[#0b191f] disabled:opacity-50"
        aria-label="Download"
        onClick={async () => {
          setDownloading(true);
          try {
            const { blob, filename } = await downloadTaskAttachment(attachment.id);
            triggerBlobDownload(blob, filename || attachment.filename);
          } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to download file'));
          } finally {
            setDownloading(false);
          }
        }}
      >
        <Download className="size-4" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        className="inline-flex shrink-0 self-center text-[#606d76] disabled:opacity-50"
        aria-label="Remove"
        disabled={deletePending}
        onClick={onDelete}
      >
        <X className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}

function TaskPendingUploadRow({
  row,
  onDismiss,
}: {
  row: TaskResourcePendingUploadRow;
  onDismiss: () => void;
}) {
  const uploading = row.status === 'uploading';
  return (
    <div className="flex w-full items-center gap-2">
      <div className="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-[8px] border border-solid border-[#ededed] pr-2">
        <div className="flex w-[50px] shrink-0 items-center justify-center self-stretch bg-[#edf0f3]">
          {uploading ? (
            <Loader2 className="size-4 animate-spin text-[#606d76] motion-reduce:animate-none" aria-hidden />
          ) : (
            <FileText className="size-4 text-[#b42318]" strokeWidth={1.75} />
          )}
        </div>
        <div className="flex min-h-[50px] min-w-0 flex-1 flex-col justify-center border-l border-solid border-[#ededed] px-4 py-1.5">
          <p className="min-w-0 break-words font-['Satoshi',sans-serif] text-[16px] font-medium leading-normal text-[#0b191f]">
            {row.filename}
          </p>
          <p className="font-['Satoshi',sans-serif] text-[12px] font-medium leading-normal text-[#727d83]">
            {uploading ? 'Uploading…' : row.errorMessage ?? 'Upload failed'}
          </p>
        </div>
      </div>
      {!uploading ? (
        <button
          type="button"
          className="inline-flex shrink-0 self-center rounded-md p-1.5 text-[#606d76] hover:bg-[#edf0f3] hover:text-[#0b191f]"
          aria-label="Dismiss"
          onClick={onDismiss}
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>
      ) : null}
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
          onClick={() => {
            void resolveDefaultBoardPath().then((path) => navigate(path));
          }}
          className="rounded-[8px] bg-[#24B5F8] px-6 py-2 text-[14px] font-bold text-white"
        >
          Go to board
        </button>
      </div>
    </div>
  );
}

type NamedChecklistItem = { id?: string; text: string; done: boolean };

/**
 * A checklist: drag-reorderable rows with single-click-to-toggle /
 * double-click-to-edit, an "Add item" button, and an empty-state line.
 *
 * Owns its edit/draft/drag state internally so it can be reused for both the
 * default task checklist and every named checklist section — guaranteeing the
 * two render and behave identically.
 */
function ChecklistItems({
  items,
  onItemsChange,
}: {
  items: NamedChecklistItem[];
  onItemsChange: (next: NamedChecklistItem[]) => void;
}) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const clickTimerRef = useRef<number | null>(null);
  const drag = useChecklistItemDrag((from, to) => onItemsChange(reorderChecklistItems(items, from, to)));

  useEffect(() => {
    return () => {
      if (clickTimerRef.current != null) {
        window.clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
    };
  }, []);

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setDraft(items[idx].text);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const toggle = (idx: number) => {
    onItemsChange(items.map((it, i) => (i === idx ? { ...it, done: !it.done } : it)));
  };

  /** Single click toggles the checkbox; a second click within 250ms cancels and starts editing instead. */
  const handleRowClick = (idx: number) => {
    if (editingIdx === idx) return;
    if (clickTimerRef.current != null) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      return;
    }
    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = null;
      toggle(idx);
    }, 250);
  };

  const handleRowDoubleClick = (idx: number) => {
    if (clickTimerRef.current != null) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    startEdit(idx);
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    const trimmed = draft.trim();
    onItemsChange(
      trimmed
        ? items.map((it, i) => (i === editingIdx ? { ...it, text: trimmed } : it))
        : items.filter((_, i) => i !== editingIdx),
    );
    setEditingIdx(null);
  };

  /** Commit the current edit (or drop the row if empty) and immediately add a new empty row in edit mode. */
  const saveEditAndAddNew = () => {
    if (editingIdx === null) return;
    const trimmed = draft.trim();
    const committed = trimmed
      ? items.map((it, i) => (i === editingIdx ? { ...it, text: trimmed } : it))
      : items.filter((_, i) => i !== editingIdx);
    const next = [...committed, { text: '', done: false }];
    onItemsChange(next);
    setEditingIdx(next.length - 1);
    setDraft('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const addItem = () => {
    const next = [...items, { text: 'New checklist', done: false }];
    onItemsChange(next);
    setEditingIdx(next.length - 1);
    setDraft('New checklist');
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-[13px] text-[#727d83]">No checklist items yet</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => {
            const isEditing = editingIdx === idx;
            const isDragging = drag.draggingIdx === idx;
            const isDragTarget =
              drag.draggingIdx !== null && drag.draggingIdx !== idx && drag.overIdx === idx;
            return (
              <div
                key={idx}
                data-checklist-row
                className={`group/row flex items-start gap-2 rounded-md -mx-1 px-1 py-0.5 ${isEditing ? '' : 'cursor-pointer select-none hover:bg-[#f3f5f7]'} ${isDragging ? 'opacity-40' : ''} ${isDragTarget ? 'ring-2 ring-[#24B5F8]/40' : ''}`}
                onClick={isEditing ? undefined : () => handleRowClick(idx)}
                onDoubleClick={isEditing ? undefined : () => handleRowDoubleClick(idx)}
              >
                <button
                  type="button"
                  onPointerDown={drag.onHandlePointerDown(idx)}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  aria-label="Reorder checklist item"
                  className="mt-0.5 inline-flex size-5 shrink-0 cursor-grab touch-none items-center justify-center rounded-[4px] border-0 bg-transparent text-[#9fa5a8] opacity-0 transition-opacity hover:text-[#0b191f] focus-visible:opacity-100 group-hover/row:opacity-100 active:cursor-grabbing"
                >
                  <GripVertical size={14} strokeWidth={2} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRowClick(idx);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleRowDoubleClick(idx);
                  }}
                  aria-pressed={item.done}
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[4px] border border-black ${item.done ? 'bg-[#24B5F8]' : 'bg-[#f9f9f9]'}`}
                >
                  {item.done ? <Check size={13} className="text-white" /> : null}
                </button>
                {isEditing ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={saveEdit}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        saveEditAndAddNew();
                      }
                      if (e.key === 'Escape') setEditingIdx(null);
                    }}
                    className="min-w-0 flex-1 border-0 bg-transparent font-['Inter',sans-serif] text-[13px] font-normal leading-[19px] tracking-normal text-[#0b191f] outline-none"
                  />
                ) : (
                  <p
                    className={`min-w-0 flex-1 break-words font-['Inter',sans-serif] text-[13px] font-normal leading-[19px] tracking-normal ${item.done ? 'text-[#0b191f]/50 line-through' : 'text-[#0b191f]'}`}
                  >
                    {item.text}
                  </p>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemsChange(items.filter((_, i) => i !== idx));
                    if (editingIdx === idx) setEditingIdx(null);
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  aria-label="Remove checklist item"
                  className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-[4px] border-0 bg-transparent text-[#727d83] opacity-0 transition-opacity hover:bg-[#f3f5f7] hover:text-[#b91c1c] focus-visible:opacity-100 group-hover/row:opacity-100"
                >
                  <X size={12} strokeWidth={2} aria-hidden />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <button
        type="button"
        onClick={addItem}
        className="inline-flex items-center gap-1.5 rounded-[6px] px-2 py-1 text-[13px] font-medium text-[#606d76] transition-colors hover:bg-[#f3f5f7] hover:text-[#0b191f]"
      >
        <Plus size={12} /> Add item
      </button>
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
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const state = (location.state as { projectId?: string | number } | undefined) || {};

  /* ─ data hooks ─ */
  const { data: task, isLoading: loading, error: taskError } = useTask(taskId);
  const { data: loggedHoursTotal, isLoading: hoursLoading, isError: hoursError } = useTaskLoggedHoursTotal(
    task?.project_id ?? null,
    taskId ?? null,
    { enabled: Boolean(taskId && task?.project_id != null) },
  );
  const updateTaskMutation = useUpdateTask();
  const checklistDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checklistPendingRef = useRef<Array<{ id?: string; text: string; done: boolean }> | null>(null);
  const checklistInflightRef = useRef(false);
  // Last server-confirmed checklist value; used to revert local UI on failed writes.
  const checklistBaselineRef = useRef<Array<{ id?: string; text: string; done: boolean }>>([]);
  const sectionsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionsPendingRef = useRef<TaskSection[] | null>(null);
  // Last server-confirmed sections value; used to revert local UI on failed writes.
  const sectionsBaselineRef = useRef<TaskSection[]>([]);
  const { data: attachments } = useTaskAttachments(taskId);
  const deleteAttachmentMutation = useDeleteAttachment(taskId);
  const timelineQuery = useTaskTimelineInfinite(taskId);
  const timeline = timelineQuery.data?.pages.flatMap((p) => p.entries) ?? [];
  const timelineLoading = timelineQuery.isLoading;
  const commentsQuery = useTaskCommentsInfinite(taskId);
  const commentsLoading = commentsQuery.isLoading;
  const commentsSorted = useMemo(
    () =>
      [...(commentsQuery.data?.pages.flatMap((p) => p.comments) ?? [])].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    [commentsQuery.data],
  );
  const createCommentMutation = useCreateTaskComment(taskId);
  const { data: members } = useProjectMembers(task?.project_id, { enabled: !!task?.project_id });
  const addTaskLabelMutation = useAddTaskLabel(taskId);
  const removeTaskLabelMutation = useRemoveTaskLabel(taskId);
  const taskDetailQueryKey = ['tasks', 'detail', taskId] as const;
  const { data: projectRepos = [], isLoading: reposLoading } = useProjectRepositories(task?.project_id);
  const { data: kanbanColumnsApi = [] } = useProjectKanbanBoard(task?.project_id ?? null);
  const { data: projectTasks = [] } = useProjectTasks(task?.project_id ?? null);
  const boardColumns = useMemo(() => {
    if (kanbanColumnsApi.length > 0) return mapKanbanBoardFromApi(kanbanColumnsApi);
    return [...DEFAULT_KANBAN_COLUMNS];
  }, [kanbanColumnsApi]);
  const statusOptions = useMemo(
    () => boardColumns.map((c) => ({ value: c.id, label: c.title })),
    [boardColumns],
  );
  /* ─ local state ─ */
  const [status, setStatus] = useState('');
  const [scope, setScope] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [localChecklists, setLocalChecklists] = useState<Array<{ id?: string; text: string; done: boolean }>>([]);
  const [localSections, setLocalSections] = useState<TaskSection[]>([]);
  /** Track which section's name input is being actively edited (so its draft doesn't get clobbered by server sync). */
  const [editingSectionNameIdx, setEditingSectionNameIdx] = useState<number | null>(null);
  const [addingTag, setAddingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState('New tag');
  const [addingEffort, setAddingEffort] = useState(false);
  const [effortDraft, setEffortDraft] = useState('');
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [pendingUploadRows, setPendingUploadRows] = useState<TaskResourcePendingUploadRow[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const setAssigneesMutation = useSetTaskAssignees();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [dependencyModalOpen, setDependencyModalOpen] = useState(false);
  const [dependencySearch, setDependencySearch] = useState('');
  const [selectedDependencies, setSelectedDependencies] = useState<number[]>([]);
  const [logTimeOpen, setLogTimeOpen] = useState(false);
  const [buildModalOpen, setBuildModalOpen] = useState(false);
  const [buildDrawerRunId, setBuildDrawerRunId] = useState<string | null>(null);
  const [buildDrawerOpen, setBuildDrawerOpen] = useState(false);
  const [reviewDrawerReviewId, setReviewDrawerReviewId] = useState<string | null>(null);
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [scopeDropdownOpen, setScopeDropdownOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [mcpLinkCopied, setMcpLinkCopied] = useState(false);
  const [visibleCommentCount, setVisibleCommentCount] = useState(TASK_DETAIL_FEED_PAGE);
  const [visibleActivityCount, setVisibleActivityCount] = useState(TASK_DETAIL_FEED_PAGE);

  const cursorMcpShareUrl = useMemo(() => {
    if (typeof window === 'undefined' || !taskId) return '';
    return buildCursorMcpTaskShareUrl(window.location.origin, taskId);
  }, [taskId]);

  /* ─ agentic build runs ─ */
  const taskAgentRunsQuery = useTaskAgentRuns(taskId, { enabled: !!taskId, limit: 5 });
  const taskLinkedBranchCount = useMemo(() => {
    if (!task) return 0;
    return getTaskLinkedBranches(task).filter(
      (b) =>
        typeof b.linked_repo === 'string' &&
        b.linked_repo.trim() !== '' &&
        typeof b.linked_branch === 'string' &&
        b.linked_branch.trim() !== '',
    ).length;
  }, [task]);
  const activeAgentRun = useMemo(() => {
    const list = taskAgentRunsQuery.data?.runs ?? [];
    return list.find((r) => isAgentRunActive(r.status)) ?? null;
  }, [taskAgentRunsQuery.data]);

  // The most-recent terminal build: if it succeeded with reviewable
  // artefacts (PR url for open_pr / commit sha for direct_push), the
  // primary action flips from "Build" to "Review".
  const latestTerminalBuild = useMemo(() => {
    const list = taskAgentRunsQuery.data?.runs ?? [];
    return list.find((r) => isAgentRunTerminal(r.status)) ?? null;
  }, [taskAgentRunsQuery.data]);

  const reviewableBuild = useMemo(() => {
    if (!latestTerminalBuild || latestTerminalBuild.status !== 'succeeded') return null;
    const hasPrereq =
      (latestTerminalBuild.mode === 'open_pr' && !!latestTerminalBuild.pr_url) ||
      (latestTerminalBuild.mode === 'direct_push' && !!latestTerminalBuild.commit_sha);
    return hasPrereq ? latestTerminalBuild : null;
  }, [latestTerminalBuild]);

  // Detail GET on the reviewable build surfaces latest_review (if any) so we
  // can decide between starting a new review and opening the existing one.
  const reviewableBuildDetailQuery = useAgentRun(
    taskId,
    reviewableBuild?.id ?? null,
    { enabled: !!reviewableBuild },
  );
  const existingReviewId = reviewableBuildDetailQuery.data?.latest_review?.id ?? null;

  // Sync ?build=<runId> and ?review=<reviewId> on the URL with the drawer
  // state so refresh keeps the live view open.
  useEffect(() => {
    const urlRun = searchParams.get('build');
    if (urlRun && urlRun !== buildDrawerRunId) {
      setBuildDrawerRunId(urlRun);
      setBuildDrawerOpen(true);
    } else if (!urlRun && buildDrawerOpen && buildDrawerRunId == null) {
      setBuildDrawerOpen(false);
    }
    const urlReview = searchParams.get('review');
    if (urlReview && urlReview !== reviewDrawerReviewId) {
      setReviewDrawerReviewId(urlReview);
      setReviewDrawerOpen(true);
    } else if (!urlReview && reviewDrawerOpen && reviewDrawerReviewId == null) {
      setReviewDrawerOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const openBuildDrawer = useCallback(
    (runId: string) => {
      setBuildDrawerRunId(runId);
      setBuildDrawerOpen(true);
      const next = new URLSearchParams(searchParams);
      next.set('build', runId);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const closeBuildDrawer = useCallback(
    (open: boolean) => {
      setBuildDrawerOpen(open);
      if (!open) {
        const next = new URLSearchParams(searchParams);
        next.delete('build');
        setSearchParams(next, { replace: true });
      }
    },
    [searchParams, setSearchParams],
  );

  const openReviewDrawer = useCallback(
    (reviewId: string) => {
      setReviewDrawerReviewId(reviewId);
      setReviewDrawerOpen(true);
      const next = new URLSearchParams(searchParams);
      next.set('review', reviewId);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const closeReviewDrawer = useCallback(
    (open: boolean) => {
      setReviewDrawerOpen(open);
      if (!open) {
        const next = new URLSearchParams(searchParams);
        next.delete('review');
        setSearchParams(next, { replace: true });
      }
    },
    [searchParams, setSearchParams],
  );

  // Start a review for the latest succeeded build (or reopen the existing one).
  const startReviewMutation = useStartReview(taskId ?? '', reviewableBuild?.id ?? '');
  const handleOpenReview = useCallback(() => {
    if (!reviewableBuild) return;
    if (existingReviewId) {
      openReviewDrawer(existingReviewId);
      return;
    }
    startReviewMutation.mutate(undefined, {
      onSuccess: (r) => openReviewDrawer(r.id),
    });
  }, [reviewableBuild, existingReviewId, openReviewDrawer, startReviewMutation]);

  const handleOpenBuildModal = useCallback(() => {
    if (taskLinkedBranchCount === 0) {
      toast.error('Link at least one repository and branch before starting a build.');
      return;
    }
    if (activeAgentRun) {
      openBuildDrawer(activeAgentRun.id);
      return;
    }
    if (reviewableBuild) {
      // Hard swap: once a build has succeeded and is reviewable, the primary
      // action becomes Review. The user reviews (or reopens the verdict) before
      // running anything new.
      handleOpenReview();
      return;
    }
    setBuildModalOpen(true);
  }, [
    taskLinkedBranchCount,
    activeAgentRun,
    openBuildDrawer,
    reviewableBuild,
    handleOpenReview,
  ]);

  const handleCopyCursorMcpUrl = useCallback(async () => {
    if (!cursorMcpShareUrl) return;
    try {
      await navigator.clipboard.writeText(cursorMcpShareUrl);
      setMcpLinkCopied(true);
      toast.success('Link copied, paste it into Cursor chat to open this task view.');
      window.setTimeout(() => setMcpLinkCopied(false), 2000);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }, [cursorMcpShareUrl]);

  useEffect(() => {
    setVisibleCommentCount(TASK_DETAIL_FEED_PAGE);
    setVisibleActivityCount(TASK_DETAIL_FEED_PAGE);
  }, [taskId]);

  useEffect(() => {
    if (taskId == null) return;
    if (
      visibleCommentCount > commentsSorted.length &&
      commentsQuery.hasNextPage &&
      !commentsQuery.isFetchingNextPage
    ) {
      void commentsQuery.fetchNextPage();
    }
  }, [
    taskId,
    visibleCommentCount,
    commentsSorted.length,
    commentsQuery.hasNextPage,
    commentsQuery.isFetchingNextPage,
    commentsQuery,
  ]);

  useEffect(() => {
    if (taskId == null) return;
    if (
      visibleActivityCount > timeline.length &&
      timelineQuery.hasNextPage &&
      !timelineQuery.isFetchingNextPage
    ) {
      void timelineQuery.fetchNextPage();
    }
  }, [
    taskId,
    visibleActivityCount,
    timeline.length,
    timelineQuery.hasNextPage,
    timelineQuery.isFetchingNextPage,
    timelineQuery,
  ]);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useAutosizeTextarea(descDraft, { minPx: 106, maxPx: 560 });
  const commentTextareaRef = useAutosizeTextarea(commentDraft, { minPx: 80, maxPx: 220 });
  const tagInputRef = useRef<HTMLInputElement>(null);
  const effortInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checklistInflightRef.current = false;
    checklistPendingRef.current = null;
    checklistBaselineRef.current = [];
    if (checklistDebounceRef.current != null) {
      clearTimeout(checklistDebounceRef.current);
      checklistDebounceRef.current = null;
    }
    sectionsPendingRef.current = null;
    sectionsBaselineRef.current = [];
    if (sectionsDebounceRef.current != null) {
      clearTimeout(sectionsDebounceRef.current);
      sectionsDebounceRef.current = null;
    }
  }, [taskId]);

  /* ─ init from task ─ */
  useEffect(() => {
    if (task) {
      setStatus(task.status ?? 'todo');
      setPriority((task.priority ?? 'medium') as TaskPriority);
      setScope((task.scope_weight ?? 'M') as string);
      const pauseChecklistSync = shouldPauseTaskDetailChecklistSyncFromServer({
        debounceTimerActive: checklistDebounceRef.current != null,
        awaitingDebouncedPayload: checklistPendingRef.current != null,
        checklistSaveInFlight: checklistInflightRef.current,
      });
      if (!pauseChecklistSync) {
        const fromServer = task.checklists && Array.isArray(task.checklists) ? [...task.checklists] : [];
        setLocalChecklists(fromServer);
        checklistBaselineRef.current = fromServer;
      }
      if (editingSectionNameIdx === null) {
        const fromServer = Array.isArray(task.sections) ? [...task.sections] : [];
        setLocalSections(fromServer);
        sectionsBaselineRef.current = fromServer;
      }
      // Keep drafts in sync so "Update" does not send empty description/title when the user never opened edit mode.
      if (!editingTitle) setTitleDraft(task.title ?? '');
      if (!editingDesc) setDescDraft(task.description ?? '');
      setSelectedDependencies(Array.isArray(task.dependencies) ? task.dependencies : []);
    }
  }, [task, editingTitle, editingDesc]);

  /* Kanban context menu: open task with ?edit=title to focus title editing */
  useEffect(() => {
    if (searchParams.get('edit') !== 'title' || !task) return;
    setTitleDraft(task.title ?? '');
    setEditingTitle(true);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('edit');
        return next;
      },
      { replace: true },
    );
    window.setTimeout(() => titleInputRef.current?.focus(), 0);
  }, [task, searchParams, setSearchParams]);

  /* ─ navigation ─ */
  const handleNavigateBack = () => {
    if (onBack) { onBack(); return; }
    const projectId = task?.project_id ?? state.projectId;
    if (projectId != null) navigate(projectSprintHref(String(projectId)));
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

  /* ─ checklist (debounced PUT; local state updates immediately) ─ */
  const saveChecklists = useCallback(
    (next: Array<{ id?: string; text: string; done: boolean }>) => {
      setLocalChecklists(next);
      checklistPendingRef.current = next;
      if (checklistDebounceRef.current != null) clearTimeout(checklistDebounceRef.current);
      checklistDebounceRef.current = window.setTimeout(() => {
        checklistDebounceRef.current = null;
        const pending = checklistPendingRef.current;
        checklistPendingRef.current = null;
        if (pending != null && taskId) {
          // Capture the last-known-good baseline at send time so a rapid burst of
          // optimistic toggles all revert to the pre-burst state on failure.
          const revertTo = checklistBaselineRef.current;
          checklistInflightRef.current = true;
          updateTaskMutation.mutate(
            { taskId, checklists: pending },
            {
              onSuccess: (data) => {
                if (Array.isArray(data?.checklists)) {
                  checklistBaselineRef.current = [...data.checklists];
                }
              },
              onError: () => {
                // Revert the locally-rendered checklist so the user does not see the
                // optimistic state after the server rejected the write. The toast and
                // query-cache rollback are handled inside useUpdateTask.
                setLocalChecklists(revertTo);
              },
              onSettled: () => {
                checklistInflightRef.current = false;
              },
            },
          );
        }
      }, TASK_DETAIL_CHECKLIST_DEBOUNCE_MS);
    },
    [taskId, updateTaskMutation],
  );

  useEffect(() => {
    return () => {
      if (checklistDebounceRef.current != null) {
        clearTimeout(checklistDebounceRef.current);
        checklistDebounceRef.current = null;
      }
      const pending = checklistPendingRef.current;
      checklistPendingRef.current = null;
      if (pending != null && taskId) {
        checklistInflightRef.current = true;
        updateTaskMutation.mutate(
          { taskId, checklists: pending },
          {
            onSettled: () => {
              checklistInflightRef.current = false;
            },
          },
        );
      }
      if (sectionsDebounceRef.current != null) {
        clearTimeout(sectionsDebounceRef.current);
        sectionsDebounceRef.current = null;
      }
      const pendingSections = sectionsPendingRef.current;
      sectionsPendingRef.current = null;
      if (pendingSections != null && taskId) {
        updateTaskMutation.mutate({ taskId, sections: pendingSections });
      }
    };
  }, [taskId, updateTaskMutation]);

  /* ─ sections (debounced PUT, mirrors the checklist pattern) ─ */
  const saveSections = useCallback(
    (next: TaskSection[]) => {
      setLocalSections(next);
      sectionsPendingRef.current = next;
      if (sectionsDebounceRef.current != null) clearTimeout(sectionsDebounceRef.current);
      sectionsDebounceRef.current = window.setTimeout(() => {
        sectionsDebounceRef.current = null;
        const pending = sectionsPendingRef.current;
        sectionsPendingRef.current = null;
        if (pending != null && taskId) {
          const revertTo = sectionsBaselineRef.current;
          updateTaskMutation.mutate(
            { taskId, sections: pending },
            {
              onSuccess: (data) => {
                if (Array.isArray(data?.sections)) {
                  sectionsBaselineRef.current = [...data.sections];
                }
              },
              onError: () => {
                setLocalSections(revertTo);
              },
            },
          );
        }
      }, TASK_DETAIL_CHECKLIST_DEBOUNCE_MS);
    },
    [taskId, updateTaskMutation],
  );

  const newSectionId = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? `sec-${crypto.randomUUID()}`
      : `sec-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const addSection = (type: TaskSection['type']) => {
    const defaultName = type === 'checklist' ? 'New checklist section' : 'New section';
    const base = { id: newSectionId(), name: defaultName };
    const created: TaskSection =
      type === 'checklist' ? { ...base, type: 'checklist', items: [] } : { ...base, type: 'plain_text', text: '' };
    const next = [...localSections, created];
    setEditingSectionNameIdx(next.length - 1);
    saveSections(next);
  };

  const renameSection = (idx: number, name: string) => {
    const next = localSections.map((s, i) => (i === idx ? { ...s, name } : s));
    setLocalSections(next);
  };

  const commitSectionName = (idx: number) => {
    const section = localSections[idx];
    if (!section) {
      setEditingSectionNameIdx(null);
      return;
    }
    const trimmed = section.name.trim();
    setEditingSectionNameIdx(null);
    if (!trimmed) {
      saveSections(localSections.filter((_, i) => i !== idx));
      return;
    }
    if (trimmed !== section.name) {
      saveSections(localSections.map((s, i) => (i === idx ? { ...s, name: trimmed } : s)));
    } else {
      saveSections(localSections);
    }
  };

  const removeSection = (idx: number) => {
    saveSections(localSections.filter((_, i) => i !== idx));
  };

  const updateChecklistSection = (
    idx: number,
    updater: (items: Array<{ id?: string; text: string; done: boolean }>) => Array<{ id?: string; text: string; done: boolean }>,
  ) => {
    const next = localSections.map((s, i) => {
      if (i !== idx || s.type !== 'checklist') return s;
      return { ...s, items: updater(s.items ?? []) };
    });
    saveSections(next);
  };

  const updatePlainTextSection = (idx: number, text: string) => {
    const next = localSections.map((s, i) => (i === idx && s.type === 'plain_text' ? { ...s, text } : s));
    saveSections(next);
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
      onSuccess: (data) => {
        queryClient.setQueryData<TaskAPIResponse>(taskDetailQueryKey, (prev) =>
          prev ? { ...prev, labels: data.labels } : prev,
        );
      },
    });
  };

  const removeTag = (label: string) => {
    if (!taskId) return;
    removeTaskLabelMutation.mutate(label, {
      onSuccess: (data) => {
        queryClient.setQueryData<TaskAPIResponse>(taskDetailQueryKey, (prev) =>
          prev ? { ...prev, labels: data.labels } : prev,
        );
      },
    });
  };

  const parseEffortHours = (raw: string): number | null => {
    const t = raw.trim().replace(/h$/i, '');
    if (t === '') return null;
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
  };

  const startAddEffort = () => {
    setEffortDraft('');
    setAddingEffort(true);
    setTimeout(() => {
      effortInputRef.current?.focus();
      effortInputRef.current?.select();
    }, 0);
  };

  const saveEffort = () => {
    setAddingEffort(false);
    if (!taskId) return;
    const hours = parseEffortHours(effortDraft);
    if (hours === null) return;
    updateTaskMutation.mutate({ taskId, estimated_hours: hours });
  };

  const clearEffort = () => {
    if (!taskId) return;
    updateTaskMutation.mutate({ taskId, estimated_hours: null });
  };

  /* ─ status / scope ─ */
  const handleStatusChange = (newColumnId: string) => {
    setStatus(newColumnId);
    setStatusDropdownOpen(false);
    if (taskId) updateTaskMutation.mutate({ taskId, status: newColumnId });
  };

  const handleScopeChange = (newScope: string) => {
    setScope(newScope);
    setScopeDropdownOpen(false);
    if (taskId) updateTaskMutation.mutate({ taskId, scope_weight: newScope as ScopeWeight });
  };

  const handlePriorityChange = (newPriority: TaskPriority) => {
    setPriority(newPriority);
    setPriorityDropdownOpen(false);
    if (taskId) updateTaskMutation.mutate({ taskId, priority: newPriority });
  };

  /** Remove a single assignee inline — saves to the backend immediately (optimistic, with toast on success/error). */
  const handleRemoveAssignee = (uid: number) => {
    if (!taskId || setAssigneesMutation.isPending) return;
    setAssigneesMutation.mutate({ taskId, userIds: assigneeUserIds.filter((id) => id !== uid) });
  };

  const deleteTaskMutation = useDeleteTask(task?.project_id ?? null);
  const handleConfirmDelete = () => {
    if (!taskId || deleteTaskMutation.isPending) return;
    deleteTaskMutation.mutate(taskId, {
      onSuccess: () => {
        setDeleteConfirmOpen(false);
        handleNavigateBack();
      },
    });
  };

  const handlePostComment = () => {
    const trimmed = commentDraft.trim();
    if (!trimmed || !taskId) return;
    createCommentMutation.mutate(trimmed, {
      onSuccess: () => setCommentDraft(''),
    });
  };

  const dependencyOptions = useMemo(
    () =>
      projectTasks
        .filter((t) => String(t.id) !== String(taskId))
        .filter((t) =>
          dependencySearch.trim()
            ? t.title.toLowerCase().includes(dependencySearch.trim().toLowerCase())
            : true,
        ),
    [projectTasks, taskId, dependencySearch],
  );

  const taskWorkspaceProjectId =
    searchParams.get('project') ?? task?.project_id ?? state.projectId ?? null;

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

  const assigneeUserIds = getTaskAssigneeUserIds(task);
  const mappedAttachments = (attachments ?? []).map(mapAttachment);
  const displayedComments = commentsSorted.slice(0, visibleCommentCount);
  const displayedTimeline = timeline.slice(0, visibleActivityCount);
  const hasMoreComments =
    commentsSorted.length > visibleCommentCount || commentsQuery.hasNextPage;
  const hasMoreActivity = timeline.length > visibleActivityCount || timelineQuery.hasNextPage;

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
            <Flag size={16} className={taskPriorityFlagClass(priority)} aria-hidden />
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
                    className="max-h-[560px] w-full resize-none overflow-y-auto rounded-[8px] border border-[#e9e9e9] bg-white p-4 text-[16px] font-medium leading-relaxed text-[#0b191f] outline-none focus:ring-2 focus:ring-[#24b5f8]/40"
                  />
                ) : (
                  <div
                    className="min-h-[106px] cursor-text rounded-[8px] border border-[#e9e9e9] bg-white p-4"
                    onClick={startEditDesc}
                  >
                    {task.description ? (
                      <TaskDescriptionMarkdown>{task.description}</TaskDescriptionMarkdown>
                    ) : (
                      <p className="text-[16px] font-medium leading-relaxed text-[#606d76]">
                        Click to add a description…
                      </p>
                    )}
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
                  onClick={() => addSection('checklist')}
                  aria-label="Add named checklist section"
                  className="flex size-8 items-center justify-center rounded-[8px] border border-[#ebedee] bg-white text-[#606d76] shadow-[0px_1px_1px_0px_rgba(14,14,34,0.03)] transition-colors hover:bg-[#f9fafb] hover:text-[#0b191f]"
                >
                  <Plus size={16} />
                </button>
              </div>
              <ChecklistItems items={localChecklists} onItemsChange={saveChecklists} />
            </section>

            {/* ─── Named checklist sections (created via the Checklist + button) ─── */}
            <section className="space-y-4">
              {localSections.map((section, sIdx) => (
                <div key={section.id ?? `sec-${sIdx}`} className="group/section space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    {editingSectionNameIdx === sIdx ? (
                      <input
                        type="text"
                        autoFocus
                        value={section.name}
                        onChange={(e) => renameSection(sIdx, e.target.value)}
                        onBlur={() => commitSectionName(sIdx)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                          if (e.key === 'Escape') setEditingSectionNameIdx(null);
                        }}
                        placeholder="Checklist title"
                        className="flex-1 border-0 bg-transparent text-[16px] font-medium leading-none text-[#0b191f] outline-none placeholder:text-[#9fa5a8]"
                        aria-label="Checklist title"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingSectionNameIdx(sIdx)}
                        className="flex-1 cursor-text border-0 bg-transparent p-0 text-left text-[16px] font-medium leading-none text-[#0b191f]"
                        aria-label={`Rename ${section.name}`}
                      >
                        {section.name || 'Untitled checklist'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeSection(sIdx)}
                      className="inline-flex size-7 items-center justify-center rounded-[6px] text-[#727d83] opacity-0 transition-opacity hover:bg-[#f3f5f7] hover:text-[#b91c1c] focus-visible:opacity-100 group-hover/section:opacity-100"
                      aria-label={`Delete checklist ${section.name}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {section.type === 'checklist' ? (
                    <ChecklistItems
                      items={section.items ?? []}
                      onItemsChange={(next) => updateChecklistSection(sIdx, () => next)}
                    />
                  ) : (
                    <textarea
                      value={section.text ?? ''}
                      onChange={(e) => updatePlainTextSection(sIdx, e.target.value)}
                      placeholder="Plain text…"
                      rows={3}
                      className="min-h-[72px] w-full resize-y rounded-[6px] border border-[#ebedee] bg-[#fafbfc] p-2 text-[13px] text-[#0b191f] outline-none placeholder:text-[#9fa5a8] focus:border-[#0b191f]/20"
                    />
                  )}
                </div>
              ))}
            </section>

            {/* ─── Tags ─── */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-medium text-[#0b191f]">Tags</p>
                <button
                  type="button"
                  onClick={startAddTag}
                  className="inline-flex size-8 items-center justify-center rounded-[8px] border border-[#ebedee] bg-white text-[#606d76] shadow-[0px_1px_1px_0px_rgba(14,14,34,0.03)] transition-colors hover:bg-[#f9fafb] hover:text-[#0b191f]"
                >
                  <Tag size={14} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(task.labels ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="group relative inline-flex items-center gap-1.5 rounded-[16px] border border-[#cdd2d5] bg-white px-4 py-1.5 font-['Satoshi',sans-serif] text-[14px] font-medium leading-none tracking-normal text-[#606d76]"
                  >
                    <span className="inline-flex min-h-[14px] items-center justify-center">{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-[#606d76] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#0b191f]"
                      aria-label={`Remove ${tag}`}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {addingTag && (
                  <span className="inline-flex items-center rounded-[16px] border border-[#cdd2d5] bg-white px-3 py-1.5">
                    <input
                      ref={tagInputRef}
                      type="text"
                      value={tagDraft}
                      onChange={(e) => setTagDraft(e.target.value)}
                      onBlur={saveTag}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveTag(); if (e.key === 'Escape') setAddingTag(false); }}
                      className="w-24 border-0 bg-transparent font-['Satoshi',sans-serif] text-[14px] font-medium leading-none tracking-normal text-[#606d76] outline-none placeholder:text-[#606d76]/60"
                    />
                  </span>
                )}
              </div>
            </section>

            {/* ─── Estimated effort ─── */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-medium text-[#0b191f]">Estimated effort</p>
                {task.estimated_hours == null && !addingEffort ? (
                  <button
                    type="button"
                    onClick={startAddEffort}
                    className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[#ebedee] bg-white px-3 py-2 text-[14px] font-medium text-[#0b191f]"
                  >
                    Add <Plus size={16} />
                  </button>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {task.estimated_hours != null && !addingEffort ? (
                  <span className="group relative inline-flex items-center gap-1.5 rounded-[16px] bg-[#0b191f] px-4 py-1.5 font-['Satoshi',sans-serif] text-[14px] font-medium leading-none tracking-normal text-white">
                    <span className="inline-flex min-h-[14px] items-center justify-center">
                      {formatEstimatedEffortLabel(task.estimated_hours)}
                    </span>
                    <button
                      type="button"
                      onClick={clearEffort}
                      className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-white/80 opacity-0 transition-opacity group-hover:opacity-100 hover:text-white"
                      aria-label="Remove estimated effort"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ) : null}
                {addingEffort && (
                  <span className="inline-flex items-center rounded-[16px] border border-[#cdd2d5] bg-white px-3 py-1.5">
                    <input
                      ref={effortInputRef}
                      type="text"
                      inputMode="decimal"
                      placeholder="Hours"
                      value={effortDraft}
                      onChange={(e) => setEffortDraft(e.target.value)}
                      onBlur={saveEffort}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEffort();
                        if (e.key === 'Escape') {
                          setAddingEffort(false);
                          setEffortDraft('');
                        }
                      }}
                      className="w-20 border-0 bg-transparent font-['Satoshi',sans-serif] text-[14px] font-medium leading-none tracking-normal text-[#606d76] outline-none placeholder:text-[#606d76]/60"
                    />
                  </span>
                )}
                {task.estimated_hours == null && !addingEffort ? (
                  <p className="w-full text-[13px] text-[#727d83]">No effort set</p>
                ) : null}
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
              {mappedAttachments.length === 0 && pendingUploadRows.length === 0 ? (
                <p className="text-[13px] text-[#727d83]">No attachments yet</p>
              ) : (
                <div className="space-y-3">
                  {pendingUploadRows.map((row) => (
                    <TaskPendingUploadRow
                      key={row.clientId}
                      row={row}
                      onDismiss={() =>
                        setPendingUploadRows((prev) => prev.filter((r) => r.clientId !== row.clientId))
                      }
                    />
                  ))}
                  {mappedAttachments.map((attachment) => (
                    <TaskResourceRow
                      key={attachment.id}
                      attachment={attachment}
                      onDelete={() => deleteAttachmentMutation.mutate(attachment.id)}
                      deletePending={deleteAttachmentMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* ─── Dependencies ─── */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-medium text-[#0b191f]">Dependencies</p>
                <button
                  type="button"
                  onClick={() => setDependencyModalOpen(true)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[#ebedee] bg-white px-3 py-2 text-[14px] font-medium text-[#0b191f]"
                >
                  Add <Plus size={16} />
                </button>
              </div>
              {selectedDependencies.length === 0 ? (
                <p className="text-[13px] text-[#727d83]">No dependencies yet</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedDependencies.map((depId) => {
                    const dep = projectTasks.find((t) => Number(t.id) === depId);
                    const depLabel = dep?.title ?? `Task #${depId}`;
                    const depHref = buildTaskWorkspaceHref(depId, searchParams, taskWorkspaceProjectId);
                    return (
                      <span
                        key={depId}
                        className="inline-flex items-center gap-1.5 rounded-[16px] border border-[#cdd2d5] bg-white px-4 py-1.5 text-[13px] font-medium text-[#606d76]"
                      >
                        <a
                          href={depHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-sm hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b191f]/30"
                          title={`Open ${depLabel} in a new tab`}
                        >
                          {depLabel}
                        </a>
                        <button
                          type="button"
                          className="inline-flex size-4 items-center justify-center rounded-full hover:text-[#0b191f]"
                          onClick={() => {
                            const next = selectedDependencies.filter((id) => id !== depId);
                            setSelectedDependencies(next);
                            if (taskId) updateTaskMutation.mutate({ taskId, dependencies: next });
                          }}
                          aria-label={`Remove dependency ${depLabel}`}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ─── Assigned To ─── */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[16px] font-medium text-[#0b191f]">Assigned to</p>
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(true)}
                  className="inline-flex size-10 items-center justify-center rounded-[12px] border border-[#ebedee] bg-white text-[#606d76] shadow-[0px_1px_1px_0px_rgba(14,14,34,0.03)] transition-colors hover:bg-[#f9fafb] hover:text-[#0b191f]"
                >
                  <UserRoundPlus size={16} />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {assigneeUserIds.length === 0 ? (
                  <p className="text-[13px] text-[#727d83]">No one assigned</p>
                ) : (
                  assigneeUserIds.map((uid) => {
                    const m = members?.find((mem) => mem.userId === uid);
                    const displayName = m?.name ?? `User #${uid}`;
                    return (
                      <div key={uid} className="flex items-center gap-2">
                        <div className="group/avatar relative">
                          <div
                            className="flex size-[40px] items-center justify-center rounded-full border-2 border-[#0b191f] text-[16px] font-medium leading-none text-white"
                            style={{ backgroundColor: memberAvatarBackground(m?.userId ?? uid) }}
                            title={displayName}
                          >
                            {m ? m.initials : `U${uid}`}
                          </div>
                          {m ? (
                            <div className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-white bg-black transition-opacity group-hover/avatar:opacity-0 group-focus-within/avatar:opacity-0">
                              <Check size={10} className="text-white" aria-hidden />
                            </div>
                          ) : null}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveAssignee(uid);
                            }}
                            disabled={setAssigneesMutation.isPending}
                            aria-label={`Remove ${displayName} from this task`}
                            className="absolute -top-1 -right-1 inline-flex size-[18px] items-center justify-center rounded-full border-2 border-white bg-[#0b191f] text-white opacity-0 shadow-[0px_1px_2px_0px_rgba(14,14,34,0.18)] transition-opacity hover:bg-[#1a2d36] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b191f]/40 group-hover/avatar:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <X size={10} strokeWidth={2.5} aria-hidden />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* ─── Update Task button ─── */}
            <div className="border-t border-[#ebedee] pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={deleteTaskMutation.isPending}
                  aria-label="Delete this task"
                  className="inline-flex h-12 items-center justify-center rounded-[12px] bg-[#dc2626] px-5 font-['Satoshi',sans-serif] text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-[#b91c1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626]/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleteTaskMutation.isPending ? 'Deleting…' : 'Delete'}
                </button>
                <div className="flex flex-wrap items-center justify-end gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => void handleCopyCursorMcpUrl()}
                      disabled={!cursorMcpShareUrl}
                      aria-label={mcpLinkCopied ? 'URL copied to clipboard' : 'Copy MCP task URL'}
                      className={`inline-flex h-12 items-center justify-center gap-2 rounded-[12px] border border-[#ebedee] bg-white px-5 text-[14px] font-medium text-[#0b191f] shadow-[0px_1px_1px_0px_rgba(14,14,34,0.03)] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {mcpLinkCopied ? (
                        <Check size={16} className="shrink-0 text-[#0b191f]" aria-hidden />
                      ) : (
                        <Copy size={16} className="shrink-0 text-[#606d76]" aria-hidden />
                      )}
                      {mcpLinkCopied ? 'Copied' : 'Copy MCP URL'}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-xs border-0 bg-black text-balance text-white shadow-md"
                    arrowClassName="bg-black fill-black"
                  >
                    {`Copies the MCP task page link for this task. For full agent integration (checklists, status changes), configure the Continuum MCP server in Cursor or Claude Code from Settings → Integrations.`}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handleOpenBuildModal}
                      disabled={
                        taskLinkedBranchCount === 0 || startReviewMutation.isPending
                      }
                      aria-label={
                        activeAgentRun
                          ? 'Open the live build view'
                          : reviewableBuild
                            ? existingReviewId
                              ? 'Open the review for the latest build'
                              : 'Start a review of the latest build'
                            : 'Start an agentic build for this task'
                      }
                      className={`relative inline-flex h-12 items-center justify-center gap-2 rounded-[12px] border px-5 text-[14px] font-medium shadow-[0px_1px_1px_0px_rgba(14,14,34,0.03)] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        reviewableBuild && !activeAgentRun
                          ? 'border-[#24B5F8]/40 bg-[#24B5F8]/10 text-[#0369a1] hover:bg-[#24B5F8]/20'
                          : 'border-[#ebedee] bg-white text-[#0b191f] hover:bg-[#f9fafb]'
                      }`}
                    >
                      {activeAgentRun
                        ? 'View live build'
                        : reviewableBuild
                          ? startReviewMutation.isPending
                            ? 'Starting review…'
                            : existingReviewId
                              ? 'View review'
                              : 'Review'
                          : 'Build'}
                      {activeAgentRun ? (
                        <span className="ml-1 inline-flex h-2 w-2 rounded-full bg-[#24B5F8]">
                          <span className="absolute inline-flex h-2 w-2 rounded-full bg-[#24B5F8] opacity-75 motion-safe:animate-ping" />
                        </span>
                      ) : null}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-xs border-0 bg-black text-balance text-white shadow-md"
                    arrowClassName="bg-black fill-black"
                  >
                    {taskLinkedBranchCount === 0
                      ? 'Link at least one repo + branch under Development to enable Build.'
                      : activeAgentRun
                        ? 'A build is already running for this task. Click to open the live view.'
                        : reviewableBuild
                          ? existingReviewId
                            ? 'Open the live review view for this build.'
                            : 'Run an automated review of the build diff against this task’s requirements. Posts the verdict on the PR.'
                          : 'Lets the Continuum agent implement this task autonomously: clones the repo, edits files, runs tests, then commits or opens a PR.'}
                  </TooltipContent>
                </Tooltip>
                <button
                  type="button"
                  // Block blur on inline title/description inputs so their save
                  // doesn't flip the mutation to pending and disable this button
                  // before the click registers. handleUpdateTask reads the drafts.
                  onMouseDown={(e) => e.preventDefault()}
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
                className="flex h-[46px] w-full items-center justify-between rounded-[8px] border border-[#e9e9e9] bg-white px-4 shadow-[0px_1px_1px_0px_rgba(14,14,34,0.03)] transition-colors hover:bg-[#f9fafb]"
              >
                <span className="text-[16px] font-medium text-[#0b191f]">{statusLabelFromBoard(status, boardColumns)}</span>
                <ChevronDown size={16} />
              </button>
              {statusDropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-[8px] border border-[#e9e9e9] bg-white shadow-md">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleStatusChange(opt.value)}
                      className={`flex w-full items-center px-4 py-3 text-left text-[14px] font-medium hover:bg-[#f0f3f5] ${
                        status === opt.value ? 'bg-[#f0f3f5] text-[#0b191f]' : 'text-[#606d76]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-4">
            <p className="text-[16px] font-medium text-[#0b191f]">Priority</p>
            <div className="relative">
              <button
                type="button"
                onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
                className="flex h-[46px] w-full items-center justify-between rounded-[8px] border border-[#e9e9e9] bg-white px-4 shadow-[0px_1px_1px_0px_rgba(14,14,34,0.03)] transition-colors hover:bg-[#f9fafb]"
              >
                <span className="flex items-center gap-2 text-[16px] font-medium text-[#0b191f]">
                  <Flag size={16} className={taskPriorityFlagClass(priority)} aria-hidden />
                  {taskPriorityLabel(priority)}
                </span>
                <ChevronDown size={16} />
              </button>
              {priorityDropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-[8px] border border-[#e9e9e9] bg-white shadow-md">
                  {TASK_PRIORITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handlePriorityChange(opt.value)}
                      className={`flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] font-medium hover:bg-[#f0f3f5] ${
                        priority === opt.value ? 'bg-[#f0f3f5] text-[#0b191f]' : 'text-[#606d76]'
                      }`}
                    >
                      <Flag size={16} className={opt.flagColorClass} aria-hidden />
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
                className="flex h-[46px] w-full items-center justify-between rounded-[8px] border border-[#e9e9e9] bg-white px-4 shadow-[0px_1px_1px_0px_rgba(14,14,34,0.03)] transition-colors hover:bg-[#f9fafb]"
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

          {/* Development — linked Git branches */}
          <div className="space-y-4">
            <div>
              <p className="text-[16px] font-medium text-[#0b191f]">Development</p>
              <p className="mt-1 text-[13px] leading-snug text-[#727d83]">
                Link one or more repository branches to this task for commits and automation.
              </p>
            </div>
            {taskId && task.project_id != null ? (
              <TaskLinkedBranchesSection
                taskId={taskId}
                projectId={task.project_id}
                task={task}
                projectRepos={projectRepos}
                reposLoading={reposLoading}
              />
            ) : null}
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
                onClick={() => setLogTimeOpen(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-[#24B5F8] px-4 text-[14px] font-medium text-white"
              >
                <Plus size={16} />
                Log Time
              </button>
            </div>
            <div className="flex justify-between text-[16px]">
              <span className="text-[#727d83]">Logged</span>
              <span className="flex min-h-[24px] items-center justify-end gap-2 text-[#0b191f]">
                {task.project_id == null ? (
                  <span className="text-[#727d83]">—</span>
                ) : hoursLoading ? (
                  <>
                    <Loader2 className="size-4 shrink-0 animate-spin text-[#727d83]" aria-hidden />
                    <span className="sr-only">Loading logged hours</span>
                  </>
                ) : hoursError ? (
                  <span className="text-[14px] text-[#727d83]">Unable to load</span>
                ) : (
                  formatLoggedHoursSum(loggedHoursTotal ?? 0)
                )}
              </span>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-4">
            <p className="text-[16px] font-medium text-[#0b191f]">Comments</p>
            <div className="space-y-3">
              <CommentMentionTextarea
                textareaRef={commentTextareaRef}
                value={commentDraft}
                onChange={setCommentDraft}
                members={members ?? []}
                placeholder="Write a comment…"
                disabled={createCommentMutation.isPending}
                onSubmit={handlePostComment}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handlePostComment}
                  disabled={!commentDraft.trim() || createCommentMutation.isPending}
                  className={`inline-flex h-8 items-center rounded-[8px] px-4 text-[14px] font-medium ${
                    !commentDraft.trim() || createCommentMutation.isPending
                      ? 'cursor-not-allowed bg-[#ebedee] text-[#9ea7ad]'
                      : 'bg-[#24B5F8] text-white hover:bg-[#1da8ea]'
                  }`}
                >
                  {createCommentMutation.isPending ? 'Posting…' : 'Post'}
                </button>
              </div>
            </div>
            {commentsLoading ? (
              <div className="space-y-4">
                {[0, 1].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1 size-[40px] shrink-0 animate-pulse rounded-full bg-[#e4eaec]" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 w-20 animate-pulse rounded bg-[#e4eaec]" />
                      <div className="h-4 w-32 animate-pulse rounded bg-[#e4eaec]" />
                      <div className="h-10 w-full animate-pulse rounded bg-[#e4eaec]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : commentsSorted.length > 0 ? (
              <>
                <div className="flex flex-col gap-4">
                  {displayedComments.map((c) => (
                    <div key={c.id} className="flex gap-4">
                      <div className="mt-1 shrink-0">
                        <TaskCommentAvatar author={c.author} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] text-[#727d83]">
                          {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                        </p>
                        <p className="text-[16px] leading-none text-[#0b191f]">{commentAuthorDisplayName(c.author)}</p>
                        <CommentBody
                          content={c.content}
                          mentions={c.mentions}
                          className="mt-1 text-[14px] font-medium leading-snug text-[#606d76]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {hasMoreComments || visibleCommentCount > TASK_DETAIL_FEED_PAGE ? (
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    {hasMoreComments ? (
                      <button
                        type="button"
                        onClick={() => setVisibleCommentCount((n) => n + TASK_DETAIL_FEED_PAGE)}
                        disabled={commentsQuery.isFetchingNextPage}
                        className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#1466ff] underline decoration-[#1466ff]/40 underline-offset-2 outline-none hover:text-[#0d52cc] focus-visible:ring-2 focus-visible:ring-[#1466ff]/40 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {commentsQuery.isFetchingNextPage ? 'Loading…' : 'Show more'}
                      </button>
                    ) : null}
                    {visibleCommentCount > TASK_DETAIL_FEED_PAGE && commentsSorted.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setVisibleCommentCount(TASK_DETAIL_FEED_PAGE)}
                        disabled={commentsQuery.isFetchingNextPage}
                        className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76] underline decoration-[#606d76]/40 underline-offset-2 outline-none hover:text-[#0b191f] focus-visible:ring-2 focus-visible:ring-[#1466ff]/40 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Show less
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-[13px] text-[#727d83]">No comments yet.</p>
            )}
          </div>

          {/* Activity */}
          <div className="space-y-4">
            <p className="text-[16px] font-medium text-[#0b191f]">Activity</p>
            {timelineLoading ? (
              <div className="relative flex flex-col gap-4">
                <div
                  className="pointer-events-none absolute top-[25px] bottom-[25px] left-[24px] w-px bg-[#e4eaec]"
                  aria-hidden
                />
                {[0, 1].map((i) => (
                  <div key={i} className="relative z-[1] flex gap-4">
                    <div className="mt-1 size-[50px] shrink-0 animate-pulse rounded-[99px] bg-[#e4eaec]" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 w-20 animate-pulse rounded bg-[#e4eaec]" />
                      <div className="h-4 w-40 animate-pulse rounded bg-[#e4eaec]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : timeline.length > 0 ? (
              <>
                <div id="task-activity-timeline-list" role="list" className="relative flex flex-col gap-4">
                  <div
                    className="pointer-events-none absolute top-[25px] bottom-[25px] left-[24px] w-px bg-[#e4eaec]"
                    aria-hidden
                  />
                  {displayedTimeline.map((entry) => (
                    <div key={entry.id} className="relative z-[1] flex gap-4" role="listitem">
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
                  ))}
                </div>
                {hasMoreActivity || visibleActivityCount > TASK_DETAIL_FEED_PAGE ? (
                  <div className="mt-2 flex flex-wrap items-center gap-4 pl-[66px]">
                    {hasMoreActivity ? (
                      <button
                        type="button"
                        onClick={() => setVisibleActivityCount((n) => n + TASK_DETAIL_FEED_PAGE)}
                        disabled={timelineQuery.isFetchingNextPage}
                        className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#1466ff] underline decoration-[#1466ff]/40 underline-offset-2 outline-none hover:text-[#0d52cc] focus-visible:ring-2 focus-visible:ring-[#1466ff]/40 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {timelineQuery.isFetchingNextPage ? 'Loading…' : 'Show more'}
                      </button>
                    ) : null}
                    {visibleActivityCount > TASK_DETAIL_FEED_PAGE && timeline.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setVisibleActivityCount(TASK_DETAIL_FEED_PAGE)}
                        disabled={timelineQuery.isFetchingNextPage}
                        className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76] underline decoration-[#606d76]/40 underline-offset-2 outline-none hover:text-[#0b191f] focus-visible:ring-2 focus-visible:ring-[#1466ff]/40 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Show less
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </>
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
        setPendingUploadRows={setPendingUploadRows}
      />
      <AssignMemberModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        projectId={task.project_id}
        taskId={taskId}
        currentAssigneeIds={assigneeUserIds}
      />
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        headerTitle="Delete task"
        title="Delete this task?"
        description={
          <>
            This permanently deletes &ldquo;{task.title}&rdquo; and its checklist, comments, time logs, and linked branches. This action can&apos;t be undone.
          </>
        }
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        onConfirm={handleConfirmDelete}
        isPending={deleteTaskMutation.isPending}
      />
      <LogTimeModal
        open={logTimeOpen}
        onOpenChange={setLogTimeOpen}
        projectId={task.project_id != null ? Number(task.project_id) : undefined}
        prefillTaskId={taskId}
      />
      {taskId ? (
        <BuildTaskModal
          open={buildModalOpen}
          onOpenChange={setBuildModalOpen}
          taskId={taskId}
          task={task}
          onRunStarted={(run) => openBuildDrawer(run.id)}
        />
      ) : null}
      {taskId ? (
        <BuildRunDrawer
          open={buildDrawerOpen}
          onOpenChange={closeBuildDrawer}
          taskId={taskId}
          runId={buildDrawerRunId}
        />
      ) : null}
      {taskId ? (
        <ReviewRunDrawer
          open={reviewDrawerOpen}
          onOpenChange={closeReviewDrawer}
          taskId={taskId}
          reviewId={reviewDrawerReviewId}
        />
      ) : null}
      {dependencyModalOpen ? (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/25 p-4">
          <div className="w-full max-w-[520px] rounded-[12px] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[16px] font-medium text-[#0b191f]">Select dependencies</p>
              <button type="button" onClick={() => setDependencyModalOpen(false)} aria-label="Close dependencies modal">
                <X size={16} />
              </button>
            </div>
            <input
              type="text"
              placeholder="Search tasks"
              value={dependencySearch}
              onChange={(e) => setDependencySearch(e.target.value)}
              className="mb-3 w-full rounded-[8px] border border-[#e9e9e9] px-3 py-2 text-[14px] outline-none"
            />
            <div className="max-h-[320px] space-y-2 overflow-y-auto">
              {dependencyOptions.map((opt) => {
                const optId = Number(opt.id);
                const checked = Number.isFinite(optId) && selectedDependencies.includes(optId);
                return (
                  <label key={opt.id} className="flex cursor-pointer items-center gap-2 rounded-[8px] border border-[#ebedee] p-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        if (!Number.isFinite(optId)) return;
                        setSelectedDependencies((prev) =>
                          checked ? prev.filter((id) => id !== optId) : [...prev, optId],
                        );
                      }}
                    />
                    <span className="text-[14px] text-[#0b191f]">{opt.title}</span>
                  </label>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-[8px] border border-[#e9e9e9] px-3 py-2 text-[14px]"
                onClick={() => setDependencyModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-[8px] bg-[#24B5F8] px-3 py-2 text-[14px] text-white"
                onClick={() => {
                  if (taskId) updateTaskMutation.mutate({ taskId, dependencies: selectedDependencies });
                  setDependencyModalOpen(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
