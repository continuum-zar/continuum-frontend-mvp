"use client";

import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, CalendarPlus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";

import { useDeleteProject, useUpdateProject } from "@/api/hooks";
import { WORKSPACE_BASE } from "@/lib/workspacePaths";
import { useAutosizeTextarea } from "@/hooks/useAutosizeTextarea";

import { Dialog, DialogClose, DialogOverlay, DialogPortal } from "../ui/dialog";
import { cn } from "../ui/utils";

type EditProjectModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  initialName: string;
  initialDescription: string;
  initialStartDateIso: string | null;
  initialDueDateIso: string | null;
};

function formatDueDateDisplay(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (!y || !m || !d) return iso;
  return `${m} / ${d} / ${y}`;
}

export function EditProjectModal({
  open,
  onOpenChange,
  projectId,
  initialName,
  initialDescription,
  initialStartDateIso,
  initialDueDateIso,
}: EditProjectModalProps) {
  const navigate = useNavigate();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const dueDateInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useAutosizeTextarea(description, {
    minPx: 56,
    maxPx: 200,
  });

  useEffect(() => {
    if (!open) return;
    setProjectName(initialName);
    setDescription(initialDescription);
    setStartDate(initialStartDateIso ?? "");
    setDueDate(initialDueDateIso ?? "");
  }, [open, initialName, initialDescription, initialStartDateIso, initialDueDateIso]);

  useEffect(() => {
    if (deleteConfirmOpen) setDeleteConfirmName("");
  }, [deleteConfirmOpen]);

  const nameMatchesForDelete =
    deleteConfirmName.trim() === initialName.trim() && initialName.trim().length > 0;

  const startInitial = initialStartDateIso ?? "";
  const dueInitial = initialDueDateIso ?? "";
  const isDirty =
    projectName.trim() !== initialName.trim() ||
    description !== initialDescription ||
    startDate !== startInitial ||
    dueDate !== dueInitial;

  const handleSave = async () => {
    const name = projectName.trim();
    if (!name) return;
    try {
      await updateProject.mutateAsync({
        projectId,
        body: {
          name,
          description: description.trim() || null,
          start_date: startDate || null,
          due_date: dueDate || null,
        },
      });
      onOpenChange(false);
    } catch {
      // Toast handled in useUpdateProject
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProject.mutateAsync(projectId);
      setDeleteConfirmOpen(false);
      setDeleteConfirmName("");
      onOpenChange(false);
      navigate(WORKSPACE_BASE);
    } catch {
      // Toast handled in useDeleteProject
    }
  };

  const handleClose = (openFromRadix: boolean) => {
    if (!openFromRadix) {
      setProjectName("");
      setDescription("");
      setStartDate("");
      setDueDate("");
      setDeleteConfirmOpen(false);
      setDeleteConfirmName("");
    }
    onOpenChange(openFromRadix);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogPortal>
          <DialogOverlay className="bg-black/25" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className={cn(
              "fixed left-1/2 top-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[600px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            )}
          >
            <DialogPrimitive.Title className="sr-only">Edit project</DialogPrimitive.Title>

            <div className="grid w-full grid-cols-[20px_1fr_20px] items-center border-b border-[#f5f5f5] bg-[#f9f9f9] px-9 py-4">
              <DialogClose asChild>
                <button type="button" className="inline-flex size-5 items-center justify-center text-[#606d76]" aria-label="Back">
                  <ArrowLeft className="size-5" />
                </button>
              </DialogClose>
              <p className="text-center font-['Satoshi',sans-serif] text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
                Edit project
              </p>
              <div className="size-5" />
            </div>

            <div
              className="flex w-full flex-col gap-6 px-9 py-6"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(90deg, rgb(249, 249, 249) 0%, rgb(249, 249, 249) 100%)",
              }}
            >
              <style>
                {`
                @keyframes blink-cursor {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0; }
                }
                .cursor-blink {
                  animation: blink-cursor 1s step-end infinite;
                }
              `}
              </style>
              <div className="flex h-10 w-full items-center gap-2 bg-white py-2">
                <div
                  className={cn(
                    "h-[30px] w-[2px] rounded-[999px] bg-[#1466ff] transition-opacity",
                    isNameFocused && !projectName && "cursor-blink",
                  )}
                />
                <input
                  type="text"
                  placeholder="Project name"
                  className="w-full border-none px-0 font-['Satoshi',sans-serif] text-[24px] font-medium text-[#0b191f] placeholder:text-[#606d76]/30 focus:outline-none focus:ring-0"
                  style={{ caretColor: projectName ? "#1466ff" : "transparent" }}
                  value={projectName}
                  onFocus={() => setIsNameFocused(true)}
                  onBlur={() => setIsNameFocused(false)}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div className="flex w-full flex-col gap-1">
                <p className="text-[14px] font-medium text-[#606d76]">Description</p>
                <div className="flex min-h-[106px] w-full flex-col gap-2 rounded-[8px] border border-[#e9e9e9] bg-white px-4 pb-2 pt-4 focus-within:border-[#1466ff]">
                  <textarea
                    ref={descriptionTextareaRef}
                    placeholder="Add description here..."
                    maxLength={80}
                    rows={1}
                    className="w-full max-h-[200px] resize-none overflow-y-auto border-none p-0 text-[16px] font-medium leading-relaxed text-[#0b191f] placeholder:text-[#606d76]/40 focus:outline-none focus:ring-0"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <p className="self-end text-[14px] font-medium text-[#606d76]/30">
                    {description.length} / 80 Characters
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-1">
                <p className="text-[14px] font-medium text-[#606d76]">Start date</p>
                <div className="relative w-full">
                  <input
                    ref={startDateInputRef}
                    type="date"
                    tabIndex={-1}
                    className="pointer-events-none absolute right-4 top-1/2 z-0 h-px w-px -translate-y-1/2 opacity-0"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    className="relative z-10 flex h-10 w-full items-center justify-between gap-2 rounded-[8px] border border-[#e9e9e9] bg-white px-4 text-left focus:outline-none focus-visible:border-[#1466ff]"
                    aria-label={
                      startDate
                        ? `Start date ${formatDueDateDisplay(startDate)}`
                        : "Choose start date"
                    }
                    onClick={() => {
                      const el = startDateInputRef.current;
                      if (!el) return;
                      if (typeof el.showPicker === "function") {
                        void el.showPicker();
                      } else {
                        el.focus();
                        el.click();
                      }
                    }}
                  >
                    <span
                      className={cn(
                        "min-w-0 flex-1 text-[16px] font-medium",
                        startDate ? "text-[#0b191f]" : "text-[#606d76]/40",
                      )}
                    >
                      {startDate ? formatDueDateDisplay(startDate) : "mm / dd / yyyy"}
                    </span>
                    <CalendarPlus className="size-4 shrink-0 text-[#0b191f]" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="flex w-full flex-col gap-1">
                <p className="text-[14px] font-medium text-[#606d76]">Target delivery date</p>
                <div className="relative w-full">
                  <input
                    ref={dueDateInputRef}
                    type="date"
                    tabIndex={-1}
                    className="pointer-events-none absolute right-4 top-1/2 z-0 h-px w-px -translate-y-1/2 opacity-0"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    className="relative z-10 flex h-10 w-full items-center justify-between gap-2 rounded-[8px] border border-[#e9e9e9] bg-white px-4 text-left focus:outline-none focus-visible:border-[#1466ff]"
                    aria-label={
                      dueDate
                        ? `Target delivery date ${formatDueDateDisplay(dueDate)}`
                        : "Choose target delivery date"
                    }
                    onClick={() => {
                      const el = dueDateInputRef.current;
                      if (!el) return;
                      if (typeof el.showPicker === "function") {
                        void el.showPicker();
                      } else {
                        el.focus();
                        el.click();
                      }
                    }}
                  >
                    <span
                      className={cn(
                        "min-w-0 flex-1 text-[16px] font-medium",
                        dueDate ? "text-[#0b191f]" : "text-[#606d76]/40",
                      )}
                    >
                      {dueDate ? formatDueDateDisplay(dueDate) : "mm / dd / yyyy"}
                    </span>
                    <CalendarPlus className="size-4 shrink-0 text-[#0b191f]" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  disabled={deleteProject.isPending}
                  onClick={() => setDeleteConfirmOpen(true)}
                  className={cn(
                    "inline-flex h-10 min-w-[140px] items-center justify-center rounded-[8px] bg-[#dc2626] px-4 font-['Satoshi',sans-serif] text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-[#b91c1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626]/30",
                    deleteProject.isPending && "pointer-events-none opacity-50",
                  )}
                >
                  Delete project
                </button>
                <div className="w-full sm:w-[130px] sm:shrink-0">
                  <button
                    type="button"
                    disabled={!projectName.trim() || !isDirty || updateProject.isPending}
                    onClick={() => void handleSave()}
                    className={cn(
                      "inline-flex h-10 w-full items-center justify-center rounded-[8px] px-4 text-[14px] font-semibold transition-colors duration-200",
                      projectName.trim() && isDirty && !updateProject.isPending
                        ? "bg-[#1466ff] text-white hover:bg-[#0051e6]"
                        : "bg-[rgba(96,109,118,0.1)] text-[#606d76]/50",
                    )}
                  >
                    {updateProject.isPending ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onOpenChange={(next) => {
          setDeleteConfirmOpen(next);
          if (!next) setDeleteConfirmName("");
        }}
      >
        <DialogPortal>
          <DialogOverlay className="z-[100] bg-black/25" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className={cn(
              "fixed left-1/2 top-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            )}
          >
            <div className="grid w-full grid-cols-[20px_1fr_20px] items-center border-b border-[#f5f5f5] bg-[#f9f9f9] px-9 py-4">
              <DialogClose asChild>
                <button
                  type="button"
                  className="inline-flex size-5 items-center justify-center text-[#606d76] transition-colors hover:text-[#0b191f]"
                  aria-label="Close"
                >
                  <ArrowLeft className="size-5" />
                </button>
              </DialogClose>
              <DialogPrimitive.Title className="text-center font-['Satoshi',sans-serif] text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
                Delete project
              </DialogPrimitive.Title>
              <div className="size-5" />
            </div>

            <div className="flex w-full flex-col gap-6 px-9 py-6">
              <div className="flex items-start gap-3">
                <div className="flex shrink-0 items-start pt-0.5 text-[#dc2626]" aria-hidden>
                  <Trash2 className="size-5" strokeWidth={1.75} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="font-['Satoshi',sans-serif] text-[18px] font-medium leading-tight tracking-[-0.18px] text-[#0b191f]">
                    Delete this project?
                  </p>
                  <p className="font-['Satoshi',sans-serif] text-[14px] font-medium leading-relaxed text-[#606d76]">
                    {initialName.trim() ? (
                      <>
                        <span className="text-[#0b191f]">“{initialName.trim()}”</span> will be permanently removed. This
                        action cannot be undone.
                      </>
                    ) : (
                      "This project will be permanently removed. This action cannot be undone."
                    )}
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-2">
                <label htmlFor="edit-project-delete-confirm-name" className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76]">
                  Type the project name to confirm
                </label>
                <input
                  id="edit-project-delete-confirm-name"
                  type="text"
                  autoComplete="off"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder={initialName.trim() || "Project name"}
                  className="h-10 w-full rounded-[8px] border border-[#e9e9e9] bg-white px-3 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] placeholder:text-[#606d76]/40 focus:border-[#1466ff] focus:outline-none focus:ring-0"
                  aria-invalid={deleteConfirmName.length > 0 && !nameMatchesForDelete}
                />
              </div>

              <div className="flex w-full items-center justify-end gap-2">
                <DialogClose asChild>
                  <button
                    type="button"
                    disabled={deleteProject.isPending}
                    className="inline-flex h-10 min-w-[96px] items-center justify-center rounded-[8px] border border-[#e9e9e9] bg-white px-5 font-['Satoshi',sans-serif] text-[14px] font-semibold text-[#0b191f] transition-colors duration-150 hover:bg-[#f5f7f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b191f]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </DialogClose>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleteProject.isPending || !nameMatchesForDelete}
                  className="inline-flex h-10 min-w-[96px] items-center justify-center rounded-[8px] bg-[#dc2626] px-5 font-['Satoshi',sans-serif] text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-[#b91c1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626]/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleteProject.isPending ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
}
