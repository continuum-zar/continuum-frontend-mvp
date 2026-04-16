"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowUp, Check, FileText, Loader2, Minus, X } from "lucide-react";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";
import {
  generateTasks,
  confirmTasks,
  getApiErrorMessage,
  postProjectQuery,
  projectKeys,
  useUploadPlannerFile,
  type FileContent,
} from "@/api";
import TextareaAutosize from "react-textarea-autosize";
import type { GeneratedTask, WikiConfirmTaskItem } from "@/api";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
} from "../ui/dialog";
import { cn } from "../ui/utils";
import {
  CreateTaskModal,
  type CreateTaskModalPrefill,
  type ChecklistRow,
} from "../CreateTaskModal";
import { PlannerAssistantMarkdown } from "../planner/PlannerAssistantMarkdown";

/** Figma — base panel 14:3223 / welcome mock 14:3453, 395×537 */
const imgChevronDown = mcpAsset("efd29821-4b68-45a8-a943-000591716212");
const imgSquarePen = mcpAsset("8b659cef-3407-4a90-9a3b-040a80e97dd7");
const imgMinus = mcpAsset("398b8c9e-4389-4bf0-b963-a0ba27edd9e9");
const imgBot = mcpAsset("39d27ae7-19c5-4d7d-b5fa-d32575b9f513");
const imgPlus = mcpAsset("0d0492e3-ad36-48a3-8f2a-a9ea51d299e4");
const imgSettings2 = mcpAsset("dce388b9-22f0-4c35-976b-ca6706b88382");
/** Figma — active chat 14:3531 / 14:3595 */
const imgSquarePenChat = mcpAsset("79fbaac6-1ad4-4409-9061-0ae19953dbea");
const imgEllipsis = mcpAsset("8a1cc0a4-ebd0-4e5d-b345-dccb8e9fd5b1");
const imgChevronDownChat = mcpAsset("01a53fe2-c907-40d9-bed5-3d02e00d882e");
const imgLucideSquare = mcpAsset("e40fa00b-dbb1-4554-9a43-c7e4cbe8cb5c");
const imgChevronRightThought = mcpAsset("ab00dcdd-398d-4dfc-b3f7-4fc77a4515a3");
const imgPlusChat = mcpAsset("5f40ebe2-bfb1-49bf-b797-367653d10f56");
const imgSettingsChat = mcpAsset("41a9a4e3-6a20-4694-9477-56c0c6ed916b");
const imgArrowUpChat = mcpAsset("ff641961-e4ca-488f-aa65-39498a45ed47");

/** Figma 14:1031 SpinnerGradient — 16px ring */
const imgSpinnerRing = mcpAsset("27cbd367-f262-4de4-bd86-598cee0210f1");

const SUGGESTED_PROMPTS = [
  "How is the project going?",
  "Is the project data reliable?",
  "What is blocking progress?",
  "Are there any health risks?",
  "Show recent key updates",
  "How is our current velocity?",
  "Is the timeline on track?",
] as const;

const MOCK_AI_BODY =
  "42% of weighted scope is complete. There have been 3 structural updates in the last sprint. Signals are Stable based on hours-per-scope efficiency. 2 tasks are currently flagged as stalled or missing scope.";

const THINKING_MS = 1600;

type WelcomeComposerAttachment = {
  id: string;
  fileContent: FileContent;
  isImage: boolean;
  previewUrl?: string;
};

type ChatPhase = "welcome" | "thinking" | "responded" | "getStartedLoading" | "getStartedAnswer";

type ReportingMsg =
  | { id: string; role: "user"; content: string }
  | {
      id: string;
      role: "assistant";
      content: string;
      isError?: boolean;
      confidence?: number;
    };

function isAbortError(err: unknown): boolean {
  const e = err as { code?: string; name?: string };
  return e?.code === "ERR_CANCELED" || e?.name === "CanceledError" || e?.name === "AbortError";
}

const REPORTING_LEARN_MORE =
  "Continuum only answers from project data Continuum already tracks (tasks, hours, commits, health signals). It does not predict delivery dates, use general web knowledge, or answer unrelated topics. If something is not in the data, it will say so.";

function mapGeneratedTaskToPrefill(task: GeneratedTask, idx: number): CreateTaskModalPrefill {
  const checklist: ChecklistRow[] = (task.checklist ?? []).map((c, ci) => ({
    id: `gen-${idx}-${ci}`,
    text: c.title,
    done: c.is_completed ?? false,
  }));
  const rawLabels = task.labels ?? [];
  const labels = rawLabels.map((l) => String(l).trim()).filter(Boolean);

  return {
    title: task.title,
    description: task.description ?? "",
    descriptionMeta: `${(task.description ?? "").length}/10000 Characters`,
    checklist,
    labels,
  };
}

function mapGeneratedTaskToConfirmItem(
  task: GeneratedTask,
  projectId: number,
  milestoneId: number | null,
): WikiConfirmTaskItem {
  return {
    title: task.title,
    description: task.description ?? null,
    project_id: projectId,
    milestone_id: milestoneId,
    scope_weight: task.scope_weight,
    status: "todo",
    checklists:
      task.checklist?.length > 0
        ? task.checklist.map((c) => ({ text: c.title, done: c.is_completed ?? false }))
        : null,
    labels: task.labels && task.labels.length > 0 ? task.labels : null,
  };
}

/** URL `milestone` query is a numeric string; backend expects integer or null. */
function parseMilestoneIdParam(param: string | null | undefined): number | null {
  if (param == null || param === "") return null;
  const n = Number(param);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <div className={cn("relative size-[16px] shrink-0 overflow-clip", className)}>
      <div className="absolute bottom-[37.5%] left-1/4 right-1/4 top-[37.5%]">
        <div className="absolute inset-[-8.33%_-4.17%]">
          <img alt="" className="block size-full max-w-none" src={imgChevronDownChat} />
        </div>
      </div>
    </div>
  );
}

type WelcomeAiChatModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When false, hides suggested prompt chips (e.g. Get started / board FAB). Default true. */
  showQuickActions?: boolean;
  /** Required for task generation when showQuickActions=false (board FAB). */
  projectId?: number | null;
  /** Current kanban milestone from `?milestone=` — bulk-created tasks are assigned to this milestone. */
  milestoneId?: string | null;
};

export function WelcomeAiChatModal({
  open,
  onOpenChange,
  showQuickActions = true,
  projectId,
  milestoneId: milestoneIdParam,
}: WelcomeAiChatModalProps) {
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<ChatPhase>("welcome");
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [taskReviewOpen, setTaskReviewOpen] = useState(false);
  const [taskReviewIndex, setTaskReviewIndex] = useState(0);

  // Real API state (getStarted / !showQuickActions flow)
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [generatedSummary, setGeneratedSummary] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  /** Always matches latest generated list so Create All never closes over an empty array. */
  const generatedTasksRef = useRef<GeneratedTask[]>([]);
  generatedTasksRef.current = generatedTasks;

  /** Project overview assistant: real Q&A via POST /projects/:id/query (not task generation). */
  const [reportingThread, setReportingThread] = useState<ReportingMsg[]>([]);
  const [reportingPending, setReportingPending] = useState(false);
  const reportingAbortRef = useRef<AbortController | null>(null);
  const reportingLockRef = useRef(false);

  const [composerAttachments, setComposerAttachments] = useState<WelcomeComposerAttachment[]>([]);
  const composerAttachmentsRef = useRef(composerAttachments);
  composerAttachmentsRef.current = composerAttachments;
  const welcomeFileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadPlannerFile();

  const clearComposerAttachments = useCallback(() => {
    setComposerAttachments((prev) => {
      for (const a of prev) {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
      }
      return [];
    });
  }, []);

  const addComposerFiles = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        try {
          const result = await uploadMutation.mutateAsync(file);
          const isImage = file.type.startsWith("image/");
          const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
          setComposerAttachments((prev) => [
            ...prev,
            {
              id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
              fileContent: result,
              isImage,
              previewUrl,
            },
          ]);
          toast.success(`Uploaded ${result.filename}`);
        } catch {
          // toast from hook
        }
      }
      if (welcomeFileInputRef.current) welcomeFileInputRef.current.value = "";
    },
    [uploadMutation],
  );

  const removeComposerAttachment = useCallback((id: string) => {
    setComposerAttachments((prev) => {
      const found = prev.find((a) => a.id === id);
      if (found?.previewUrl) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const milestoneIdForConfirm = useMemo(
    () => parseMilestoneIdParam(milestoneIdParam ?? null),
    [milestoneIdParam],
  );

  const useReportingApi = useMemo(
    () => Boolean(showQuickActions && projectId != null && Number(projectId) > 0),
    [showQuickActions, projectId],
  );

  useEffect(() => {
    if (!open) {
      clearComposerAttachments();
      setPhase("welcome");
      setSelectedPrompt(null);
      setDraftMessage("");
      setTaskReviewOpen(false);
      setTaskReviewIndex(0);
      setGeneratedTasks([]);
      setGeneratedSummary("");
      setApiError(null);
      setConfirming(false);
      setConfirmed(false);
      abortRef.current?.abort();
      abortRef.current = null;
      setReportingThread([]);
      setReportingPending(false);
      reportingLockRef.current = false;
      reportingAbortRef.current?.abort();
      reportingAbortRef.current = null;
    }
  }, [open, clearComposerAttachments]);

  // showQuickActions=true mock "thinking -> responded" transition (welcome demo only — no projectId)
  useEffect(() => {
    if (phase !== "thinking" || !showQuickActions || useReportingApi) return;
    const t = window.setTimeout(() => setPhase("responded"), THINKING_MS);
    return () => window.clearTimeout(t);
  }, [phase, showQuickActions, useReportingApi]);

  const sendReportingQuery = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || projectId == null || reportingLockRef.current) return;
      const fileContents = composerAttachmentsRef.current.map((a) => a.fileContent);
      reportingLockRef.current = true;
      const pid = projectId;
      const controller = new AbortController();
      reportingAbortRef.current = controller;
      setReportingPending(true);
      setReportingThread((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: trimmed }]);
      setDraftMessage("");
      try {
        const res = await postProjectQuery(
          pid,
          {
            query: trimmed,
            ...(fileContents.length > 0 ? { file_contents: fileContents } : {}),
          },
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        setReportingThread((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: res.answer ?? "No response.",
            confidence: res.confidence,
          },
        ]);
        clearComposerAttachments();
      } catch (err) {
        if (isAbortError(err)) return;
        const msg = getApiErrorMessage(err, "Could not get an answer. Try again.");
        setReportingThread((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: msg, isError: true },
        ]);
      } finally {
        reportingLockRef.current = false;
        setReportingPending(false);
        reportingAbortRef.current = null;
      }
    },
    [projectId, clearComposerAttachments],
  );

  const startPrompt = (text: string) => {
    if (useReportingApi) {
      void sendReportingQuery(text);
      return;
    }
    setSelectedPrompt(text);
    setPhase("thinking");
  };

  const submitGetStartedPrompt = useCallback(async () => {
    const text = draftMessage.trim();
    if (!text || !projectId) return;
    setSelectedPrompt(text);
    setDraftMessage("");
    setApiError(null);
    setPhase("getStartedLoading");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const fileContents = composerAttachmentsRef.current.map((a) => a.fileContent);
      const res = await generateTasks(projectId, {
        prompt: text,
        max_tasks: 10,
        ...(fileContents.length > 0 ? { file_contents: fileContents } : {}),
      });
      if (controller.signal.aborted) return;

      setGeneratedTasks(res.tasks);
      const count = res.tasks.length;
      setGeneratedSummary(
        count === 0
          ? "I couldn't generate any tasks from that prompt. Try being more specific."
          : count === 1
            ? "I generated 1 task based on your request."
            : `I generated ${count} tasks based on your request.`,
      );
      setPhase("getStartedAnswer");
      clearComposerAttachments();
    } catch (err) {
      if (controller.signal.aborted) return;
      const msg = getApiErrorMessage(
        err,
        "Task generation failed. Make sure the repository is indexed and try again.",
      );
      setApiError(msg);
      setPhase("getStartedAnswer");
    }
  }, [draftMessage, projectId, clearComposerAttachments]);

  const stopGetStarted = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    clearComposerAttachments();
    setPhase("welcome");
    setSelectedPrompt(null);
    setGeneratedTasks([]);
    setGeneratedSummary("");
    setApiError(null);
  };

  const handleConfirmAll = useCallback(async () => {
    const pid = projectId;
    const tasks = generatedTasksRef.current;
    if (pid == null || !Number.isFinite(pid) || tasks.length === 0 || confirming || confirmed) {
      if (showQuickActions === false && (pid == null || !Number.isFinite(pid))) {
        toast.error("Missing project context. Open the AI chat from a project board.");
      }
      return;
    }
    setConfirming(true);
    try {
      const items = tasks.map((t) => mapGeneratedTaskToConfirmItem(t, pid, milestoneIdForConfirm));
      const res = await confirmTasks(pid, { tasks: items });
      if (res.created_count < 1) {
        toast.error("No tasks were created. Try again.");
        return;
      }
      setConfirmed(true);
      toast.success(res.created_count === 1 ? "Created 1 task" : `Created ${res.created_count} tasks`);
      await queryClient.invalidateQueries({ queryKey: projectKeys.tasks(pid) });
      await queryClient.refetchQueries({ queryKey: projectKeys.tasks(pid) });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create tasks. Try again."));
    } finally {
      setConfirming(false);
    }
  }, [
    projectId,
    milestoneIdForConfirm,
    confirming,
    confirmed,
    queryClient,
    showQuickActions,
  ]);

  const isReportingChat = useReportingApi && (reportingThread.length > 0 || reportingPending);
  const isChat = isReportingChat || (!useReportingApi && phase !== "welcome");
  const isGetStartedFlow = !showQuickActions;

  const reportingHeaderSubtitle = useMemo(() => {
    for (let i = reportingThread.length - 1; i >= 0; i--) {
      if (reportingThread[i].role === "user") return reportingThread[i].content;
    }
    return null;
  }, [reportingThread]);

  const usePromptInHeader =
    showQuickActions &&
    isChat &&
    (useReportingApi
      ? reportingPending || reportingHeaderSubtitle != null
      : phase === "thinking" || phase === "responded");

  const showHeaderEllipsis =
    showQuickActions &&
    (useReportingApi
      ? isReportingChat && (reportingPending || reportingThread.length > 0)
      : phase === "thinking" || phase === "responded");

  const taskReviewPrefill = useMemo((): CreateTaskModalPrefill | undefined => {
    const task = generatedTasks[taskReviewIndex];
    if (!task) return undefined;
    return mapGeneratedTaskToPrefill(task, taskReviewIndex);
  }, [generatedTasks, taskReviewIndex]);

  return (
  <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onPointerDownOutside={(e) => {
            if (taskReviewOpen) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (taskReviewOpen) e.preventDefault();
          }}
          onFocusOutside={(e) => {
            if (taskReviewOpen) e.preventDefault();
          }}
          className={cn(
            "isolate data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-2 data-[state=open]:slide-in-from-bottom-2 fixed z-50 flex flex-col items-start overflow-hidden rounded-[19px] border border-solid border-[#edecea] bg-white shadow-[0px_86px_24px_0px_rgba(11,25,31,0),0px_55px_22px_0px_rgba(11,25,31,0.01),0px_31px_19px_0px_rgba(11,25,31,0.03),0px_14px_14px_0px_rgba(11,25,31,0.04),0px_3px_8px_0px_rgba(11,25,31,0.05)] duration-200",
            "bottom-6 right-6 top-auto left-auto max-h-[min(537px,calc(100vh-32px))] w-[min(395px,calc(100vw-32px))] max-w-[395px] translate-x-0 translate-y-0",
            "h-[537px] outline-none",
          )}
          data-node-id="14:3223"
        >
          <DialogPrimitive.Title className="sr-only">AI assistant</DialogPrimitive.Title>

          {/* Header */}
          <div
            className={cn(
              "relative z-10 flex w-full shrink-0 items-center justify-between",
              isChat ? "bg-white px-[15px] pb-0 pt-[15px]" : "bg-white py-2 pl-2 pr-4",
            )}
          >
            <div className="relative flex min-w-0 shrink items-center gap-1.5 rounded-[40px] py-1 pr-2 pl-2">
              <p
                className={cn(
                  "relative min-w-0 shrink truncate font-['Satoshi',sans-serif] text-[13px] font-medium not-italic leading-[normal]",
                  usePromptInHeader ? "text-[#727d83]" : "text-[#151515]",
                )}
              >
                {usePromptInHeader ? (useReportingApi ? reportingHeaderSubtitle ?? "" : selectedPrompt) : "New AI chat"}
              </p>
              {usePromptInHeader ? (
                <ChevronDown />
              ) : (
                <div className="relative flex size-[16px] shrink-0 items-center justify-center">
                  <div className="absolute bottom-[37.5%] left-1/4 right-1/4 top-[37.5%]">
                    <div className="absolute inset-[-8.33%_-4.17%]">
                      <img alt="" className="block size-full max-w-none" src={imgChevronDown} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="relative flex shrink-0 items-center gap-3">
              <div className="relative flex size-4 shrink-0 items-center justify-center">
                <div className="absolute inset-[8.35%_8.35%_12.5%_12.5%]">
                  <div className="absolute inset-[-3.95%]">
                    <img alt="" className="block size-full max-w-none" src={isChat ? imgSquarePenChat : imgSquarePen} />
                  </div>
                </div>
              </div>
              {showHeaderEllipsis && (
                <div className="relative flex size-4 shrink-0 items-center justify-center">
                  <div className="absolute inset-[45.83%_16.67%]">
                    <div className="absolute inset-[-25%_-3.12%_-25%_-3.13%]">
                      <img alt="" className="block size-full max-w-none" src={imgEllipsis} />
                    </div>
                  </div>
                </div>
              )}
              <button
                type="button"
                className="relative flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-[24px] border-0 bg-white p-0 text-[#727d83]"
                aria-label={isChat ? "Minimize" : "Close"}
                onClick={() => onOpenChange(false)}
              >
                {isChat ? (
                  <Minus className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                ) : (
                  <div className="relative size-4 shrink-0 overflow-clip">
                    <div className="absolute bottom-1/2 left-[20.83%] right-[20.83%] top-1/2">
                      <div className="absolute inset-[-0.75px_-8.04%]">
                        <img alt="" className="block size-full max-w-none" src={imgMinus} />
                      </div>
                    </div>
                  </div>
                )}
              </button>
            </div>
          </div>

          {!isChat ? (
            <>
              <div className="relative z-[1] flex h-[494px] w-full shrink-0 flex-col items-start">
                <div className="relative flex min-h-0 w-full min-w-0 max-w-[395px] flex-1 flex-col items-start gap-4 overflow-x-clip overflow-y-auto bg-white px-4 pb-[137px] pt-12">
                  <div className="relative flex w-full shrink-0 flex-col items-start gap-[15px]">
                    <div className="relative flex w-full shrink-0 items-start">
                      <p className="relative shrink-0 whitespace-nowrap font-['Satoshi',sans-serif] text-[15.75px] font-medium not-italic leading-[normal] text-[#0b191f]">
                        How can I help you today?
                      </p>
                    </div>
                  </div>
                  {showQuickActions && (
                    <div className="relative flex w-full shrink-0 flex-col items-start gap-2">
                      {SUGGESTED_PROMPTS.map((label, i) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => startPrompt(label)}
                          className={cn(
                            "relative flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-[32px] border border-solid border-[#ededed] bg-white px-4 py-2",
                            i === 0 ? "text-left" : "",
                          )}
                        >
                          <p className="relative shrink-0 whitespace-nowrap font-['Satoshi',sans-serif] text-[13px] font-medium not-italic leading-[normal] text-[#727d83]">
                            {label}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pointer-events-none absolute bottom-0 left-0 flex w-full max-w-[395px] flex-col items-center bg-gradient-to-b from-[rgba(255,255,255,0)] to-[25.182%] to-white px-4 pb-[27px]">
                  <div className="pointer-events-auto w-full">
                    {useReportingApi && (
                      <div className="relative mb-[-11px] flex w-full shrink-0 items-center justify-center rounded-tl-[14px] rounded-tr-[14px] bg-[#e7f2fc] px-2.5 pb-[21px] pt-2.5">
                        <div className="relative flex w-[346px] max-w-full shrink-0 items-center gap-2">
                          <div className="relative flex shrink-0 items-center">
                            <div className="relative size-[13px] shrink-0 overflow-clip">
                              <div className="absolute inset-[16.67%_8.33%]">
                                <div className="absolute inset-[-3.13%_-2.5%_-3.12%_-2.5%]">
                                  <img alt="" className="block size-full max-w-none" src={imgBot} />
                                </div>
                              </div>
                            </div>
                          </div>
                          <p className="relative shrink-0 whitespace-nowrap font-['Inter',sans-serif] text-[11px] font-medium not-italic leading-[0] text-[#727d83]">
                            <span className="leading-[normal]">The AI is restricted to reporting on system states. </span>
                            <button
                              type="button"
                              title={REPORTING_LEARN_MORE}
                              className="border-0 bg-transparent p-0 font-['Inter',sans-serif] text-[11px] font-medium not-italic leading-normal text-[#2E96F9]"
                            >
                              Learn more
                            </button>
                          </p>
                        </div>
                      </div>
                    )}
                    <ComposerWelcome
                      draft={draftMessage}
                      onDraftChange={setDraftMessage}
                      onSubmit={
                        isGetStartedFlow
                          ? () => void submitGetStartedPrompt()
                          : useReportingApi
                            ? () => void sendReportingQuery(draftMessage)
                            : undefined
                      }
                      placeholder={
                        useReportingApi
                          ? "Ask about progress, health, or velocity…"
                          : undefined
                      }
                      disabled={isGetStartedFlow && !projectId}
                      attachments={composerAttachments}
                      onRemoveAttachment={removeComposerAttachment}
                      fileInputRef={welcomeFileInputRef}
                      onAddFiles={(files) => void addComposerFiles(files)}
                      uploadPending={uploadMutation.isPending}
                      attachmentsEnabled={
                        Boolean((isGetStartedFlow && projectId) || useReportingApi)
                      }
                    />
                  </div>
                </div>
              </div>
            </>
          ) : isReportingChat && useReportingApi ? (
            <ReportingAssistantPanel
              reportingThread={reportingThread}
              reportingPending={reportingPending}
              draftMessage={draftMessage}
              setDraftMessage={setDraftMessage}
              sendReportingQuery={sendReportingQuery}
              onStopReporting={() => reportingAbortRef.current?.abort()}
              attachments={composerAttachments}
              onRemoveAttachment={removeComposerAttachment}
              fileInputRef={welcomeFileInputRef}
              onAddFiles={(files) => void addComposerFiles(files)}
              uploadPending={uploadMutation.isPending}
            />
          ) : (
            <div className="relative z-[5] flex min-h-0 w-full flex-1 flex-col">
              <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-x-clip overflow-y-auto bg-white px-[15px] pb-4 pt-12">
                <div className="flex w-full flex-col items-end justify-center gap-4">
                  <div className="flex w-full items-start justify-center gap-2 whitespace-nowrap text-center font-['Inter',sans-serif] text-[11px] font-medium leading-[normal] text-[#727d83]">
                    <p>Today</p>
                    <p>Continuum AI</p>
                  </div>
                  <div className="flex w-full justify-end">
                    <div className="max-w-[min(100%,340px)] rounded-[32px] bg-[#edf0f3] px-4 py-2">
                      <p className="whitespace-pre-wrap break-words text-left font-['Satoshi',sans-serif] text-[13px] font-medium not-italic leading-[normal] text-[#0b191f]">
                        {selectedPrompt}
                      </p>
                    </div>
                  </div>
                  <div className="w-full">
                    {/* Thinking state (mock for showQuickActions, real for getStarted) */}
                    {(phase === "thinking" || phase === "getStartedLoading") && (
                      <div className="flex w-full flex-col items-end rounded-[16px]">
                        <div className="flex w-full flex-col items-end gap-5">
                          <div className="flex w-full flex-col items-start gap-2">
                            <div className="flex w-full items-center gap-2 opacity-50">
                              <SpinnerGradientThinking />
                              <p className="flex-1 font-['Inter',sans-serif] text-[13px] font-medium leading-[normal] text-[#151515]">
                                Thinking...
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mock responded (showQuickActions path) */}
                    {phase === "responded" && (
                      <div className="flex w-full flex-col items-end rounded-[16px]">
                        <div className="flex w-full flex-col items-end gap-5">
                          <div className="flex w-full flex-col items-start gap-2">
                            <div className="flex w-full items-center gap-1 opacity-50">
                              <div className="relative size-4 shrink-0">
                                <img alt="" className="absolute block size-full max-w-none" src={imgChevronRightThought} />
                              </div>
                              <p className="flex-1 font-['Inter',sans-serif] text-[13px] font-medium leading-[normal] text-[#151515]">
                                Thought
                              </p>
                            </div>
                            <PlannerAssistantMarkdown content={MOCK_AI_BODY} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Real AI answer with generated tasks */}
                    {phase === "getStartedAnswer" && (
                      <div className="flex w-full flex-col items-end rounded-[16px]">
                        <div className="flex w-full flex-col items-end gap-5">
                          <div className="flex w-full flex-col items-start gap-2">
                            <div className="flex w-full items-center gap-1 opacity-50">
                              <div className="relative size-4 shrink-0">
                                <img alt="" className="absolute block size-full max-w-none" src={imgChevronRightThought} />
                              </div>
                              <p className="flex-1 font-['Inter',sans-serif] text-[13px] font-medium leading-[normal] text-[#151515]">
                                Thought
                              </p>
                            </div>

                            {apiError ? (
                              <p className="w-full font-['Inter',sans-serif] text-[13px] font-normal leading-[19px] not-italic text-[#dc2626]">
                                {apiError}
                              </p>
                            ) : (
                              <>
                                <p className="w-full font-['Inter',sans-serif] text-[13px] font-normal leading-[19px] not-italic text-[#0b191f]">
                                  {generatedSummary}
                                </p>

                                {generatedTasks.length > 0 && (
                                  <>
                                    <div className="mt-1 w-full rounded-[12px] border border-solid border-[#ededed] bg-white p-3">
                                      <ul className="flex flex-col gap-1">
                                        {generatedTasks.map((task, i) => (
                                          <li key={`${task.title}-${i}`} className="list-none">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setTaskReviewIndex(i);
                                                setTaskReviewOpen(true);
                                              }}
                                              className="w-full rounded-md border-0 bg-transparent py-1.5 text-left font-['Inter',sans-serif] text-[13px] font-normal leading-[19px] text-[#0b191f] transition-colors hover:bg-[#f5f5f5]"
                                            >
                                              {task.title}
                                            </button>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={confirming || confirmed}
                                      onClick={() => void handleConfirmAll()}
                                      className={cn(
                                        "mt-2 flex w-full items-center justify-center gap-2 rounded-[8px] px-4 py-2 font-['Satoshi',sans-serif] text-[13px] font-bold outline-none transition-colors",
                                        confirmed
                                          ? "cursor-default bg-[#d7fede] text-[#108e27]"
                                          : confirming
                                            ? "cursor-wait bg-[#2798f5]/80 text-white"
                                            : "cursor-pointer bg-[#2798f5] text-white hover:bg-[#1e87e0]",
                                      )}
                                    >
                                      {confirmed ? (
                                        <>
                                          <Check className="size-4 shrink-0" strokeWidth={2} />
                                          Tasks Created
                                        </>
                                      ) : confirming ? (
                                        <>
                                          <Loader2 className="size-4 shrink-0 animate-spin" strokeWidth={2} />
                                          Creating...
                                        </>
                                      ) : (
                                        <>
                                          Create All Tasks
                                        </>
                                      )}
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="relative z-10 mt-auto w-full shrink-0 px-[15px] pb-[15px]">
                {phase === "getStartedLoading" && (
                  <div className="relative z-40 mb-4 flex w-full justify-center">
                    <GetStartedTaskBar onStop={stopGetStarted} />
                  </div>
                )}
                {phase === "thinking" || phase === "getStartedLoading" ? (
                  <ComposerThinking />
                ) : (
                  <ComposerResponded />
                )}
              </div>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>

    {/* Task review modal — rendered outside the parent Dialog to avoid nested Radix dismiss conflicts */}
    {isGetStartedFlow && phase === "getStartedAnswer" && generatedTasks.length > 0 && (
      <CreateTaskModal
        open={taskReviewOpen}
        onOpenChange={setTaskReviewOpen}
        prefill={taskReviewPrefill}
        prefillKey={taskReviewIndex}
        headerTitle="Review Task"
        submitLabel="Close"
        carousel={{
          index: taskReviewIndex,
          total: generatedTasks.length,
          onPrev: () => setTaskReviewIndex((i) => Math.max(0, i - 1)),
          onNext: () =>
            setTaskReviewIndex((i) =>
              Math.min(generatedTasks.length - 1, i + 1),
            ),
        }}
      />
    )}
  </>
  );
}

function ComposerWelcome({
  draft,
  onDraftChange,
  onSubmit,
  disabled,
  placeholder,
  inputId = "welcome-ai-chat-input",
  attachments,
  onRemoveAttachment,
  fileInputRef,
  onAddFiles,
  uploadPending,
  attachmentsEnabled,
}: {
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  placeholder?: string;
  inputId?: string;
  attachments: WelcomeComposerAttachment[];
  onRemoveAttachment: (id: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onAddFiles: (files: File[]) => void;
  uploadPending: boolean;
  attachmentsEnabled: boolean;
}) {
  const canSend = Boolean(onSubmit && draft.trim() && !disabled);
  const placeholderText =
    placeholder ??
    (disabled ? "Open a project board to use AI..." : "Do anything with AI...");

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept="image/*,.txt,.md,.pdf,.doc,.docx"
        onChange={(e) => {
          onAddFiles(Array.from(e.target.files ?? []));
        }}
      />
      <div className="relative mb-[-11px] flex shrink-0 flex-col gap-2">
        {attachments.length > 0 && (
          <div
            className="flex flex-wrap gap-2"
            aria-label="Attachments for AI message"
          >
            {attachments.map((a) =>
              a.isImage && a.previewUrl ? (
                <span
                  key={a.id}
                  className="relative inline-flex overflow-hidden rounded-[8px] border border-solid border-[#ededed] bg-white shadow-sm"
                >
                  <img
                    src={a.previewUrl}
                    alt={a.fileContent.filename}
                    className="h-[72px] w-[72px] object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(a.id)}
                    className="absolute right-0.5 top-0.5 inline-flex size-6 items-center justify-center rounded-md bg-black/50 text-white hover:bg-black/70"
                    aria-label={`Remove image ${a.fileContent.filename}`}
                  >
                    <X className="size-3.5" strokeWidth={2} />
                  </button>
                </span>
              ) : (
                <span
                  key={a.id}
                  className="inline-flex max-w-full items-stretch overflow-hidden rounded-[8px] border border-solid border-[#ededed] bg-white shadow-sm"
                >
                  <span
                    className="flex w-9 shrink-0 items-center justify-center self-stretch bg-[#edf0f3]"
                    aria-hidden
                  >
                    <FileText
                      className="size-4 shrink-0 text-[#606d76]"
                      strokeWidth={1.75}
                    />
                  </span>
                  <span className="min-w-0 max-w-[180px] truncate border-l border-solid border-[#ededed] px-2.5 py-1.5 font-['Satoshi',sans-serif] text-[13px] font-medium leading-normal text-[#0b191f]">
                    {a.fileContent.filename}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(a.id)}
                    className="inline-flex shrink-0 items-center justify-center self-center pr-1.5 text-[#606d76] hover:text-[#0b191f]"
                    aria-label={`Remove ${a.fileContent.filename}`}
                  >
                    <X className="size-3.5" strokeWidth={2} />
                  </button>
                </span>
              ),
            )}
          </div>
        )}

        <div className="flex min-h-[88px] flex-col items-stretch gap-1 rounded-[14px] border border-solid border-[#edecea] bg-white pb-[7px] pt-[11px] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]">
          <div className="relative flex w-full min-h-0 items-start justify-center px-[13px]">
            <label className="sr-only" htmlFor={inputId}>
              Message
            </label>
            <TextareaAutosize
              id={inputId}
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              onPaste={(e) => {
                if (!attachmentsEnabled) return;
                const { files } = e.clipboardData;
                if (files?.length) {
                  e.preventDefault();
                  onAddFiles(Array.from(files));
                }
              }}
              onKeyDown={(e) => {
                if (!canSend) return;
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit?.();
                }
              }}
              placeholder={placeholderText}
              minRows={1}
              maxRows={9}
              disabled={disabled}
              className="w-full min-h-[40px] resize-none overflow-y-auto border-0 bg-transparent font-['Satoshi',sans-serif] text-[13px] font-medium not-italic leading-[1.35] tracking-[-0.13px] text-[#0b191f] opacity-50 placeholder:text-[#727d83] placeholder:opacity-50 focus:opacity-100 focus:outline-none focus:ring-0 disabled:opacity-40"
            />
          </div>
          <div className="relative flex w-full shrink-0 items-center justify-between px-[11px]">
            <div className="relative flex shrink-0 items-center gap-[7px]">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!attachmentsEnabled || uploadPending || disabled}
                className="relative inline-flex size-[18px] shrink-0 items-center justify-center overflow-clip p-0 disabled:opacity-50"
                aria-label="Attach file or image"
              >
                {uploadPending ? (
                  <Loader2
                    className="size-[18px] animate-spin text-[#727d83]"
                    aria-hidden
                  />
                ) : (
                  <span className="absolute inset-[20.83%] block">
                    <span className="absolute inset-[-4.76%] block">
                      <img
                        alt=""
                        className="block size-full max-w-none"
                        src={imgPlus}
                      />
                    </span>
                  </span>
                )}
              </button>
              <div className="relative size-[18px] shrink-0 overflow-clip">
                <div className="absolute inset-[16.67%]">
                  <div className="absolute inset-[-4.17%]">
                    <img alt="" className="block size-full max-w-none" src={imgSettings2} />
                  </div>
                </div>
              </div>
            </div>
            <div className="relative flex shrink-0 items-center gap-2.5">
              <p className="relative shrink-0 whitespace-nowrap font-['Satoshi',sans-serif] text-[13px] font-medium not-italic leading-[normal] tracking-[-0.13px] text-[#727d83]">
                Auto
              </p>
              <button
                type="button"
                disabled={!canSend}
                onClick={() => onSubmit?.()}
                aria-label="Send message"
                className={cn(
                  "relative flex size-[26px] shrink-0 items-center justify-center rounded-[999px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#2E96F9] focus-visible:ring-offset-2 disabled:pointer-events-none",
                  canSend
                    ? "cursor-pointer bg-[#2E96F9] text-white"
                    : "cursor-default bg-[#f9f9f8] text-[#727d83] opacity-40",
                )}
              >
                <ArrowUp className="size-[18px] shrink-0" strokeWidth={2} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** Figma 14:1031 SpinnerGradient — 16px (ring asset rotates) */
function SpinnerGradientThinking() {
  return (
    <div className="relative size-4 shrink-0 animate-[spin_0.85s_linear_infinite]" aria-hidden>
      <div className="absolute inset-[-8.33%]">
        <img alt="" className="block size-full max-w-none" src={imgSpinnerRing} />
      </div>
    </div>
  );
}

function ReportingAssistantPanel({
  reportingThread,
  reportingPending,
  draftMessage,
  setDraftMessage,
  sendReportingQuery,
  onStopReporting,
  attachments,
  onRemoveAttachment,
  fileInputRef,
  onAddFiles,
  uploadPending,
}: {
  reportingThread: ReportingMsg[];
  reportingPending: boolean;
  draftMessage: string;
  setDraftMessage: (v: string) => void;
  sendReportingQuery: (text: string) => void | Promise<void>;
  onStopReporting: () => void;
  attachments: WelcomeComposerAttachment[];
  onRemoveAttachment: (id: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onAddFiles: (files: File[]) => void;
  uploadPending: boolean;
}) {
  return (
    <div className="relative z-[5] flex min-h-0 w-full flex-1 flex-col">
      <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-x-clip overflow-y-auto bg-white px-[15px] pb-4 pt-12">
        <div className="flex w-full flex-col items-stretch justify-start gap-4">
          <div className="flex w-full items-start justify-center gap-2 whitespace-nowrap text-center font-['Inter',sans-serif] text-[11px] font-medium leading-[normal] text-[#727d83]">
            <p>Today</p>
            <p>Continuum AI</p>
          </div>
          {reportingThread.map((m) => (
            <Fragment key={m.id}>
              {m.role === "user" ? (
                <div className="flex w-full justify-end">
                  <div className="flex max-w-[min(100%,340px)] shrink-0 items-center justify-center rounded-[32px] bg-[#edf0f3] px-4 py-2">
                    <p className="max-w-full whitespace-pre-wrap break-words text-left font-['Satoshi',sans-serif] text-[13px] font-medium not-italic leading-[normal] text-[#0b191f]">
                      {m.content}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex w-full flex-col items-start gap-2 rounded-[16px]">
                  <div className="flex w-full items-center gap-1 opacity-50">
                    <div className="relative size-4 shrink-0">
                      <img alt="" className="absolute block size-full max-w-none" src={imgChevronRightThought} />
                    </div>
                    <p className="flex-1 font-['Inter',sans-serif] text-[13px] font-medium leading-[normal] text-[#151515]">
                      Thought
                    </p>
                  </div>
                  {m.isError ? (
                    <p className="w-full font-['Inter',sans-serif] text-[13px] font-normal leading-[19px] not-italic text-[#dc2626]">
                      {m.content}
                    </p>
                  ) : (
                    <PlannerAssistantMarkdown content={m.content} />
                  )}
                  {typeof m.confidence === "number" && m.confidence < 0.5 && !m.isError && (
                    <p className="w-full font-['Inter',sans-serif] text-[11px] font-normal leading-[normal] text-[#b45309]">
                      Lower confidence — verify against the project dashboard if needed.
                    </p>
                  )}
                </div>
              )}
            </Fragment>
          ))}
          {reportingPending && (
            <div className="flex w-full flex-col items-start gap-2 rounded-[16px]">
              <div className="flex w-full items-center gap-2 opacity-50">
                <SpinnerGradientThinking />
                <p className="flex-1 font-['Inter',sans-serif] text-[13px] font-medium leading-[normal] text-[#151515]">
                  Thinking...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="relative z-10 mt-auto w-full shrink-0 px-[15px] pb-[15px]">
        {reportingPending ? (
          <ComposerThinking onStop={onStopReporting} />
        ) : (
          <ComposerWelcome
            draft={draftMessage}
            onDraftChange={setDraftMessage}
            onSubmit={() => void sendReportingQuery(draftMessage)}
            placeholder="Ask a follow-up…"
            disabled={false}
            inputId="welcome-ai-chat-followup"
            attachments={attachments}
            onRemoveAttachment={onRemoveAttachment}
            fileInputRef={fileInputRef}
            onAddFiles={onAddFiles}
            uploadPending={uploadPending}
            attachmentsEnabled
          />
        )}
      </div>
    </div>
  );
}

function GetStartedTaskBar({ onStop }: { onStop: () => void }) {
  return (
    <div className="pointer-events-auto w-full max-w-[368px] shadow-[0px_12px_24px_rgba(11,25,31,0.12)]">
      <div className="flex items-center gap-2 rounded-[16px] bg-[#0b191f] py-2 pl-4 pr-2">
        <p className="min-w-0 flex-1 truncate font-['Satoshi',sans-serif] text-[14px] font-medium leading-[normal] text-white">
          Generating tasks...
        </p>
        <button
          type="button"
          onClick={onStop}
          className="flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-lg px-4 py-2 font-['Satoshi',sans-serif] text-[14px] font-bold leading-[normal] text-white outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-white"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgb(235, 67, 53) 0%, rgb(235, 67, 53) 100%)",
          }}
        >
          Stop
        </button>
      </div>
    </div>
  );
}

/** Figma 14:3531 — caret + stop control */
function ComposerThinking({ onStop }: { onStop?: () => void }) {
  return (
    <div>
      <div className="flex h-[88px] shrink-0 flex-col items-start justify-between rounded-[14px] border border-solid border-[#edecea] bg-white pb-[7px] pt-[11px] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]">
        <div className="relative flex w-full shrink-0 items-center px-[13px]">
          <p className="min-h-0 flex-1 font-['Satoshi',sans-serif] text-[13px] font-medium not-italic leading-[normal] tracking-[-0.13px] text-[#727d83] opacity-50">
            Do anything with AI...
          </p>
        </div>
        <div className="relative flex w-full shrink-0 items-center justify-between px-[11px]">
          <div className="flex shrink-0 items-center gap-[7px]">
            <div className="relative size-[18px] shrink-0 overflow-clip">
              <div className="absolute inset-[20.83%]">
                <div className="absolute inset-[-4.76%]">
                  <img alt="" className="block size-full max-w-none" src={imgPlusChat} />
                </div>
              </div>
            </div>
            <div className="relative size-[18px] shrink-0 overflow-clip">
              <div className="absolute inset-[16.67%]">
                <div className="absolute inset-[-4.17%]">
                  <img alt="" className="block size-full max-w-none" src={imgSettingsChat} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <p className="shrink-0 whitespace-nowrap font-['Satoshi',sans-serif] text-[13px] font-medium not-italic leading-[normal] tracking-[-0.13px] text-[#727d83]">
              Auto
            </p>
            <button
              type="button"
              onClick={onStop}
              className="flex size-[26px] shrink-0 cursor-pointer items-center justify-center overflow-clip rounded-[999px] bg-[#e7f2fc] disabled:cursor-default disabled:opacity-50"
              aria-label="Stop generating"
              disabled={!onStop}
            >
              <div className="relative size-3 shrink-0">
                <img alt="" className="absolute block size-full max-w-none" src={imgLucideSquare} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Figma 14:3595 — caret + idle send */
function ComposerResponded() {
  return (
    <div>
      <div className="flex h-[88px] shrink-0 flex-col items-start justify-between rounded-[14px] border border-solid border-[#edecea] bg-white pb-[7px] pt-[11px] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]">
        <div className="relative flex w-full shrink-0 items-center gap-2.5 px-[13px]">
          <div className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-[13px] h-5 w-px rounded-[999px] bg-[#1466ff]" aria-hidden />
          <p className="min-h-0 flex-1 pl-2 font-['Satoshi',sans-serif] text-[13px] font-medium not-italic leading-[normal] tracking-[-0.13px] text-[#727d83] opacity-50">
            Do anything with AI...
          </p>
        </div>
        <div className="relative flex w-full shrink-0 items-center justify-between px-[11px]">
          <div className="flex shrink-0 items-center gap-[7px]">
            <div className="relative size-[18px] shrink-0 overflow-clip">
              <div className="absolute inset-[20.83%]">
                <div className="absolute inset-[-4.76%]">
                  <img alt="" className="block size-full max-w-none" src={imgPlusChat} />
                </div>
              </div>
            </div>
            <div className="relative size-[18px] shrink-0 overflow-clip">
              <div className="absolute inset-[16.67%]">
                <div className="absolute inset-[-4.17%]">
                  <img alt="" className="block size-full max-w-none" src={imgSettingsChat} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <p className="shrink-0 whitespace-nowrap font-['Satoshi',sans-serif] text-[13px] font-medium not-italic leading-[normal] tracking-[-0.13px] text-[#727d83]">
              Auto
            </p>
            <div className="flex size-[26px] shrink-0 items-center justify-center rounded-[999px] bg-[#f9f9f8]">
              <div className="relative size-[18px] shrink-0 overflow-clip opacity-20">
                <div className="absolute inset-[20.83%]">
                  <div className="absolute inset-[-3.57%]">
                    <img alt="" className="block size-full max-w-none" src={imgArrowUpChat} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
