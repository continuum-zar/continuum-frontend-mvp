"use client";

import { useCallback, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Flag,
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
import { useCreateTask, useProjectMembers } from "@/api/hooks";
import { formatEstimatedEffortLabel } from "@/api";
import type { ScopeWeight } from "@/types/task";
import { memberAvatarBackground } from "@/lib/memberAvatar";

type ChecklistRow = { id: string; text: string; done: boolean };

type CreateTaskLiveModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  milestoneId?: string | null;
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
}: CreateTaskLiveModalProps) {
  const createTaskMutation = useCreateTask();
  const { data: members } = useProjectMembers(projectId, { enabled: open });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [checklists, setChecklists] = useState<ChecklistRow[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [addingTag, setAddingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState("New tag");
  const [estimatedHours, setEstimatedHours] = useState<number | null>(null);
  const [addingEffort, setAddingEffort] = useState(false);
  const [effortDraft, setEffortDraft] = useState("");
  const [scope, setScope] = useState<ScopeWeight>("M");
  const [scopeOpen, setScopeOpen] = useState(false);
  const [assignedTo, setAssignedTo] = useState<number | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  const titleRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const effortInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setTitle("");
    setDescription("");
    setChecklists([]);
    setTags([]);
    setAddingTag(false);
    setTagDraft("New tag");
    setEstimatedHours(null);
    setAddingEffort(false);
    setEffortDraft("");
    setScope("M");
    setScopeOpen(false);
    setAssignedTo(null);
    setAssignOpen(false);
    setMemberSearch("");
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const addChecklistRow = useCallback(() => {
    setChecklists((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: "", done: false },
    ]);
  }, []);

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
        status: "todo",
        scope_weight: scope,
        due_date: null,
        estimated_hours: estimatedHours,
        assigned_to: assignedTo,
        milestone_id: milestoneId ? Number(milestoneId) : null,
        checklists: checklists
          .filter((c) => c.text.trim())
          .map((c) => ({ text: c.text.trim(), done: c.done })),
        labels: tags.length > 0 ? tags : null,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  };

  const assignedMember = assignedTo != null
    ? (members ?? []).find((m) => m.userId === assignedTo)
    : undefined;

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
            <Flag size={16} className="text-[#606d76]" />
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={3}
                  className="w-full resize-none rounded-[8px] border border-solid border-[#e9e9e9] bg-white px-4 py-3 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#606d76] outline-none placeholder:text-[#cdd2d5]"
                />
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
              <div className="flex w-full flex-col gap-4">
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
                      {filteredMembers.map((m) => (
                        <button
                          key={m.userId}
                          type="button"
                          onClick={() => {
                            setAssignedTo(assignedTo === m.userId ? null : m.userId);
                            setAssignOpen(false);
                            setMemberSearch("");
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#f5f7f8]",
                            assignedTo === m.userId && "bg-[#f0f8ff]",
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
                          {assignedTo === m.userId && (
                            <Check size={16} className="shrink-0 text-[#24B5F8]" />
                          )}
                        </button>
                      ))}
                      {filteredMembers.length === 0 && (
                        <p className="px-3 py-4 text-center font-['Satoshi',sans-serif] text-[13px] text-[#a3aab0]">
                          No members found
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {assignedMember && !assignOpen && (
                  <div className="flex items-center gap-3">
                    <div className="relative inline-flex shrink-0">
                      <div
                        className="flex size-[36px] items-center justify-center rounded-full border-[1.5px] border-solid border-white"
                        style={{ backgroundColor: memberAvatarBackground(assignedMember.userId) }}
                      >
                        <span className="font-['Satoshi',sans-serif] text-[13.5px] font-medium leading-none text-white">
                          {assignedMember.initials}
                        </span>
                      </div>
                      <span className="absolute -right-px -bottom-px flex size-[12px] items-center justify-center rounded-full border-[1.5px] border-solid border-white bg-black">
                        <Check size={7} className="text-white" strokeWidth={3} />
                      </span>
                    </div>
                    <span className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f]">
                      {assignedMember.name}
                    </span>
                  </div>
                )}
                {!assignedMember && !assignOpen && (
                  <p className="font-['Satoshi',sans-serif] text-[14px] text-[#a3aab0]">
                    No one assigned
                  </p>
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
                    onClick={addChecklistRow}
                    className="flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-solid border-[#ebedee] bg-white p-2 shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                    aria-label="Add checklist item"
                  >
                    <Plus className="size-4 text-[#0b191f]" strokeWidth={2} />
                  </button>
                </div>
                <div className="flex w-full flex-col gap-2">
                  {checklists.map((item) => (
                    <div key={item.id} className="flex w-full min-w-0 items-center">
                      <button
                        type="button"
                        onClick={() => toggleChecklist(item.id)}
                        className={cn(
                          "flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border border-solid transition-colors",
                          item.done
                            ? "border-0 bg-[#24B5F8]"
                            : "border-[#ebedee] bg-[#f9f9f9]",
                        )}
                        aria-label={item.done ? "Mark incomplete" : "Mark complete"}
                      >
                        {item.done && <Check className="size-[13px] text-white" strokeWidth={2.5} />}
                      </button>
                      <div className="min-w-0 flex-1 overflow-hidden px-4 py-1">
                        {item.done ? (
                          <button
                            type="button"
                            onClick={() => toggleChecklist(item.id)}
                            className="w-full cursor-pointer text-left font-['Inter',sans-serif] text-[13px] font-normal leading-[19px] tracking-normal text-[#0b191f] opacity-50 line-through"
                          >
                            {item.text}
                          </button>
                        ) : (
                          <input
                            type="text"
                            value={item.text}
                            onChange={(e) => updateChecklistText(item.id, e.target.value)}
                            onBlur={() => removeChecklistIfEmpty(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            }}
                            placeholder="Checklist item..."
                            className="w-full border-0 bg-transparent p-0 font-['Inter',sans-serif] text-[13px] font-normal leading-[19px] tracking-normal text-[#0b191f] outline-none placeholder:text-[#606d76]/70"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  {checklists.length === 0 && (
                    <p className="font-['Satoshi',sans-serif] text-[14px] text-[#a3aab0]">
                      No checklist items
                    </p>
                  )}
                </div>
              </div>
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
