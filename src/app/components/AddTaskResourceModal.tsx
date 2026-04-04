"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Upload, X } from "lucide-react";

import { useUploadAttachment, useAddAttachmentLink } from "@/api/hooks";

import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
} from "./ui/dialog";
import { cn } from "./ui/utils";

const uploadGradient =
  "linear-gradient(165.52913614919697deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)";

type AddTaskResourceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId?: string | number;
};

export function AddTaskResourceModal({ open, onOpenChange, taskId }: AddTaskResourceModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [displayText, setDisplayText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const uploadMutation = useUploadAttachment(taskId ?? null);
  const addLinkMutation = useAddAttachmentLink(taskId ?? null);

  const canUseApi = taskId != null && taskId !== "";
  const pending = uploadMutation.isPending || addLinkMutation.isPending;
  const canSubmit =
    canUseApi &&
    !pending &&
    (pendingFile != null || linkUrl.trim().length > 0);

  useEffect(() => {
    if (!open) return;
    setLinkUrl("");
    setDisplayText("");
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPendingFile(file ?? null);
    if (file) setLinkUrl("");
  };

  const handleSubmit = async () => {
    if (!canSubmit || !canUseApi) return;
    try {
      if (pendingFile) {
        await uploadMutation.mutateAsync(pendingFile);
        onOpenChange(false);
      } else if (linkUrl.trim()) {
        await addLinkMutation.mutateAsync({
          url: linkUrl.trim(),
          name: displayText.trim() || undefined,
        });
        onOpenChange(false);
      }
    } catch {
      // Toasts handled in hooks
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 flex max-h-[min(90vh,720px)] w-[calc(100%-2rem)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Resources</DialogPrimitive.Title>

          <div className="z-[3] grid w-full shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-solid border-[#f5f5f5] bg-[#f9f9f9] px-9 py-4">
            <div className="justify-self-start">
              <DialogClose asChild>
                <button
                  type="button"
                  className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-[#0b191f]"
                  aria-label="Back"
                >
                  <ArrowLeft className="size-5" strokeWidth={2} />
                </button>
              </DialogClose>
            </div>
            <p className="text-center font-['Satoshi',sans-serif] text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
              Resources
            </p>
            <div className="justify-self-end">
              <DialogClose asChild>
                <button
                  type="button"
                  className="inline-flex size-[27px] shrink-0 items-center justify-center rounded-md border-0 bg-transparent p-0 text-[#0b191f]"
                  aria-label="Close"
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
              </DialogClose>
            </div>
          </div>

          <div
            className="z-[2] min-h-0 flex-1 overflow-x-clip overflow-y-auto px-9 py-6"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(90deg, rgb(249, 249, 249) 0%, rgb(249, 249, 249) 100%)",
            }}
          >
            <div className="flex w-full flex-col gap-6 pb-6">
              <div className="flex w-full flex-col gap-2">
                <div className="flex min-h-[235px] w-full flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed border-[#ebedee] px-4 py-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="*/*"
                    className="sr-only"
                    tabIndex={-1}
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-[8px] py-2 pl-4 pr-3 font-['Satoshi',sans-serif] text-[14px] font-bold text-white"
                    style={{ backgroundImage: uploadGradient }}
                  >
                    Upload
                    <Upload className="size-4" strokeWidth={2} />
                  </button>
                  {pendingFile ? (
                    <p className="max-w-full truncate text-center font-['Satoshi',sans-serif] text-[13px] font-medium text-[#606d76]">
                      {pendingFile.name}
                    </p>
                  ) : null}
                </div>
                <div className="flex w-full items-start justify-between font-['Satoshi',sans-serif] text-[14px] font-normal whitespace-nowrap text-[#606d76]">
                  <p>Accepted formats: any</p>
                  <p>Maximum file size: 50mb</p>
                </div>
              </div>

              <div className="flex w-full items-center gap-4">
                <div className="h-px min-h-px flex-1 bg-[#ebedee]" />
                <p className="shrink-0 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#606d76]">Or</p>
                <div className="h-px min-h-px flex-1 bg-[#ebedee]" />
              </div>

              <div className="flex w-full flex-col gap-1">
                <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76]">Paste a link</p>
                <div className="flex h-10 w-full items-center rounded-[8px] border border-solid border-[#e9e9e9] bg-white px-4 py-2">
                  <input
                    type="url"
                    placeholder="Paste a new link"
                    value={linkUrl}
                    onChange={(e) => {
                      setLinkUrl(e.target.value);
                      if (e.target.value.trim()) setPendingFile(null);
                    }}
                    className="w-full min-w-0 border-0 bg-transparent font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none placeholder:text-[#9fa5a8]"
                  />
                </div>
              </div>

              <div className="flex w-full flex-col gap-1">
                <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76]">
                  Display text (Optional)
                </p>
                <div className="flex h-10 w-full items-center rounded-[8px] border border-solid border-[#e9e9e9] bg-white px-4 py-2">
                  <input
                    type="text"
                    placeholder="Text to display"
                    value={displayText}
                    onChange={(e) => setDisplayText(e.target.value)}
                    className="w-full min-w-0 border-0 bg-transparent font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none placeholder:text-[#9fa5a8]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="z-[1] flex w-full shrink-0 items-center justify-end border-t border-solid border-[#ebedee] bg-white px-9 py-4">
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className={cn(
                "inline-flex h-10 items-center justify-center rounded-[8px] px-4 py-2 font-['Inter',sans-serif] text-[14px] font-semibold",
                canSubmit
                  ? "cursor-pointer font-bold text-white"
                  : "cursor-not-allowed bg-[rgba(96,109,118,0.1)] text-[#606d76] opacity-50"
              )}
              style={canSubmit ? { backgroundImage: uploadGradient } : undefined}
            >
              {pending ? "Adding…" : "Add Resource"}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
