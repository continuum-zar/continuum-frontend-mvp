"use client";

import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import { useNavigate } from "react-router";

import { useCreateProject } from "@/api/hooks";
import { projectMainHref } from "@/app/data/dashboardPlaceholderProjects";
import { useAutosizeTextarea } from "@/hooks/useAutosizeTextarea";

import { Dialog, DialogClose, DialogOverlay, DialogPortal } from "../ui/dialog";
import { cn } from "../ui/utils";

type CreateProjectModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function CreateProjectModal({ open, onOpenChange }: CreateProjectModalProps) {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isNameFocused, setIsNameFocused] = useState(false);
  const projectNameInputRef = useRef<HTMLInputElement>(null);
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const dueDateInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useAutosizeTextarea(description, {
    minPx: 56,
    maxPx: 200,
  });

  useEffect(() => {
    if (!open) {
      setIsNameFocused(false);
      return;
    }
    const t = window.setTimeout(() => {
      projectNameInputRef.current?.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  const handleCreate = async () => {
    const name = projectName.trim();
    if (!name) return;
    try {
      const data = await createProject.mutateAsync({
        name,
        description: description.trim() || undefined,
        start_date: startDate || null,
        due_date: dueDate || null,
      });
      onOpenChange(false);
      setProjectName("");
      setDescription("");
      setStartDate("");
      setDueDate("");
      navigate(projectMainHref(String(data.id)));
    } catch {
      // Toast handled in useCreateProject
    }
  };

  const handleClose = (openFromRadix: boolean) => {
    if (!openFromRadix) {
      setProjectName("");
      setDescription("");
      setStartDate("");
      setDueDate("");
      setIsNameFocused(false);
    }
    onOpenChange(openFromRadix);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          aria-describedby={undefined}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[600px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Create Project</DialogPrimitive.Title>

          <div className="grid w-full grid-cols-[20px_1fr_20px] items-center border-b border-[#f5f5f5] bg-[#f9f9f9] px-9 py-4">
            <DialogClose asChild>
              <button type="button" className="inline-flex size-5 items-center justify-center text-[#606d76]" aria-label="Back">
                <ArrowLeft className="size-5" />
              </button>
            </DialogClose>
            <p className="text-center font-['Satoshi',sans-serif] text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
              Create Project
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
                  isNameFocused && !projectName && "cursor-blink"
                )}
              />
              <input
                ref={projectNameInputRef}
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
                      startDate ? "text-[#0b191f]" : "text-[#606d76]/40"
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
              {/* Hidden input is anchored top-right of the row so the native picker opens aligned to the field (sr-only anchors top-left). */}
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
                      dueDate ? "text-[#0b191f]" : "text-[#606d76]/40"
                    )}
                  >
                    {dueDate ? formatDueDateDisplay(dueDate) : "mm / dd / yyyy"}
                  </span>
                  <CalendarPlus className="size-4 shrink-0 text-[#0b191f]" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="flex w-full justify-end">
              <div className="w-[130px]">
                <button
                  type="button"
                  disabled={!projectName.trim() || createProject.isPending}
                  onClick={() => void handleCreate()}
                  className={cn(
                    "inline-flex h-10 w-full items-center justify-center rounded-[8px] px-4 text-[14px] font-semibold transition-colors duration-200",
                    projectName.trim() && !createProject.isPending
                      ? "bg-[#1466ff] text-white hover:bg-[#0051e6]"
                      : "bg-[rgba(96,109,118,0.1)] text-[#606d76]/50"
                  )}
                >
                  {createProject.isPending ? "Creating…" : "Create Project"}
                </button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
