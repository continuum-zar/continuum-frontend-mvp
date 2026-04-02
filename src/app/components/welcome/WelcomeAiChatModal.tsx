"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowUp, Check, Minus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
} from "../ui/dialog";
import { cn } from "../ui/utils";
import {
  CreateTaskModal,
  type CreateTaskModalPrefill,
} from "../CreateTaskModal";

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

/** Figma 16:18149 / 15:3934 — get started answer */
const MOCK_GET_STARTED_SUMMARY = "I created 7 tickets under UX Strategy.";

/** Same shape as CreateTaskModal prefill — duplicated for carousel QA */
type GetStartedTaskRow = CreateTaskModalPrefill & { id: string };

const GET_STARTED_TASK_SEEDS: GetStartedTaskRow[] = [
  {
    id: "t1",
    title: "Bug Fix Request for User Interface",
    description:
      "A long description goes here, this space will only show two lines before truncation.",
    descriptionMeta: "85/100 Characters",
    checklist: [
      { id: "t1a", text: "Verify all UI elements render correctly", done: false },
      { id: "t1b", text: "Confirm data is displayed accurately", done: false },
      { id: "t1c", text: "Validate input fields accept correct data", done: true },
    ],
  },
  {
    id: "t2",
    title: "Feature Request for Dark Mode",
    description:
      "A long description goes here, this space will only show two lines before truncation.",
    descriptionMeta: "72/100 Characters",
    checklist: [
      { id: "t2a", text: "Audit color tokens for dark palette", done: false },
      { id: "t2b", text: "Ensure smooth transitions between views", done: false },
      { id: "t2c", text: "Test responsiveness on different devices", done: true },
    ],
  },
  {
    id: "t3",
    title: "Accessibility audit for onboarding flow",
    description:
      "A long description goes here, this space will only show two lines before truncation.",
    descriptionMeta: "91/100 Characters",
    checklist: [
      { id: "t3a", text: "Check focus order and keyboard paths", done: false },
      { id: "t3b", text: "Validate screen reader labels", done: false },
      { id: "t3c", text: "Check for console errors or warnings", done: true },
    ],
  },
];

const GET_STARTED_PREFILLED_TASKS: GetStartedTaskRow[] = [
  ...GET_STARTED_TASK_SEEDS,
  ...GET_STARTED_TASK_SEEDS.map((t) => ({
    ...t,
    id: `${t.id}-dup`,
    title: `${t.title} (duplicate)`,
    checklist: t.checklist?.map((c) => ({ ...c, id: `${c.id}-dup` })),
  })),
];

const THINKING_MS = 1600;
const GET_STARTED_CONNECTING_MS = 2200;
const GET_STARTED_CREATING_MS = 2200;

type ChatPhase = "welcome" | "thinking" | "responded" | "getStartedLoading" | "getStartedAnswer";

type LoadingSubphase = "connecting" | "creating";

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
};

