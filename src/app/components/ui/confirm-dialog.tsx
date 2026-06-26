"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, Trash2, type LucideIcon } from "lucide-react";

import { Dialog, DialogClose, DialogOverlay, DialogPortal } from "@/app/components/ui/dialog";
import { cn } from "@/app/components/ui/utils";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Centered label in the top bar, e.g. "Delete task". */
  headerTitle: string;
  /** Bold heading in the body, e.g. "Delete this task?". */
  title: React.ReactNode;
  /** Body copy explaining the consequence of confirming. */
  description: React.ReactNode;
  /** Confirm button label at rest, e.g. "Delete". */
  confirmLabel: string;
  /** Confirm button label while the action is in flight, e.g. "Deleting…". */
  pendingLabel?: string;
  /** Cancel button label. */
  cancelLabel?: string;
  /** Fired when the confirm button is pressed. */
  onConfirm: () => void;
  /** While true the dialog can't be dismissed and the confirm button is disabled. */
  isPending?: boolean;
  /** Leading accent icon (defaults to a red trash bin). */
  icon?: LucideIcon;
  /** "destructive" (default) renders a red icon + confirm button. */
  variant?: "destructive" | "default";
};

/**
 * Standard confirmation dialog shared by every destructive/confirm flow so they
 * never drift in structure or design. Mirrors the Kanban board's delete-task
 * modal, which is the canonical design for the app.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  headerTitle,
  title,
  description,
  confirmLabel,
  pendingLabel,
  cancelLabel = "Cancel",
  onConfirm,
  isPending = false,
  icon: Icon = Trash2,
  variant = "destructive",
}: ConfirmDialogProps) {
  const destructive = variant === "destructive";
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return;
        onOpenChange(next);
      }}
    >
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
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
              {headerTitle}
            </DialogPrimitive.Title>
            <div className="size-5" />
          </div>

          <div className="flex w-full flex-col gap-6 px-9 py-6">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex shrink-0 items-start pt-0.5",
                  destructive ? "text-[#dc2626]" : "text-[#606d76]",
                )}
                aria-hidden
              >
                <Icon className="size-5" strokeWidth={1.75} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="font-['Satoshi',sans-serif] text-[18px] font-medium leading-tight tracking-[-0.18px] text-[#0b191f]">
                  {title}
                </p>
                <DialogPrimitive.Description className="font-['Satoshi',sans-serif] text-[14px] font-medium leading-relaxed text-[#606d76]">
                  {description}
                </DialogPrimitive.Description>
              </div>
            </div>

            <div className="flex w-full items-center justify-end gap-2">
              <DialogClose asChild>
                <button
                  type="button"
                  disabled={isPending}
                  className="inline-flex h-10 min-w-[96px] items-center justify-center rounded-[8px] border border-[#e9e9e9] bg-white px-5 font-['Satoshi',sans-serif] text-[14px] font-semibold text-[#0b191f] transition-colors duration-150 hover:bg-[#f5f7f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b191f]/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cancelLabel}
                </button>
              </DialogClose>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isPending}
                className={cn(
                  "inline-flex h-10 min-w-[96px] items-center justify-center rounded-[8px] px-5 font-['Satoshi',sans-serif] text-[14px] font-semibold text-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
                  destructive
                    ? "bg-[#dc2626] hover:bg-[#b91c1c] focus-visible:ring-[#dc2626]/30"
                    : "bg-[#0b191f] hover:bg-[#0b191f]/90 focus-visible:ring-[#0b191f]/30",
                )}
              >
                {isPending && pendingLabel ? pendingLabel : confirmLabel}
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
