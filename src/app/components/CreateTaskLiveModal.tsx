"use client";

import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAutosizeTextarea } from "@/hooks/useAutosizeTextarea";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Flag,
  GitBranch,
  GripVertical,
  Plus,
  Tag,
  UserRoundPlus,
  X,
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
} from "./ui/dialog";
import { cn } from "./ui/utils";
import { useCreateTask, useProjectMembers, useProjectTasks } from "@/api/hooks";
import { setTaskAssignees } from "@/api/tasks";
import { toast } from "sonner";
import { formatEstimatedEffortLabel } from "@/api";
import {
  TASK_PRIORITY_OPTIONS,
  taskPriorityFlagClass,
  type ScopeWeight,
  type TaskPriority,
  type TaskSection,
} from "@/types/task";
import { memberAvatarBackground } from "@/lib/memberAvatar";
import { useChecklistItemDrag, reorderChecklistItems } from "@/lib/useChecklistItemDrag";

type ChecklistRow = { id: string; text: string; done: boolean };

/**
 * Single-row checklist input that grows with content (auto-sizing textarea).
 * Wraps long text within the row's column width instead of overflowing horizontally,
 * and lets the caller observe the underlying DOM node for focus management.
 */
function ChecklistRowInput({
  value,
  onChange,
  onBlur,
  onKeyDown,
  placeholder,
  inputRef,
}: {
  value: string;
  onChange: (next: string) => void;
  onBlur: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  inputRef?: (el: HTMLTextAreaElement | null) => void;
}) {
  const autosizeRef = useAutosizeTextarea(value, { minPx: 20, maxPx: 200 });
  return (
    <textarea
      ref={(el) => {
        autosizeRef.current = el;
        if (inputRef) inputRef(el);
      }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      rows={1}
      className="block w-full resize-none overflow-hidden border-0 bg-transparent p-0 font-['Inter',sans-serif] text-[13px] font-normal leading-[19px] tracking-normal text-[#0b191f] outline-none placeholder:text-[#606d76]/70"
    />
  );
}

type CreateTaskLiveModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  milestoneId?: string | null;
  /** Kanban column the user clicked "Create task" from — sent verbatim as the new task's status. */
  defaultColumnId?: string | null;
};

const SCOPE_OPTIONS: { value: ScopeWeight; label: string }[] = [
  { value: "XS", label: "Extra Small (XS)" },
  { value: "S", label: "Small (S)" },
  { value: "M", label: "Medium (M)" },
  { value: "L", label: "Large (L)" },
  { value: "XL", label: "Extra Large (XL)" },
];

const DIVIDER = (
  <div className="relative h-0 w-full shrink-0">
    <div className="absolute inset-x-0 -top-px h-px bg-[#f0f0f0]" />
  </div>
);