export function WelcomeAiChatModal({ open, onOpenChange, showQuickActions = true }: WelcomeAiChatModalProps) {
  const [phase, setPhase] = useState<ChatPhase>("welcome");
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [loadingSubphase, setLoadingSubphase] = useState<LoadingSubphase>("connecting");
  const [draftMessage, setDraftMessage] = useState("");
  const [showTicketToast, setShowTicketToast] = useState(false);
  const [taskReviewOpen, setTaskReviewOpen] = useState(false);
  const [taskReviewIndex, setTaskReviewIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setPhase("welcome");
      setSelectedPrompt(null);
      setLoadingSubphase("connecting");
      setDraftMessage("");
      setShowTicketToast(false);
      setTaskReviewOpen(false);
      setTaskReviewIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (phase !== "thinking" || !showQuickActions) return;
    const t = window.setTimeout(() => setPhase("responded"), THINKING_MS);
    return () => window.clearTimeout(t);
  }, [phase, showQuickActions]);

  useEffect(() => {
    if (phase !== "getStartedLoading") return;
    if (loadingSubphase === "connecting") {
      const t = window.setTimeout(() => setLoadingSubphase("creating"), GET_STARTED_CONNECTING_MS);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setPhase("getStartedAnswer"), GET_STARTED_CREATING_MS);
    return () => window.clearTimeout(t);
  }, [phase, loadingSubphase]);

  useEffect(() => {
    if (phase !== "getStartedAnswer" || showQuickActions) return;
    const show = window.setTimeout(() => setShowTicketToast(true), 600);
    const hide = window.setTimeout(() => setShowTicketToast(false), 5600);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [phase, showQuickActions]);

  const startPrompt = (text: string) => {
    setSelectedPrompt(text);
    setPhase("thinking");
  };

  const submitGetStartedPrompt = () => {
    const text = draftMessage.trim();
    if (!text) return;
    setSelectedPrompt(text);
    setDraftMessage("");
    setLoadingSubphase("connecting");
    setPhase("getStartedLoading");
  };

  const stopGetStarted = () => {
    setPhase("welcome");
    setSelectedPrompt(null);
    setLoadingSubphase("connecting");
    setShowTicketToast(false);
  };

  const isChat = phase !== "welcome";
  const isGetStartedFlow = !showQuickActions;
  const usePromptInHeader = showQuickActions && isChat && (phase === "thinking" || phase === "responded");
  const showHeaderEllipsis = showQuickActions && (phase === "thinking" || phase === "responded");

  const taskReviewPrefill = useMemo((): CreateTaskModalPrefill | undefined => {
    const row = GET_STARTED_PREFILLED_TASKS[taskReviewIndex];
    if (!row) return undefined;
    return {
      title: row.title,
      description: row.description,
      descriptionMeta: row.descriptionMeta,
      checklist: row.checklist,
    };
  }, [taskReviewIndex]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "isolate data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-2 data-[state=open]:slide-in-from-bottom-2 fixed z-50 flex flex-col items-start overflow-hidden rounded-[19px] border border-solid border-[#edecea] bg-white shadow-[0px_86px_24px_0px_rgba(11,25,31,0),0px_55px_22px_0px_rgba(11,25,31,0.01),0px_31px_19px_0px_rgba(11,25,31,0.03),0px_14px_14px_0px_rgba(11,25,31,0.04),0px_3px_8px_0px_rgba(11,25,31,0.05)] duration-200",
            "bottom-6 right-6 top-auto left-auto max-h-[min(537px,calc(100vh-32px))] w-[min(395px,calc(100vw-32px))] max-w-[395px] translate-x-0 translate-y-0",
            "h-[537px] outline-none",
          )}
          data-node-id="14:3223"
        >
          <DialogPrimitive.Title className="sr-only">AI assistant</DialogPrimitive.Title>

          {/* Header — welcome: 14:3453; active: 14:3531 / 14:3595 */}
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
                {usePromptInHeader ? selectedPrompt : "New AI chat"}
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
                            className="border-0 bg-transparent p-0 font-['Inter',sans-serif] text-[11px] font-medium not-italic leading-normal text-[#2E96F9]"
                          >
                            Learn more
                          </button>
                        </p>
                      </div>
                    </div>
                    <ComposerWelcome
                      draft={draftMessage}
                      onDraftChange={setDraftMessage}
                      onSubmitGetStarted={isGetStartedFlow ? submitGetStartedPrompt : undefined}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="relative z-[5] flex min-h-0 w-full flex-1 flex-col">
              <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-x-clip overflow-y-auto bg-white px-[15px] pb-4 pt-12">
                <div className="flex w-full flex-col items-end justify-center gap-4">
                  <div className="flex w-full items-start justify-center gap-2 whitespace-nowrap text-center font-['Inter',sans-serif] text-[11px] font-medium leading-[normal] text-[#727d83]">
                    <p>Tuesday, Jan 27</p>
                    <p>Continuum AI</p>
                  </div>
                  <div className="flex h-8 shrink-0 items-center justify-center rounded-[32px] bg-[#edf0f3] px-4 py-2">
                    <p className="whitespace-nowrap font-['Satoshi',sans-serif] text-[13px] font-medium not-italic leading-[normal] text-[#0b191f]">
                      {selectedPrompt}
                    </p>
                  </div>
                  <div className="w-full">
                    {phase === "thinking" && (
                      <div className="flex w-full flex-col items-end rounded-[16px]">
                        <div className="flex w-full flex-col items-end gap-5">
                          <div className="flex w-full flex-col items-start gap-2">
                            <div className="flex w-full items-center gap-2 opacity-50">
                              <div
                                className="size-5 shrink-0 rounded-full border-2 border-[#2E96F9] border-t-transparent animate-spin"
                                aria-hidden
                              />
                              <p className="flex-1 font-['Inter',sans-serif] text-[13px] font-medium leading-[normal] text-[#151515]">
                                Thinking...
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {phase === "getStartedLoading" && (
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
                            <p className="w-full font-['Inter',sans-serif] text-[13px] font-normal leading-[19px] not-italic text-[#0b191f]">
                              {MOCK_AI_BODY}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
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
                            <p className="w-full font-['Inter',sans-serif] text-[13px] font-normal leading-[19px] not-italic text-[#0b191f]">
                              {MOCK_GET_STARTED_SUMMARY}
                            </p>
                            <div className="mt-1 w-full rounded-[12px] border border-solid border-[#ededed] bg-white p-3">
                              <ul className="flex flex-col gap-1">
                                {GET_STARTED_PREFILLED_TASKS.map((task, i) => (
                                  <li key={task.id} className="list-none">
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
                    <GetStartedTaskBar loadingSubphase={loadingSubphase} onStop={stopGetStarted} />
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
        {showTicketToast && isGetStartedFlow && (
          <div
            className="animate-in fade-in slide-in-from-bottom-4 fixed bottom-8 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-start rounded-[8px] bg-[#0b191f] py-2 shadow-[0px_26px_7px_0px_rgba(21,21,21,0),0px_16px_7px_0px_rgba(21,21,21,0),0px_9px_6px_0px_rgba(21,21,21,0.01),0px_4px_4px_0px_rgba(21,21,21,0.02),0px_1px_2px_0px_rgba(21,21,21,0.03)] duration-300"
            role="status"
            data-node-id="15:3937"
          >
            <div className="flex items-center gap-3 px-4 py-1">
              <div className="relative size-4 shrink-0 rounded-[666px] bg-[#1ed760]">
                <Check className="absolute left-[2.5px] top-[2.5px] size-2.5 text-white" strokeWidth={3} aria-hidden />
              </div>
              <p className="font-['Inter',sans-serif] text-[16px] font-medium not-italic leading-[normal] whitespace-nowrap text-white">
                Created 7 tickets
              </p>
            </div>
          </div>
        )}
        {isGetStartedFlow && phase === "getStartedAnswer" && (
          <CreateTaskModal
            open={taskReviewOpen}
            onOpenChange={setTaskReviewOpen}
            prefill={taskReviewPrefill}
            prefillKey={taskReviewIndex}
            headerTitle="Create Task"
            submitLabel="Update Task"
            carousel={{
              index: taskReviewIndex,
              total: GET_STARTED_PREFILLED_TASKS.length,
              onPrev: () => setTaskReviewIndex((i) => Math.max(0, i - 1)),
              onNext: () =>
                setTaskReviewIndex((i) =>
                  Math.min(GET_STARTED_PREFILLED_TASKS.length - 1, i + 1),
                ),
            }}
          />
        )}
      </DialogPortal>
    </Dialog>
  );
}

function ComposerWelcome({
  draft,
  onDraftChange,
  onSubmitGetStarted,
}: {
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmitGetStarted?: () => void;
}) {
  const canSend = Boolean(onSubmitGetStarted && draft.trim());

  return (
    <div className="relative mb-[-11px] flex h-[88px] shrink-0 flex-col items-start justify-between rounded-[14px] border border-solid border-[#edecea] bg-white pb-[7px] pt-[11px] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]">
      <div className="relative flex w-full shrink-0 items-center justify-center px-[13px]">
        <label className="sr-only" htmlFor="welcome-ai-chat-input">
          Message
        </label>
        <textarea
          id="welcome-ai-chat-input"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (!onSubmitGetStarted) return;
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmitGetStarted();
            }
          }}
          placeholder="Do anything with AI..."
          rows={1}
          className="min-h-0 w-full flex-1 resize-none border-0 bg-transparent font-['Satoshi',sans-serif] text-[13px] font-medium not-italic leading-[normal] tracking-[-0.13px] text-[#0b191f] opacity-50 placeholder:text-[#727d83] placeholder:opacity-50 focus:opacity-100 focus:outline-none focus:ring-0"
        />
      </div>
      <div className="relative flex w-full shrink-0 items-center justify-between px-[11px]">
        <div className="relative flex shrink-0 items-center gap-[7px]">
          <div className="relative size-[18px] shrink-0 overflow-clip">
            <div className="absolute inset-[20.83%]">
              <div className="absolute inset-[-4.76%]">
                <img alt="" className="block size-full max-w-none" src={imgPlus} />
              </div>
            </div>
          </div>
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
            onClick={() => onSubmitGetStarted?.()}
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

function GetStartedTaskBar({
  loadingSubphase,
  onStop,
}: {
  loadingSubphase: LoadingSubphase;
  onStop: () => void;
}) {
  const label = loadingSubphase === "connecting" ? "Connecting to repository..." : "Creating ticket...";
  return (
    <div className="pointer-events-auto w-full max-w-[368px] shadow-[0px_12px_24px_rgba(11,25,31,0.12)]">
      <div className="flex items-center gap-2 rounded-[16px] bg-[#0b191f] py-2 pl-4 pr-2">
        <p className="min-w-0 flex-1 truncate font-['Satoshi',sans-serif] text-[14px] font-medium leading-[normal] text-white">
          {label}
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
function ComposerThinking() {
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
              className="flex size-[26px] shrink-0 items-center justify-center overflow-clip rounded-[999px] bg-[#e7f2fc]"
              aria-label="Stop generating"
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
