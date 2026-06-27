import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CalendarPlus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";

import { useDeleteProject, useUpdateProject } from "@/api/hooks";
import { WORKSPACE_BASE } from "@/lib/workspacePaths";
import { useAutosizeTextarea } from "@/hooks/useAutosizeTextarea";
import { Dialog, DialogClose, DialogOverlay, DialogPortal } from "@/app/components/ui/dialog";
import { cn } from "@/app/components/ui/utils";

type ProjectSettingsProjectTabProps = {
  projectId: number;
  initialName: string;
  initialDescription: string;
  initialStartDateIso: string | null;
  initialDueDateIso: string | null;
  /** Whether the caller may edit project details (project.edit.* permissions). */
  canEdit?: boolean;
  /** Whether the caller may delete the project (project.delete). */
  canDelete?: boolean;
  onClose: () => void;
};

function formatDateDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${m} / ${d} / ${y}`;
}

/** The "Project" tab — edit name, description, dates; delete the project. */
export function ProjectSettingsProjectTab({
  projectId,
  initialName,
  initialDescription,
  initialStartDateIso,
  initialDueDateIso,
  canEdit = true,
  canDelete = true,
  onClose,
}: ProjectSettingsProjectTabProps) {
  const navigate = useNavigate();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const [projectName, setProjectName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [startDate, setStartDate] = useState(initialStartDateIso ?? "");
  const [dueDate, setDueDate] = useState(initialDueDateIso ?? "");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const dueDateInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useAutosizeTextarea(description, { minPx: 56, maxPx: 200 });

  useEffect(() => {
    setProjectName(initialName);
    setDescription(initialDescription);
    setStartDate(initialStartDateIso ?? "");
    setDueDate(initialDueDateIso ?? "");
  }, [initialName, initialDescription, initialStartDateIso, initialDueDateIso]);

  useEffect(() => {
    if (deleteConfirmOpen) setDeleteConfirmName("");
  }, [deleteConfirmOpen]);

  const nameMatchesForDelete =
    deleteConfirmName.trim() === initialName.trim() && initialName.trim().length > 0;

  const isDirty =
    projectName.trim() !== initialName.trim() ||
    description !== initialDescription ||
    startDate !== (initialStartDateIso ?? "") ||
    dueDate !== (initialDueDateIso ?? "");

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
    } catch {
      // Toast handled in useUpdateProject
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProject.mutateAsync(projectId);
      setDeleteConfirmOpen(false);
      onClose();
      navigate(WORKSPACE_BASE);
    } catch {
      // Toast handled in useDeleteProject
    }
  };

  const openDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    const el = ref.current;
    if (!el) return;
    if (typeof el.showPicker === "function") void el.showPicker();
    else {
      el.focus();
      el.click();
    }
  };

  const dateField = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    ref: React.RefObject<HTMLInputElement | null>,
  ) => (
    <div className="flex w-full flex-col gap-1">
      <p className="text-[14px] font-medium text-muted-foreground">{label}</p>
      <div className="relative w-full">
        <input
          ref={ref}
          type="date"
          tabIndex={-1}
          disabled={!canEdit}
          className="pointer-events-none absolute right-4 top-1/2 z-0 h-px w-px -translate-y-1/2 opacity-0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-hidden="true"
        />
        <button
          type="button"
          disabled={!canEdit}
          className="relative z-10 flex h-10 w-full items-center justify-between gap-2 rounded-[8px] border border-border bg-card px-4 text-left focus:outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-70"
          aria-label={value ? `${label} ${formatDateDisplay(value)}` : `Choose ${label}`}
          onClick={() => openDatePicker(ref)}
        >
          <span
            className={cn(
              "min-w-0 flex-1 text-[16px] font-medium",
              value ? "text-foreground" : "text-muted-foreground/40",
            )}
          >
            {value ? formatDateDisplay(value) : "mm / dd / yyyy"}
          </span>
          <CalendarPlus className="size-4 shrink-0 text-foreground" aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-[737px] flex-col gap-6 px-6 py-6">
      <div className="flex h-10 w-full items-center gap-2 bg-card py-2">
        <div className="h-[30px] w-[2px] rounded-[999px] bg-primary" />
        <input
          type="text"
          placeholder="Project name"
          disabled={!canEdit}
          className="w-full border-none px-0 font-['Satoshi',sans-serif] text-[24px] font-medium text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-0 disabled:cursor-not-allowed"
          style={{ caretColor: projectName ? "var(--primary)" : "transparent" }}
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
      </div>

      <div className="flex w-full flex-col gap-1">
        <p className="text-[14px] font-medium text-muted-foreground">Description</p>
        <div className="flex min-h-[106px] w-full flex-col gap-2 rounded-[8px] border border-border bg-card px-4 pb-2 pt-4 focus-within:border-primary">
          <textarea
            ref={descriptionTextareaRef}
            placeholder="Add description here..."
            maxLength={80}
            rows={1}
            disabled={!canEdit}
            className="max-h-[200px] w-full resize-none overflow-y-auto border-none p-0 text-[16px] font-medium leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-0 disabled:cursor-not-allowed"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <p className="self-end text-[14px] font-medium text-muted-foreground/30">
            {description.length} / 80 Characters
          </p>
        </div>
      </div>

      {dateField("Start date", startDate, setStartDate, startDateInputRef)}
      {dateField("Target delivery date", dueDate, setDueDate, dueDateInputRef)}

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {canDelete ? (
          <button
            type="button"
            disabled={deleteProject.isPending}
            onClick={() => setDeleteConfirmOpen(true)}
            className={cn(
              "inline-flex h-10 min-w-[140px] items-center justify-center rounded-[8px] bg-destructive px-4 font-['Satoshi',sans-serif] text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30",
              deleteProject.isPending && "pointer-events-none opacity-50",
            )}
          >
            Delete project
          </button>
        ) : (
          <span />
        )}
        {canEdit && (
          <div className="w-full sm:w-[130px] sm:shrink-0">
            <button
              type="button"
              disabled={!projectName.trim() || !isDirty || updateProject.isPending}
              onClick={() => void handleSave()}
              className={cn(
                "inline-flex h-10 w-full items-center justify-center rounded-[8px] px-4 text-[14px] font-semibold transition-colors duration-200",
                projectName.trim() && isDirty && !updateProject.isPending
                  ? "bg-primary text-white hover:bg-primary"
                  : "bg-muted text-muted-foreground/50",
              )}
            >
              {updateProject.isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        )}
      </div>

      <Dialog
        open={deleteConfirmOpen}
        onOpenChange={(next) => {
          setDeleteConfirmOpen(next);
          if (!next) setDeleteConfirmName("");
        }}
      >
        <DialogPortal>
          <DialogOverlay className="z-[120] bg-black/25" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed left-1/2 top-1/2 z-[120] flex w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-border bg-card shadow-[0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)]"
          >
            <DialogPrimitive.Title className="border-b border-border bg-card px-9 py-4 text-center font-['Satoshi',sans-serif] text-[16px] font-medium tracking-[-0.16px] text-foreground">
              Delete project
            </DialogPrimitive.Title>
            <div className="flex w-full flex-col gap-6 px-9 py-6">
              <div className="flex items-start gap-3">
                <div className="flex shrink-0 items-start pt-0.5 text-destructive" aria-hidden>
                  <Trash2 className="size-5" strokeWidth={1.75} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="font-['Satoshi',sans-serif] text-[18px] font-medium leading-tight tracking-[-0.18px] text-foreground">
                    Delete this project?
                  </p>
                  <p className="font-['Satoshi',sans-serif] text-[14px] font-medium leading-relaxed text-muted-foreground">
                    {initialName.trim() ? (
                      <>
                        <span className="text-foreground">“{initialName.trim()}”</span> will be
                        permanently removed. This action cannot be undone.
                      </>
                    ) : (
                      "This project will be permanently removed. This action cannot be undone."
                    )}
                  </p>
                </div>
              </div>
              <div className="flex w-full flex-col gap-2">
                <label
                  htmlFor="settings-delete-confirm-name"
                  className="font-['Satoshi',sans-serif] text-[14px] font-medium text-muted-foreground"
                >
                  Type the project name to confirm
                </label>
                <input
                  id="settings-delete-confirm-name"
                  type="text"
                  autoComplete="off"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder={initialName.trim() || "Project name"}
                  className="h-10 w-full rounded-[8px] border border-border bg-card px-3 font-['Satoshi',sans-serif] text-[14px] font-medium text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-0"
                  aria-invalid={deleteConfirmName.length > 0 && !nameMatchesForDelete}
                />
              </div>
              <div className="flex w-full items-center justify-end gap-2">
                <DialogClose asChild>
                  <button
                    type="button"
                    disabled={deleteProject.isPending}
                    className="inline-flex h-10 min-w-[96px] items-center justify-center rounded-[8px] border border-border bg-card px-5 font-['Satoshi',sans-serif] text-[14px] font-semibold text-foreground transition-colors duration-150 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </DialogClose>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleteProject.isPending || !nameMatchesForDelete}
                  className="inline-flex h-10 min-w-[96px] items-center justify-center rounded-[8px] bg-destructive px-5 font-['Satoshi',sans-serif] text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-destructive disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleteProject.isPending ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </div>
  );
}