export function CreateTaskLiveModal({
  open,
  onOpenChange,
  projectId,
  milestoneId,
  defaultColumnId,
}: CreateTaskLiveModalProps) {
  const createTaskMutation = useCreateTask();
  const { data: members } = useProjectMembers(projectId, { enabled: open });
  const { data: projectTasks } = useProjectTasks(open ? projectId : null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [checklists, setChecklists] = useState<ChecklistRow[]>([]);
  const checklistDrag = useChecklistItemDrag((from, to) => {
    setChecklists((prev) => reorderChecklistItems(prev, from, to));
  });
  const [tags, setTags] = useState<string[]>([]);
  const [addingTag, setAddingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState("New tag");
  const [estimatedHours, setEstimatedHours] = useState<number | null>(null);
  const [addingEffort, setAddingEffort] = useState(false);
  const [effortDraft, setEffortDraft] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [scope, setScope] = useState<ScopeWeight>("M");
  const [scopeOpen, setScopeOpen] = useState(false);
  const [assignedUserIds, setAssignedUserIds] = useState<number[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedDependencyIds, setSelectedDependencyIds] = useState<number[]>([]);
  const [dependencyPickerOpen, setDependencyPickerOpen] = useState(false);
  const [dependencySearch, setDependencySearch] = useState("");

  const titleRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const effortInputRef = useRef<HTMLInputElement>(null);
  const dependencyPickerRef = useRef<HTMLDivElement>(null);
  const assignDropdownRef = useRef<HTMLDivElement>(null);
  const descriptionTextareaRef = useAutosizeTextarea(description, {
    minPx: 72,
    maxPx: 400,
  });

  const reset = useCallback(() => {
    setTitle("");
    setDescription("");
    setChecklists([]);
    setSections([]);
    setEditingSectionNameId(null);
    setTags([]);
    setAddingTag(false);
    setTagDraft("New tag");
    setEstimatedHours(null);
    setAddingEffort(false);
    setEffortDraft("");
    setPriority("medium");
    setPriorityOpen(false);
    setScope("M");
    setScopeOpen(false);
    setAssignedUserIds([]);
    setAssignOpen(false);
    setMemberSearch("");
    setSelectedDependencyIds([]);
    setDependencyPickerOpen(false);
    setDependencySearch("");
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const checklistInputRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const [pendingFocusChecklistId, setPendingFocusChecklistId] = useState<string | null>(null);

  const addChecklistRow = useCallback(() => {
    const id = crypto.randomUUID();
    setChecklists((prev) => [...prev, { id, text: "", done: false }]);
    setPendingFocusChecklistId(id);
  }, []);

  useEffect(() => {
    if (!pendingFocusChecklistId) return;
    const el = checklistInputRefs.current.get(pendingFocusChecklistId);
    if (el) {
      el.focus();
      setPendingFocusChecklistId(null);
    }
  }, [pendingFocusChecklistId, checklists]);

  useEffect(() => {
    if (!dependencyPickerOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const root = dependencyPickerRef.current;
      if (!root) return;
      if (!root.contains(e.target as Node)) {
        setDependencyPickerOpen(false);
        setDependencySearch("");
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [dependencyPickerOpen]);

  useEffect(() => {
    if (!assignOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const root = assignDropdownRef.current;
      if (!root) return;
      if (!root.contains(e.target as Node)) {
        setAssignOpen(false);
        setMemberSearch("");
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [assignOpen]);

  const updateChecklistText = useCallback((id: string, text: string) => {
    setChecklists((prev) => prev.map((r) => (r.id === id ? { ...r, text } : r)));
  }, []);

  const toggleChecklist = useCallback((id: string) => {
    setChecklists((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (!r.done && !r.text.trim()) return r;
        return { ...r, done: !r.done };
      }),
    );
  }, []);

  const removeChecklistIfEmpty = useCallback((id: string) => {
    setChecklists((prev) => prev.filter((r) => !(r.id === id && !r.text.trim())));
  }, []);

  const removeChecklistRow = useCallback((id: string) => {
    setChecklists((prev) => prev.filter((r) => r.id !== id));
  }, []);

  /* ── Named checklist sections (mirror the task-view UX) ── */
  const [sections, setSections] = useState<TaskSection[]>([]);
  const [editingSectionNameId, setEditingSectionNameId] = useState<string | null>(null);
  const sectionNameInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const sectionItemInputRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const [pendingFocusSectionId, setPendingFocusSectionId] = useState<string | null>(null);
  const [pendingFocusSectionItemId, setPendingFocusSectionItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingFocusSectionId) return;
    const el = sectionNameInputRefs.current.get(pendingFocusSectionId);
    if (el) {
      el.focus();
      setPendingFocusSectionId(null);
    }
  }, [pendingFocusSectionId, sections, editingSectionNameId]);

  useEffect(() => {
    if (!pendingFocusSectionItemId) return;
    const el = sectionItemInputRefs.current.get(pendingFocusSectionItemId);
    if (el) {
      el.focus();
      setPendingFocusSectionItemId(null);
    }
  }, [pendingFocusSectionItemId, sections]);

  const newSectionId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `sec-${crypto.randomUUID()}`
      : `sec-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const addSection = useCallback(() => {
    const id = newSectionId();
    setSections((prev) => [...prev, { id, name: "", type: "checklist", items: [] }]);
    setEditingSectionNameId(id);
    setPendingFocusSectionId(id);
  }, []);

  const renameSection = useCallback((id: string, name: string) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  }, []);

  const commitSectionName = useCallback((id: string) => {
    setSections((prev) => {
      const section = prev.find((s) => s.id === id);
      if (!section) return prev;
      const trimmed = section.name.trim();
      if (!trimmed) return prev.filter((s) => s.id !== id);
      if (trimmed !== section.name) return prev.map((s) => (s.id === id ? { ...s, name: trimmed } : s));
      return prev;
    });
    setEditingSectionNameId(null);
  }, []);

  const removeSection = useCallback((id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateSectionItemText = useCallback((sectionId: string, itemId: string, text: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId || s.type !== "checklist") return s;
        return { ...s, items: (s.items ?? []).map((it) => (it.id === itemId ? { ...it, text } : it)) };
      }),
    );
  }, []);

  const toggleSectionItem = useCallback((sectionId: string, itemId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId || s.type !== "checklist") return s;
        return {
          ...s,
          items: (s.items ?? []).map((it) => {
            if (it.id !== itemId) return it;
            if (!it.done && !it.text.trim()) return it;
            return { ...it, done: !it.done };
          }),
        };
      }),
    );
  }, []);

  const removeSectionItemIfEmpty = useCallback((sectionId: string, itemId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId || s.type !== "checklist") return s;
        return { ...s, items: (s.items ?? []).filter((it) => !(it.id === itemId && !it.text.trim())) };
      }),
    );
  }, []);

  const removeSectionItem = useCallback((sectionId: string, itemId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId || s.type !== "checklist") return s;
        return { ...s, items: (s.items ?? []).filter((it) => it.id !== itemId) };
      }),
    );
  }, []);

  const addSectionItem = useCallback((sectionId: string) => {
    const itemId = crypto.randomUUID();
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId || s.type !== "checklist") return s;
        return { ...s, items: [...(s.items ?? []), { id: itemId, text: "", done: false }] };
      }),
    );
    setPendingFocusSectionItemId(itemId);
  }, []);

  const commitTag = () => {
    const trimmed = tagDraft.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setAddingTag(false);
    setTagDraft("New tag");
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const parseEffortHours = (raw: string): number | null => {
    const t = raw.trim().replace(/h$/i, "");
    if (t === "") return null;
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
  };

  const commitEffort = () => {
    setAddingEffort(false);
    const hours = parseEffortHours(effortDraft);
    setEffortDraft("");
    if (hours !== null) setEstimatedHours(hours);
  };

  const handleCreate = () => {
    if (!title.trim()) {
      titleRef.current?.focus();
      return;
    }
    createTaskMutation.mutate(
      {
        title: title.trim(),
        project_id: projectId,
        description: description.trim() || null,
        status: defaultColumnId ?? "todo",
        priority,
        scope_weight: scope,
        due_date: null,
        estimated_hours: estimatedHours,
        assigned_to: assignedUserIds[0] ?? null,
        milestone_id: milestoneId ? Number(milestoneId) : null,
        checklists: checklists
          .filter((c) => c.text.trim())
          .map((c) => ({ text: c.text.trim(), done: c.done })),
        sections: sections
          .map<TaskSection | null>((s) => {
            if (s.type !== "checklist") return s;
            const items = (s.items ?? []).filter((it) => it.text.trim()).map((it) => ({ text: it.text.trim(), done: it.done }));
            if (!s.name.trim() && items.length === 0) return null;
            return { ...s, name: s.name.trim() || "Checklist", items };
          })
          .filter((s): s is TaskSection => s !== null),
        labels: tags.length > 0 ? tags : null,
        dependencies: selectedDependencyIds.length > 0 ? selectedDependencyIds : null,
      },
      {
        onSuccess: async (created) => {
          if (assignedUserIds.length > 1 && created?.id != null) {
            try {
              await setTaskAssignees(created.id, assignedUserIds);
            } catch {
              toast.error("Task created, but assigning all members failed");
            }
          }
          reset();
          onOpenChange(false);
        },
      },
    );
  };

  const assignedSet = new Set(assignedUserIds);
  const assignedMembers = assignedUserIds
    .map((uid) => (members ?? []).find((m) => m.userId === uid))
    .filter((m): m is NonNullable<typeof m> => m != null);

  const toggleAssignee = (userId: number) => {
    setAssignedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const dependencyOptions = (projectTasks ?? []).filter((t) => {
    const q = dependencySearch.trim().toLowerCase();
    if (!q) return true;
    return t.title.toLowerCase().includes(q);
  });
  const selectedDependencyTasks = selectedDependencyIds.map((id) => {
    const match = (projectTasks ?? []).find((t) => Number(t.id) === id);
    return { id, title: match?.title ?? `Task #${id}` };
  });

  const filteredMembers = (members ?? []).filter((m) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "fixed top-1/2 left-1/2 z-50 flex max-h-[min(886px,90vh)] w-[calc(100%-2rem)] max-w-[600px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Create Task</DialogPrimitive.Title>

          {/* ─── Header ─── */}
          <div className="z-[3] flex w-full shrink-0 items-center justify-between border-b border-solid border-[#f5f5f5] bg-[#f9f9f9] px-9 py-4">
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
                aria-label="Close"
              >
                <ArrowLeft size={20} className="text-[#606d76]" />
              </button>
            </DialogClose>
            <p className="pointer-events-none absolute left-1/2 top-[25px] -translate-x-1/2 text-center font-['Satoshi',sans-serif] text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
              Create Task
            </p>
            <Flag size={16} className={taskPriorityFlagClass(priority)} aria-hidden />
          </div>

          {/* ─── Scrollable body ─── */}
          <div
            className="scrollbar-hide z-[2] min-h-0 flex-1 overflow-x-clip overflow-y-auto px-9 py-6"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(90deg, rgb(249, 249, 249) 0%, rgb(249, 249, 249) 100%)",
            }}
          >
            <div className="flex w-full flex-col gap-6 pb-6">
              {/* ── Title ── */}
              <div className="flex w-full items-center bg-white py-2">
                <input
                  ref={titleRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title"
                  className="min-w-0 flex-1 border-0 bg-transparent font-['Satoshi',sans-serif] text-[24px] font-medium text-[#0b191f] outline-none placeholder:text-[#cdd2d5]"
                />
              </div>

              {/* ── Description ── */}
              <div className="flex w-full flex-col gap-1">
                <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76]">
                  Description
                </p>
                <textarea
                  ref={descriptionTextareaRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={1}
                  className="max-h-[400px] w-full resize-none overflow-y-auto rounded-[8px] border border-solid border-[#e9e9e9] bg-white px-4 py-3 font-['Satoshi',sans-serif] text-[16px] font-medium leading-relaxed text-[#606d76] outline-none placeholder:text-[#cdd2d5]"
                />
              </div>

              {DIVIDER}

              {/* ── Priority ── */}
              <div className="flex w-full items-center justify-between">
                <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                  Priority
                </p>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setPriorityOpen(!priorityOpen)}
                    className="flex items-center gap-1.5 rounded-[8px] border border-solid border-[#ebedee] bg-white px-3 py-1.5 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] shadow-[0px_2px_2px_0px_rgba(14,14,34,0.03)]"
                  >
                    <Flag size={14} className={taskPriorityFlagClass(priority)} aria-hidden />
                    {TASK_PRIORITY_OPTIONS.find((o) => o.value === priority)?.label ?? priority}
                    <ChevronDown size={14} className="text-[#606d76]" />
                  </button>
                  {priorityOpen && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-52 rounded-[8px] border border-solid border-[#ebedee] bg-white py-1 shadow-lg">
                      {TASK_PRIORITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setPriority(opt.value);
                            setPriorityOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 px-3 py-2 text-left font-['Satoshi',sans-serif] text-[13px] hover:bg-[#f5f7f8]",
                            priority === opt.value ? "font-bold text-[#0b191f]" : "text-[#606d76]",
                          )}
                        >
                          <Flag size={14} className={opt.flagColorClass} aria-hidden />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {DIVIDER}

              {/* ── Scope ── */}
              <div className="flex w-full items-center justify-between">
                <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                  Scope
                </p>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setScopeOpen(!scopeOpen)}
                    className="flex items-center gap-1 rounded-[8px] border border-solid border-[#ebedee] bg-white px-3 py-1.5 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] shadow-[0px_2px_2px_0px_rgba(14,14,34,0.03)]"
                  >
                    {SCOPE_OPTIONS.find((o) => o.value === scope)?.label ?? scope}
                    <ChevronDown size={14} className="text-[#606d76]" />
                  </button>
                  {scopeOpen && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-[8px] border border-solid border-[#ebedee] bg-white py-1 shadow-lg">
                      {SCOPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setScope(opt.value); setScopeOpen(false); }}
                          className={cn(
                            "w-full px-3 py-2 text-left font-['Satoshi',sans-serif] text-[13px] hover:bg-[#f5f7f8]",
                            scope === opt.value ? "font-bold text-[#0b191f]" : "text-[#606d76]",
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {DIVIDER}

              {/* ── Tags ── */}
              <div className="flex w-full flex-col gap-4">
                <div className="flex w-full items-center justify-between">
                  <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                    Tags
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingTag(true);
                      setTagDraft("New tag");
                      setTimeout(() => tagInputRef.current?.select(), 0);
                    }}
                    className="flex size-9 items-center justify-center rounded-[8px] border border-solid border-[#ebedee] bg-white p-2 shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                    aria-label="Add tag"
                  >
                    <Tag size={16} className="text-[#0b191f]" />
                  </button>
                </div>
                <div className="flex w-full flex-wrap content-start items-start gap-2">
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      className="group inline-flex items-center justify-center gap-1.5 rounded-[16px] border border-solid border-[#cdd2d5] bg-white px-4 py-1.5"
                    >
                      <p className="font-['Satoshi',sans-serif] text-[14px] font-medium leading-none tracking-normal whitespace-nowrap text-[#606d76]">
                        {tag}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 inline-flex items-center justify-center border-0 bg-transparent p-0 text-[#606d76] hover:text-red-500"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {addingTag && (
                    <div className="inline-flex items-center justify-center rounded-[16px] border border-solid border-[#cdd2d5] bg-white px-4 py-1.5">
                      <input
                        ref={tagInputRef}
                        type="text"
                        value={tagDraft}
                        onChange={(e) => setTagDraft(e.target.value)}
                        onBlur={commitTag}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitTag();
                          if (e.key === "Escape") { setAddingTag(false); setTagDraft("New tag"); }
                        }}
                        className="w-24 border-0 bg-transparent p-0 font-['Satoshi',sans-serif] text-[14px] font-medium leading-none tracking-normal text-[#606d76] outline-none placeholder:text-[#606d76]/60"
                      />
                    </div>
                  )}
                </div>
              </div>

              {DIVIDER}

              {/* ── Estimated effort ── */}
              <div className="flex w-full flex-col gap-4">
                <div className="flex w-full items-center justify-between">
                  <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                    Estimated effort
                  </p>
                  {estimatedHours == null && !addingEffort ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAddingEffort(true);
                        setEffortDraft("");
                        setTimeout(() => {
                          effortInputRef.current?.focus();
                        }, 0);
                      }}
                      className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[#ebedee] bg-white px-3 py-2 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f]"
                    >
                      Add <Plus size={16} />
                    </button>
                  ) : null}
                </div>
                <div className="flex w-full flex-wrap gap-2">
                  {estimatedHours != null && !addingEffort ? (
                    <div className="group inline-flex items-center gap-1.5 rounded-[16px] bg-[#0b191f] px-4 py-1.5">
                      <p className="font-['Satoshi',sans-serif] text-[14px] font-medium leading-none tracking-normal text-white">
                        {formatEstimatedEffortLabel(estimatedHours)}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEstimatedHours(null);
                          setAddingEffort(false);
                          setEffortDraft("");
                        }}
                        className="inline-flex size-4 items-center justify-center text-white/80 opacity-0 transition-opacity group-hover:opacity-100 hover:text-white"
                        aria-label="Remove estimated effort"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : null}
                  {addingEffort && (
                    <div className="inline-flex items-center rounded-[16px] border border-solid border-[#cdd2d5] bg-white px-4 py-1.5">
                      <input
                        ref={effortInputRef}
                        type="text"
                        inputMode="decimal"
                        placeholder="Hours"
                        value={effortDraft}
                        onChange={(e) => setEffortDraft(e.target.value)}
                        onBlur={commitEffort}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEffort();
                          if (e.key === "Escape") {
                            setAddingEffort(false);
                            setEffortDraft("");
                          }
                        }}
                        className="w-20 border-0 bg-transparent p-0 font-['Satoshi',sans-serif] text-[14px] font-medium leading-none tracking-normal text-[#606d76] outline-none placeholder:text-[#606d76]/60"
                      />
                    </div>
                  )}
                  {estimatedHours == null && !addingEffort ? (
                    <p className="w-full font-['Satoshi',sans-serif] text-[14px] text-[#a3aab0]">No effort set</p>
                  ) : null}
                </div>
              </div>

              {DIVIDER}

              {/* ── Assigned to ── */}
              <div ref={assignDropdownRef} className="flex w-full flex-col gap-4">
                <div className="flex w-full items-center justify-between">
                  <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                    Assigned to
                  </p>
                  <button
                    type="button"
                    onClick={() => setAssignOpen(!assignOpen)}
                    className="flex size-9 items-center justify-center rounded-[8px] border border-solid border-[#ebedee] bg-white p-2 shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                    aria-label="Assign member"
                  >
                    <UserRoundPlus size={16} className="text-[#0b191f]" />
                  </button>
                </div>

                {assignOpen && (
                  <div className="rounded-[8px] border border-solid border-[#ebedee] bg-white shadow-lg">
                    <div className="flex items-center gap-2 border-b border-solid border-[#f0f0f0] px-3 py-2">
                      <input
                        type="text"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        placeholder="Search members..."
                        className="min-w-0 flex-1 border-0 bg-transparent font-['Satoshi',sans-serif] text-[14px] text-[#0b191f] outline-none placeholder:text-[#a3aab0]"
                      />
                    </div>
                    <div className="scrollbar-hide max-h-[180px] overflow-y-auto">
                      {filteredMembers.map((m) => {
                        const checked = assignedSet.has(m.userId);
                        return (
                          <button
                            key={m.userId}
                            type="button"
                            onClick={() => toggleAssignee(m.userId)}
                            className={cn(
                              "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#f5f7f8]",
                              checked && "bg-[#f0f8ff]",
                            )}
                          >
                            <div
                              className="flex size-[28px] shrink-0 items-center justify-center rounded-full"
                              style={{ backgroundColor: memberAvatarBackground(m.userId) }}
                            >
                              <span className="font-['Satoshi',sans-serif] text-[10px] font-medium text-white">
                                {m.initials}
                              </span>
                            </div>
                            <span className="min-w-0 flex-1 truncate font-['Satoshi',sans-serif] text-[14px] text-[#0b191f]">
                              {m.name}
                            </span>
                            <div
                              className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded-[4px] border border-black transition-colors",
                                checked ? "bg-[#24B5F8]" : "bg-white",
                              )}
                              aria-hidden
                            >
                              {checked && <Check className="size-[13px] text-white" strokeWidth={2.5} />}
                            </div>
                          </button>
                        );
                      })}
                      {filteredMembers.length === 0 && (
                        <p className="px-3 py-4 text-center font-['Satoshi',sans-serif] text-[13px] text-[#a3aab0]">
                          No members found
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {assignedMembers.length > 0 && !assignOpen && (
                  <div className="flex w-full flex-wrap items-center gap-3">
                    {assignedMembers.map((m) => (
                      <div key={m.userId} className="group flex items-center gap-2">
                        <div className="relative inline-flex shrink-0">
                          <div
                            className="flex size-[36px] items-center justify-center rounded-full border-[1.5px] border-solid border-white"
                            style={{ backgroundColor: memberAvatarBackground(m.userId) }}
                          >
                            <span className="font-['Satoshi',sans-serif] text-[13.5px] font-medium leading-none text-white">
                              {m.initials}
                            </span>
                          </div>
                          <span className="absolute -right-px -bottom-px flex size-[12px] items-center justify-center rounded-full border-[1.5px] border-solid border-white bg-black">
                            <Check size={7} className="text-white" strokeWidth={3} />
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleAssignee(m.userId)}
                            aria-label={`Remove ${m.name} from this task`}
                            className="absolute -top-1 -right-1 inline-flex size-[18px] items-center justify-center rounded-full border-2 border-white bg-[#0b191f] text-white opacity-0 shadow-[0px_1px_2px_0px_rgba(14,14,34,0.18)] transition-opacity hover:bg-[#1a2d36] focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            <X size={10} strokeWidth={2.5} aria-hidden />
                          </button>
                        </div>
                        <span className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f]">
                          {m.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {assignedMembers.length === 0 && !assignOpen && (
                  <p className="font-['Satoshi',sans-serif] text-[14px] text-[#a3aab0]">
                    No one assigned
                  </p>
                )}
              </div>

              {DIVIDER}

              {/* ── Dependencies ── */}
              <div ref={dependencyPickerRef} className="flex w-full flex-col gap-4">
                <div className="flex w-full items-center justify-between">
                  <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                    Dependencies
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDependencyPickerOpen((v) => !v);
                      setDependencySearch("");
                    }}
                    className="flex size-9 items-center justify-center rounded-[8px] border border-solid border-[#ebedee] bg-white p-2 shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                    aria-label="Add dependency"
                    aria-expanded={dependencyPickerOpen}
                  >
                    <GitBranch size={16} className="text-[#0b191f]" />
                  </button>
                </div>

                {dependencyPickerOpen && (
                  <div className="rounded-[8px] border border-solid border-[#ebedee] bg-white shadow-lg">
                    <div className="flex items-center gap-2 border-b border-solid border-[#f0f0f0] px-3 py-2">
                      <input
                        type="text"
                        value={dependencySearch}
                        onChange={(e) => setDependencySearch(e.target.value)}
                        placeholder="Search tasks..."
                        className="min-w-0 flex-1 border-0 bg-transparent font-['Satoshi',sans-serif] text-[14px] text-[#0b191f] outline-none placeholder:text-[#a3aab0]"
                      />
                    </div>
                    <div className="scrollbar-hide max-h-[200px] overflow-y-auto">
                      {dependencyOptions.map((t) => {
                        const optId = Number(t.id);
                        const checked = Number.isFinite(optId) && selectedDependencyIds.includes(optId);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              if (!Number.isFinite(optId)) return;
                              setSelectedDependencyIds((prev) =>
                                checked ? prev.filter((id) => id !== optId) : [...prev, optId],
                              );
                            }}
                            className={cn(
                              "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#f5f7f8]",
                              checked && "bg-[#f0f8ff]",
                            )}
                          >
                            <div
                              className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded-[4px] border border-black transition-colors",
                                checked ? "bg-[#24B5F8]" : "bg-white",
                              )}
                              aria-hidden
                            >
                              {checked && <Check className="size-[13px] text-white" strokeWidth={2.5} />}
                            </div>
                            <span className="min-w-0 flex-1 truncate font-['Satoshi',sans-serif] text-[14px] text-[#0b191f]">
                              {t.title}
                            </span>
                          </button>
                        );
                      })}
                      {dependencyOptions.length === 0 && (
                        <p className="px-3 py-4 text-center font-['Satoshi',sans-serif] text-[13px] text-[#a3aab0]">
                          {projectTasks == null ? "Loading tasks..." : "No tasks found"}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {selectedDependencyTasks.length > 0 ? (
                  <div className="flex w-full flex-wrap content-start items-start gap-2">
                    {selectedDependencyTasks.map((dep) => (
                      <span
                        key={dep.id}
                        className="group inline-flex max-w-full items-center gap-1.5 rounded-[16px] border border-solid border-[#cdd2d5] bg-white px-4 py-1.5"
                      >
                        <p className="min-w-0 truncate font-['Satoshi',sans-serif] text-[14px] font-medium leading-none tracking-normal text-[#606d76]">
                          {dep.title}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedDependencyIds((prev) => prev.filter((id) => id !== dep.id))
                          }
                          className="ml-0.5 inline-flex items-center justify-center border-0 bg-transparent p-0 text-[#606d76] hover:text-red-500"
                          aria-label={`Remove dependency ${dep.title}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  !dependencyPickerOpen && (
                    <p className="font-['Satoshi',sans-serif] text-[14px] text-[#a3aab0]">
                      No dependencies
                    </p>
                  )
                )}
              </div>

              {DIVIDER}

              {/* ── Checklist ── */}
              <div className="flex w-full flex-col gap-4">
                <div className="flex w-full items-center justify-between">
                  <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                    Checklist
                  </p>
                  <button
                    type="button"
                    onClick={addSection}
                    className="flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-solid border-[#ebedee] bg-white p-2 shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                    aria-label="Add named checklist section"
                  >
                    <Plus className="size-4 text-[#0b191f]" strokeWidth={2} />
                  </button>
                </div>
                <div className="flex w-full flex-col gap-2">
                  {checklists.map((item, idx) => {
                    const isDragging = checklistDrag.draggingIdx === idx;
                    const isTarget =
                      checklistDrag.draggingIdx !== null &&
                      checklistDrag.draggingIdx !== idx &&
                      checklistDrag.overIdx === idx;
                    return (
                    <div
                      key={item.id}
                      data-checklist-row
                      className={cn(
                        "group/row flex w-full min-w-0 items-start gap-1.5 rounded-md transition-all",
                        isDragging && "opacity-40",
                        isTarget && "ring-2 ring-[#24B5F8]/40",
                      )}
                    >
                      <button
                        type="button"
                        onPointerDown={checklistDrag.onHandlePointerDown(idx)}
                        aria-label="Reorder checklist item"
                        className="mt-0.5 inline-flex size-5 shrink-0 cursor-grab touch-none items-center justify-center rounded-[4px] border-0 bg-transparent text-[#9fa5a8] opacity-0 transition-opacity hover:text-[#0b191f] focus-visible:opacity-100 group-hover/row:opacity-100 active:cursor-grabbing"
                      >
                        <GripVertical className="size-[14px]" strokeWidth={2} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleChecklist(item.id)}
                        className={cn(
                          "mt-0.5 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border border-black transition-colors",
                          item.done
                            ? "bg-[#24B5F8]"
                            : "bg-[#f9f9f9]",
                        )}
                        aria-label={item.done ? "Mark incomplete" : "Mark complete"}
                      >
                        {item.done && <Check className="size-[13px] text-white" strokeWidth={2.5} />}
                      </button>
                      <div className="min-w-0 flex-1 px-4">
                        {item.done ? (
                          <button
                            type="button"
                            onClick={() => toggleChecklist(item.id)}
                            className="block w-full cursor-pointer break-words whitespace-pre-wrap text-left font-['Inter',sans-serif] text-[13px] font-normal leading-[19px] tracking-normal text-[#0b191f] opacity-50 line-through"
                          >
                            {item.text}
                          </button>
                        ) : (
                          <ChecklistRowInput
                            value={item.text}
                            onChange={(v) => updateChecklistText(item.id, v)}
                            onBlur={() => removeChecklistIfEmpty(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                e.stopPropagation();
                                addChecklistRow();
                              }
                            }}
                            placeholder="Checklist item..."
                            inputRef={(el) => {
                              if (el) checklistInputRefs.current.set(item.id, el);
                              else checklistInputRefs.current.delete(item.id);
                            }}
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => removeChecklistRow(item.id)}
                        aria-label="Remove checklist item"
                        className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-[4px] border-0 bg-transparent text-[#727d83] opacity-0 transition-opacity hover:bg-[#f3f5f7] hover:text-[#b91c1c] focus-visible:opacity-100 group-hover/row:opacity-100"
                      >
                        <X className="size-3" strokeWidth={2} aria-hidden />
                      </button>
                    </div>
                    );
                  })}
                  {checklists.length === 0 && (
                    <p className="font-['Satoshi',sans-serif] text-[14px] text-[#a3aab0]">
                      No checklist items
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={addChecklistRow}
                  className="inline-flex items-center gap-1.5 self-start rounded-[6px] px-2 py-1 text-[13px] font-medium text-[#606d76] transition-colors hover:bg-[#f3f5f7] hover:text-[#0b191f]"
                >
                  <Plus size={12} /> Add item
                </button>
              </div>

              {/* ── Named checklist sections (created via the Checklist + button) ── */}
              {sections.map((section) => (
                <div key={section.id} className="group/section flex w-full flex-col gap-4">
                  <div className="flex items-center justify-between gap-2">
                    {editingSectionNameId === section.id ? (
                      <input
                        ref={(el) => {
                          if (el && section.id) sectionNameInputRefs.current.set(section.id, el);
                          else if (section.id) sectionNameInputRefs.current.delete(section.id);
                        }}
                        type="text"
                        value={section.name}
                        onChange={(e) => section.id && renameSection(section.id, e.target.value)}
                        onBlur={() => section.id && commitSectionName(section.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                            (e.target as HTMLInputElement).blur();
                          }
                          if (e.key === "Escape") setEditingSectionNameId(null);
                        }}
                        placeholder="Checklist title"
                        className="flex-1 border-0 bg-transparent font-['Satoshi',sans-serif] text-[16px] font-medium leading-none text-[#0b191f] outline-none placeholder:text-[#9fa5a8]"
                        aria-label="Checklist title"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => section.id && setEditingSectionNameId(section.id)}
                        className="flex-1 cursor-text border-0 bg-transparent p-0 text-left font-['Satoshi',sans-serif] text-[16px] font-medium leading-none text-[#0b191f]"
                        aria-label={`Rename ${section.name}`}
                      >
                        {section.name || "Untitled checklist"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => section.id && removeSection(section.id)}
                      className="inline-flex size-7 items-center justify-center rounded-[6px] text-[#727d83] opacity-0 transition-opacity hover:bg-[#f3f5f7] hover:text-[#b91c1c] focus-visible:opacity-100 group-hover/section:opacity-100"
                      aria-label={`Delete checklist ${section.name}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {section.type === "checklist" && (section.items ?? []).length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {(section.items ?? []).map((it) => (
                        <div
                          key={it.id}
                          className="group/row flex w-full min-w-0 items-start gap-1.5 rounded-md"
                        >
                          <button
                            type="button"
                            onClick={() => section.id && it.id && toggleSectionItem(section.id, it.id)}
                            className={cn(
                              "mt-0.5 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border border-black transition-colors",
                              it.done ? "bg-[#24B5F8]" : "bg-[#f9f9f9]",
                            )}
                            aria-label={it.done ? "Mark incomplete" : "Mark complete"}
                          >
                            {it.done && <Check className="size-[13px] text-white" strokeWidth={2.5} />}
                          </button>
                          <div className="min-w-0 flex-1 px-4">
                            {it.done ? (
                              <button
                                type="button"
                                onClick={() => section.id && it.id && toggleSectionItem(section.id, it.id)}
                                className="block w-full cursor-pointer break-words whitespace-pre-wrap text-left font-['Inter',sans-serif] text-[13px] font-normal leading-[19px] tracking-normal text-[#0b191f] opacity-50 line-through"
                              >
                                {it.text}
                              </button>
                            ) : (
                              <ChecklistRowInput
                                value={it.text}
                                onChange={(v) => section.id && it.id && updateSectionItemText(section.id, it.id, v)}
                                onBlur={() => section.id && it.id && removeSectionItemIfEmpty(section.id, it.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (section.id) addSectionItem(section.id);
                                  }
                                }}
                                placeholder="Checklist item..."
                                inputRef={(el) => {
                                  if (el && it.id) sectionItemInputRefs.current.set(it.id, el);
                                  else if (it.id) sectionItemInputRefs.current.delete(it.id);
                                }}
                              />
                            )}
                          </div>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => section.id && it.id && removeSectionItem(section.id, it.id)}
                            aria-label="Remove checklist item"
                            className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-[4px] border-0 bg-transparent text-[#727d83] opacity-0 transition-opacity hover:bg-[#f3f5f7] hover:text-[#b91c1c] focus-visible:opacity-100 group-hover/row:opacity-100"
                          >
                            <X className="size-3" strokeWidth={2} aria-hidden />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => section.id && addSectionItem(section.id)}
                    className="inline-flex items-center gap-1.5 self-start rounded-[6px] px-2 py-1 text-[13px] font-medium text-[#606d76] transition-colors hover:bg-[#f3f5f7] hover:text-[#0b191f]"
                  >
                    <Plus size={12} /> Add item
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Footer ─── */}
          <div className="z-[1] flex w-full shrink-0 items-center justify-end border-t border-solid border-[#ebedee] bg-white px-9 py-4">
            <button
              type="button"
              onClick={handleCreate}
              disabled={createTaskMutation.isPending}
              className="flex h-10 cursor-pointer items-center justify-center rounded-[8px] border-0 px-4 py-2 disabled:opacity-60"
              style={{
                backgroundImage:
                  "linear-gradient(164.88deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%), linear-gradient(100.84deg, rgb(36, 181, 248) 1.258%, rgb(85, 33, 254) 269.28%), linear-gradient(90deg, rgb(36, 181, 248) 0%, rgb(36, 181, 248) 100%)",
              }}
            >
              <span className="font-['Inter',sans-serif] text-[14px] font-semibold text-white">
                {createTaskMutation.isPending ? "Creating..." : "Create Task"}
              </span>
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
