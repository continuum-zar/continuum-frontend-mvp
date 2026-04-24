"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { getApiErrorMessage, useAddAttachmentLink } from "@/api/hooks";
import { uploadTaskAttachment } from "@/api/tasks";

import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
} from "./ui/dialog";
import { cn } from "./ui/utils";

const uploadGradient =
  "linear-gradient(165.52913614919697deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)";

/** Matches copy shown in the modal (50mb). */
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export type TaskResourcePendingUploadRow = {
  clientId: string;
  filename: string;
  status: "uploading" | "error";
  errorMessage?: string;
};

type PendingFileEntry = { clientId: string; file: File };

type AddTaskResourceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId?: string | number;
  /** Syncs optimistic / in-progress rows shown on the task detail resource list. */
  setPendingUploadRows?: Dispatch<SetStateAction<TaskResourcePendingUploadRow[]>>;
};

function newClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function formatShortFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"] as const;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function invalidateTaskAttachmentQueries(queryClient: ReturnType<typeof useQueryClient>, taskId: string | number) {
  void queryClient.invalidateQueries({ queryKey: ["taskAttachments", taskId] });
  void queryClient.invalidateQueries({ queryKey: ["taskTimeline", taskId] });
}

export function AddTaskResourceModal({
  open,
  onOpenChange,
  taskId,
  setPendingUploadRows,
}: AddTaskResourceModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const queryClient = useQueryClient();
  const [linkUrl, setLinkUrl] = useState("");
  const [displayText, setDisplayText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFileEntry[]>([]);
  const [isFileDragActive, setIsFileDragActive] = useState(false);
  const [batchUploading, setBatchUploading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [perFileErrors, setPerFileErrors] = useState<Record<string, string>>({});

  const addLinkMutation = useAddAttachmentLink(taskId ?? null);

  const canUseApi = taskId != null && taskId !== "";
  const pending = batchUploading || addLinkMutation.isPending;
  const canSubmit =
    canUseApi &&
    !pending &&
    (pendingFiles.length > 0 || linkUrl.trim().length > 0);

  useEffect(() => {
    if (!open) return;
    setLinkUrl("");
    setDisplayText("");
    setPendingFiles([]);
    setBatchUploading(false);
    setBatchProgress(null);
    setPerFileErrors({});
    dragDepthRef.current = 0;
    setIsFileDragActive(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open]);

  const addValidatedFiles = useCallback((files: File[]) => {
    if (files.length === 0) return;
    const accepted: PendingFileEntry[] = [];
    for (const file of files) {
      const id = newClientId();
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`"${file.name}" is too large. Maximum size is 50 MB.`);
        continue;
      }
      accepted.push({ clientId: id, file });
    }
    if (accepted.length === 0) return;
    setPendingFiles((prev) => [...prev, ...accepted]);
    setLinkUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removePendingFile = useCallback((clientId: string) => {
    setPendingFiles((prev) => prev.filter((p) => p.clientId !== clientId));
    setPerFileErrors((prev) => {
      const next = { ...prev };
      delete next[clientId];
      return next;
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    addValidatedFiles(Array.from(list));
  };

  const dataTransferHasFiles = (dt: DataTransfer) => [...dt.types].includes("Files");

  const handleDropZoneDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dataTransferHasFiles(e.dataTransfer)) return;
    dragDepthRef.current += 1;
    setIsFileDragActive(true);
  };

  const handleDropZoneDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsFileDragActive(false);
  };

  const handleDropZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dataTransferHasFiles(e.dataTransfer)) {
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDropZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsFileDragActive(false);
    const list = e.dataTransfer.files;
    if (!list?.length) return;
    addValidatedFiles(Array.from(list));
  };

  const handleSubmit = async () => {
    if (!canSubmit || !canUseApi || taskId == null || taskId === "") return;
    try {
      if (pendingFiles.length > 0) {
        const queue = [...pendingFiles];
        const total = queue.length;
        setBatchUploading(true);
        setBatchProgress({ current: 0, total });
        setPerFileErrors({});

        setPendingUploadRows?.(() =>
          queue.map(({ clientId, file }) => ({
            clientId,
            filename: file.name,
            status: "uploading" as const,
          })),
        );

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < queue.length; i += 1) {
          const { clientId, file } = queue[i];
          setBatchProgress({ current: i + 1, total });
          try {
            await uploadTaskAttachment(taskId, file);
            successCount += 1;
            invalidateTaskAttachmentQueries(queryClient, taskId);
            setPendingUploadRows?.((prev) => prev.filter((r) => r.clientId !== clientId));
            setPendingFiles((prev) => prev.filter((p) => p.clientId !== clientId));
          } catch (err) {
            failCount += 1;
            const msg = getApiErrorMessage(err, "Upload failed");
            setPerFileErrors((prev) => ({ ...prev, [clientId]: msg }));
            setPendingUploadRows?.((prev) =>
              prev.map((r) =>
                r.clientId === clientId ? { ...r, status: "error" as const, errorMessage: msg } : r,
              ),
            );
          }
        }

        if (successCount > 0 && failCount === 0) {
          toast.success(successCount === 1 ? "Attachment uploaded successfully" : `${successCount} attachments uploaded`);
        } else if (successCount > 0 && failCount > 0) {
          toast.message(`${successCount} uploaded, ${failCount} failed`, {
            description: "See the resource list or modal for details.",
          });
        } else if (failCount > 0) {
          toast.error("Could not upload attachments");
        }

        setBatchUploading(false);
        setBatchProgress(null);
        onOpenChange(false);
      } else if (linkUrl.trim()) {
        await addLinkMutation.mutateAsync({
          url: linkUrl.trim(),
          name: displayText.trim() || undefined,
        });
        onOpenChange(false);
      }
    } catch {
      setBatchUploading(false);
      setBatchProgress(null);
    }
  };

  const dropHint =
    pendingFiles.length === 0 ? (
      <span>Drop files here, or use Upload</span>
    ) : (
      <span className="text-[#606d76]">Add more files below, or drop to append</span>
    );

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
                <div
                  role="region"
                  aria-label="File upload"
                  aria-describedby="add-task-resource-file-constraints"
                  data-drag-active={isFileDragActive ? "true" : "false"}
                  onDragEnter={handleDropZoneDragEnter}
                  onDragLeave={handleDropZoneDragLeave}
                  onDragOver={handleDropZoneDragOver}
                  onDrop={handleDropZoneDrop}
                  className={cn(
                    "relative flex min-h-[235px] w-full flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed px-4 py-6 transition-[border-color,background-color] duration-200 motion-reduce:transition-none",
                    isFileDragActive
                      ? "border-[var(--primary)] bg-[var(--muted)]"
                      : "border-[var(--border)] bg-transparent",
                  )}
                >
                  {isFileDragActive ? (
                    <div
                      className="pointer-events-none absolute inset-0 rounded-[10px] ring-2 ring-[var(--ring)] ring-inset motion-reduce:transition-none"
                      aria-hidden
                    />
                  ) : null}
                  <input
                    id="add-task-resource-file-input"
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="*/*"
                    className="sr-only"
                    tabIndex={-1}
                    aria-label="Choose files to upload"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    aria-controls="add-task-resource-file-input"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={batchUploading}
                    className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-[8px] py-2 pl-4 pr-3 font-['Satoshi',sans-serif] text-[14px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ backgroundImage: uploadGradient }}
                  >
                    Upload
                    <Upload className="size-4" strokeWidth={2} />
                  </button>
                  <p className="max-w-full text-center font-['Satoshi',sans-serif] text-[13px] font-medium text-[#606d76]">
                    {dropHint}
                  </p>
                </div>
                <div
                  className="flex w-full items-start justify-between font-['Satoshi',sans-serif] text-[14px] font-normal whitespace-nowrap text-[#606d76]"
                  id="add-task-resource-file-constraints"
                >
                  <p>Accepted formats: any</p>
                  <p>Maximum file size: 50mb (per file)</p>
                </div>
                {pendingFiles.length > 0 ? (
                  <ul className="flex w-full flex-col gap-2 rounded-[10px] border border-[#e9e9e9] bg-white p-2" aria-label="Selected files">
                    {pendingFiles.map(({ clientId, file }) => (
                      <li
                        key={clientId}
                        className="flex items-start gap-2 rounded-[8px] bg-[#f9f9f9] px-3 py-2 font-['Satoshi',sans-serif] text-[13px] text-[#0b191f]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{file.name}</p>
                          <p className="text-[12px] text-[#727d83]">{formatShortFileSize(file.size)}</p>
                          {perFileErrors[clientId] ? (
                            <p className="mt-1 text-[12px] font-medium text-[#b42318]">{perFileErrors[clientId]}</p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          className="inline-flex shrink-0 rounded-md p-1 text-[#606d76] hover:bg-[#edf0f3] hover:text-[#0b191f] disabled:opacity-40"
                          aria-label={`Remove ${file.name}`}
                          disabled={batchUploading}
                          onClick={() => removePendingFile(clientId)}
                        >
                          <X className="size-4" strokeWidth={2} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
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
                    disabled={batchUploading}
                    onChange={(e) => {
                      setLinkUrl(e.target.value);
                      if (e.target.value.trim()) setPendingFiles([]);
                    }}
                    className="w-full min-w-0 border-0 bg-transparent font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none placeholder:text-[#9fa5a8] disabled:opacity-50"
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
                    disabled={batchUploading}
                    onChange={(e) => setDisplayText(e.target.value)}
                    className="w-full min-w-0 border-0 bg-transparent font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none placeholder:text-[#9fa5a8] disabled:opacity-50"
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
                "inline-flex h-10 min-w-[140px] items-center justify-center gap-2 rounded-[8px] px-4 py-2 font-['Inter',sans-serif] text-[14px] font-semibold",
                canSubmit
                  ? "cursor-pointer font-bold text-white"
                  : "cursor-not-allowed bg-[rgba(96,109,118,0.1)] text-[#606d76] opacity-50",
              )}
              style={canSubmit ? { backgroundImage: uploadGradient } : undefined}
            >
              {batchUploading && batchProgress ? (
                <>
                  <Loader2 className="size-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden />
                  <span>
                    Uploading {batchProgress.current}/{batchProgress.total}…
                  </span>
                </>
              ) : addLinkMutation.isPending ? (
                "Adding…"
              ) : (
                "Add Resource"
              )}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
