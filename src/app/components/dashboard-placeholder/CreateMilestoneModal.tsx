"use client";

import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, CalendarPlus } from "lucide-react";

import { useCreateMilestone, useUpdateMilestone } from "@/api/hooks";

import { Dialog, DialogClose, DialogOverlay, DialogPortal } from "../ui/dialog";
import { cn } from "../ui/utils";

export type CreateMilestoneModalEditing = {
  id: string;
  name: string;
  description?: string;
  /** `YYYY-MM-DD` from API */
  dueDateIso: string | null | undefined;
};

type CreateMilestoneModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Numeric API project id */
  projectId: number;
  /** When set, the modal updates this milestone instead of creating */
  editingMilestone?: CreateMilestoneModalEditing | null;
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

/**
 * Same layout as {@link CreateProjectModal} — create or edit milestone (name, description, due date).
 */
export function CreateMilestoneModal({
  open,
  onOpenChange,
  projectId,
  editingMilestone = null,
}: CreateMilestoneModalProps) {
  const isEdit = Boolean(editingMilestone);
  const createMilestone = useCreateMilestone(projectId);
  const updateMilestone = useUpdateMilestone(projectId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isNameFocused, setIsNameFocused] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editingMilestone) {
      setName(editingMilestone.name);
      setDescription(editingMilestone.description ?? "");
      const iso = editingMilestone.dueDateIso;
      setDueDate(iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : "");
    } else {
      setName("");
      setDescription("");
      setDueDate("");
    }
  }, [open, editingMilestone]);

  const handleSubmit = async () => {
    const n = name.trim();
    if (!n || !dueDate) return;
    try {
      if (isEdit && editingMilestone) {
        await updateMilestone.mutateAsync({
          milestoneId: editingMilestone.id,
          body: {
            name: n,
            due_date: dueDate,
            description: description.trim() || undefined,
          },
        });
      } else {
        await createMilestone.mutateAsync({
          name: n,
          due_date: dueDate,
          description: description.trim() || undefined,
        });
      }
      onOpenChange(false);
    } catch {
      // Toasts handled in hooks
    }
  };

  const pending = isEdit ? updateMilestone.isPending : createMilestone.isPending;

  const handleClose = (openFromRadix: boolean) => {
    if (!openFromRadix) {
      setName("");
      setDescription("");
      setDueDate("");
    }
    onOpenChange(openFromRadix);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[600px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            {isEdit ? "Edit Milestone" : "Create Milestone"}
          </DialogPrimitive.Title>

          <div className="grid w-full grid-cols-[20px_1fr_20px] items-center border-b border-[#f5f5f5] bg-[#f9f9f9] px-9 py-4">
            <DialogClose asChild>
              <button type="button" className="inline-flex size-5 items-center justify-center text-[#606d76]" aria-label="Back">
                <ArrowLeft className="size-5" />
              </button>
            </DialogClose>
            <p className="text-center font-['Satoshi',sans-serif] text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
              {isEdit ? "Edit Milestone" : "Create Milestone"}
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
                @keyframes blink-cursor-ms {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0; }
                }
                .cursor-blink-ms {
                  animation: blink-cursor-ms 1s step-end infinite;
                }
              `}
            </style>
            <div className="flex h-10 w-full items-center gap-2 bg-white py-2">
              <div
                className={cn(
                  "h-[30px] w-[2px] rounded-[999px] bg-[#1466ff] transition-opacity",
                  isNameFocused && !name && "cursor-blink-ms"
                )}
              />
              <input
                type="text"
                placeholder="Milestone name"
                className="w-full border-none px-0 font-['Satoshi',sans-serif] text-[24px] font-medium text-[#0b191f] placeholder:text-[#606d76]/30 focus:outline-none focus:ring-0"
                style={{ caretColor: name ? "#1466ff" : "transparent" }}
                value={name}
                onFocus={() => setIsNameFocused(true)}
                onBlur={() => setIsNameFocused(false)}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="flex w-full flex-col gap-1">
              <p className="text-[14px] font-medium text-[#606d76]">Description</p>
              <div className="flex h-[106px] flex-col justify-between rounded-[8px] border border-[#e9e9e9] bg-white px-4 pb-2 pt-4 focus-within:border-[#1466ff]">
                <textarea
                  placeholder="Add description here..."
                  maxLength={80}
                  className="size-full resize-none border-none p-0 text-[16px] font-medium text-[#0b191f] placeholder:text-[#606d76]/40 focus:outline-none focus:ring-0"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <p className="self-end text-[14px] font-medium text-[#606d76]/30">
                  {description.length} / 80 Characters
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-1">
              <p className="text-[14px] font-medium text-[#606d76]">Target delivery date</p>
              <div className="relative w-full">
                <input
                  ref={dateInputRef}
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
                    const el = dateInputRef.current;
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
                  disabled={!name.trim() || !dueDate || pending}
                  onClick={() => void handleSubmit()}
                  className={cn(
                    "inline-flex h-10 w-full items-center justify-center rounded-[8px] px-4 text-[14px] font-semibold transition-colors duration-200",
                    name.trim() && dueDate && !pending
                      ? "bg-[#1466ff] text-white hover:bg-[#0051e6]"
                      : "bg-[rgba(96,109,118,0.1)] text-[#606d76]/50"
                  )}
                >
                  {pending
                    ? isEdit
                      ? "Saving…"
                      : "Creating…"
                    : isEdit
                      ? "Save changes"
                      : "Create Milestone"}
                </button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
