"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";

import { Dialog, DialogClose, DialogOverlay, DialogPortal } from "../ui/dialog";
import { cn } from "../ui/utils";

const SUPPORT_EMAIL = "support@continuum.coza";

type ReportIssueModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const textareaClass =
  "min-h-[120px] w-full resize-y rounded-[8px] border border-[#ebedee] px-4 py-3 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none placeholder:text-[#9fa5a8] focus-visible:ring-2 focus-visible:ring-ring";

export function ReportIssueModal({ open, onOpenChange }: ReportIssueModalProps) {
  const [details, setDetails] = useState("");
  const detailsId = useId();
  const detailsRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) setDetails("");
  }, [open]);

  const openMailto = () => {
    const subject = encodeURIComponent("[Continuum] Issue report");
    const bodyText = details.trim() || "(No details provided)";
    const body = encodeURIComponent(bodyText);
    const href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    window.open(href, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="z-[200] bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-[201] flex w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#ebedee] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200",
          )}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            window.setTimeout(() => detailsRef.current?.focus(), 0);
          }}
        >
          <DialogPrimitive.Title className="sr-only">Report an issue</DialogPrimitive.Title>

          <div className="flex items-start justify-between gap-4 border-b border-[#ebedee] px-6 py-5">
            <div className="min-w-0 flex-1">
              <p className="font-['Satoshi',sans-serif] text-[20px] font-medium text-[#0b191f]">
                Report an issue
              </p>
              <p className="mt-1 font-['Satoshi',sans-serif] text-[14px] font-normal text-[#606d76]">
                Describe what happened. Your message opens in your email app so you can send it to{" "}
                {SUPPORT_EMAIL}.
              </p>
            </div>
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-[8px] text-[#0b191f] outline-none ring-offset-2 hover:bg-[#f9f9f9] focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close report issue dialog"
              >
                <X className="size-5" strokeWidth={1.5} aria-hidden />
              </button>
            </DialogClose>
          </div>

          <div className="flex flex-col gap-3 px-6 py-5">
            <label htmlFor={detailsId} className="sr-only">
              Issue details
            </label>
            <textarea
              ref={detailsRef}
              id={detailsId}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="What went wrong? Include steps to reproduce if you can."
              rows={5}
              className={textareaClass}
            />
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-[#ebedee] px-6 py-5">
            <DialogClose asChild>
              <button
                type="button"
                className="h-10 rounded-[8px] border border-[#ebedee] px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel
              </button>
            </DialogClose>
            <button
              type="button"
              onClick={openMailto}
              className="h-10 rounded-[8px] bg-[#0b191f] px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#fcfbf8] outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
            >
              Open in email
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
