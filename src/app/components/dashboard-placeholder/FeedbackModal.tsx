"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useId, useRef, useState } from "react";
import { Check, Loader2, X } from "lucide-react";

import { submitIssueReport } from "@/api/feedback";
import { getApiErrorMessage } from "@/api/hooks";

import { Dialog, DialogClose, DialogOverlay, DialogPortal } from "../ui/dialog";
import { cn } from "../ui/utils";

const inputClass =
  "h-10 w-full rounded-[8px] border border-[#ebedee] px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none placeholder:text-[#9fa5a8] focus-visible:ring-2 focus-visible:ring-ring";

const textareaClass =
  "min-h-[120px] w-full resize-y rounded-[8px] border border-[#ebedee] px-4 py-3 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none placeholder:text-[#9fa5a8] focus-visible:ring-2 focus-visible:ring-ring";

type Phase = "form" | "success";

export type FeedbackModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function isValidOptionalEmail(value: string): boolean {
  const v = value.trim();
  if (!v) return true;
  // Practical check aligned with <input type="email"> — full RFC validation is unnecessary here.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [pending, setPending] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const messageId = useId();
  const emailId = useId();
  const messageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) {
      setMessage("");
      setContactEmail("");
      setPhase("form");
      setPending(false);
      setMessageError(null);
      setEmailError(null);
      setSubmitError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setMessageError("Please describe what happened.");
      return;
    }
    setMessageError(null);

    if (!isValidOptionalEmail(contactEmail)) {
      setEmailError("Enter a valid email address, or leave this blank.");
      return;
    }
    setEmailError(null);
    setSubmitError(null);

    setPending(true);
    try {
      await submitIssueReport({
        message: trimmed,
        contact_email: contactEmail.trim() || null,
      });
      setPhase("success");
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setPending(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setMessage("");
      setContactEmail("");
      setPhase("form");
      setPending(false);
      setMessageError(null);
      setEmailError(null);
      setSubmitError(null);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay className="z-[200] bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-[201] flex w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#ebedee] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200",
          )}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            window.setTimeout(() => messageRef.current?.focus(), 0);
          }}
        >
          <DialogPrimitive.Title className="sr-only">Report an issue</DialogPrimitive.Title>

          <div className="flex items-start justify-between gap-4 border-b border-[#ebedee] px-6 py-5">
            <div className="min-w-0 flex-1">
              <p className="font-['Satoshi',sans-serif] text-[20px] font-medium text-[#0b191f]">
                Report an issue
              </p>
              <p className="mt-1 font-['Satoshi',sans-serif] text-[14px] font-normal text-[#606d76]">
                {phase === "success"
                  ? "Your message was sent to the team."
                  : "Tell us what went wrong. Add a contact email if you want a reply."}
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

          {phase === "success" ? (
            <div className="flex flex-col items-center gap-4 px-6 py-10">
              <div
                className="flex size-12 items-center justify-center rounded-full bg-[#ecfdf3]"
                aria-hidden
              >
                <Check className="size-7 text-[#027a48]" strokeWidth={2} />
              </div>
              <p className="text-center font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                Thanks — we&apos;ve received your report.
              </p>
              <DialogClose asChild>
                <button
                  type="button"
                  className="h-10 rounded-[8px] bg-[#0b191f] px-6 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#fcfbf8] outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Close
                </button>
              </DialogClose>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 px-6 py-5">
                {submitError ? (
                  <p
                    role="alert"
                    className="rounded-[8px] border border-[#fecdca] bg-[#fef3f2] px-3 py-2 font-['Satoshi',sans-serif] text-[14px] text-[#b42318]"
                  >
                    {submitError}
                  </p>
                ) : null}

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor={messageId}
                    className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f]"
                  >
                    What happened? <span className="text-[#b42318]">*</span>
                  </label>
                  <textarea
                    ref={messageRef}
                    id={messageId}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (messageError) setMessageError(null);
                    }}
                    placeholder="Describe the issue and steps to reproduce if you can."
                    rows={5}
                    disabled={pending}
                    aria-invalid={messageError != null}
                    aria-describedby={messageError ? `${messageId}-err` : undefined}
                    className={cn(textareaClass, messageError && "border-[#fecdca]")}
                  />
                  {messageError ? (
                    <p id={`${messageId}-err`} className="font-['Satoshi',sans-serif] text-[13px] text-[#b42318]">
                      {messageError}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor={emailId}
                    className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f]"
                  >
                    Contact email <span className="font-normal text-[#606d76]">(optional)</span>
                  </label>
                  <input
                    id={emailId}
                    type="email"
                    autoComplete="email"
                    value={contactEmail}
                    onChange={(e) => {
                      setContactEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    placeholder="you@company.com"
                    disabled={pending}
                    aria-invalid={emailError != null}
                    aria-describedby={emailError ? `${emailId}-err` : undefined}
                    className={cn(inputClass, emailError && "border-[#fecdca]")}
                  />
                  {emailError ? (
                    <p id={`${emailId}-err`} className="font-['Satoshi',sans-serif] text-[13px] text-[#b42318]">
                      {emailError}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 justify-end gap-2 border-t border-[#ebedee] px-6 py-5">
                <DialogClose asChild>
                  <button
                    type="button"
                    disabled={pending}
                    className="h-10 rounded-[8px] border border-[#ebedee] px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </DialogClose>
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={pending}
                  className="inline-flex h-10 min-w-[120px] items-center justify-center gap-2 rounded-[8px] bg-[#0b191f] px-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#fcfbf8] outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      <span>Sending…</span>
                    </>
                  ) : (
                    "Send report"
                  )}
                </button>
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
