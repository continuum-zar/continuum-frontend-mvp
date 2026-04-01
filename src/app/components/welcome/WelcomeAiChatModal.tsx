"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Minus } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Dialog,
  DialogOverlay,
  DialogPortal,
} from "../ui/dialog";
import { cn } from "../ui/utils";

/** Figma — base panel 14:3223 / welcome mock 14:3453, 395×537 */
const imgChevronDown = "https://www.figma.com/api/mcp/asset/efd29821-4b68-45a8-a943-000591716212";
const imgSquarePen = "https://www.figma.com/api/mcp/asset/8b659cef-3407-4a90-9a3b-040a80e97dd7";
const imgMinus = "https://www.figma.com/api/mcp/asset/398b8c9e-4389-4bf0-b963-a0ba27edd9e9";
const imgBot = "https://www.figma.com/api/mcp/asset/39d27ae7-19c5-4d7d-b5fa-d32575b9f513";
const imgPlus = "https://www.figma.com/api/mcp/asset/0d0492e3-ad36-48a3-8f2a-a9ea51d299e4";
const imgSettings2 = "https://www.figma.com/api/mcp/asset/dce388b9-22f0-4c35-976b-ca6706b88382";
const imgArrowUp = "https://www.figma.com/api/mcp/asset/8c3394f6-bebe-4165-b825-14fc9ab0b1d1";

/** Figma — active chat 14:3531 / 14:3595 */
const imgSquarePenChat = "https://www.figma.com/api/mcp/asset/79fbaac6-1ad4-4409-9061-0ae19953dbea";
const imgEllipsis = "https://www.figma.com/api/mcp/asset/8a1cc0a4-ebd0-4e5d-b345-dccb8e9fd5b1";
const imgChevronDownChat = "https://www.figma.com/api/mcp/asset/01a53fe2-c907-40d9-bed5-3d02e00d882e";
const imgLucideSquare = "https://www.figma.com/api/mcp/asset/e40fa00b-dbb1-4554-9a43-c7e4cbe8cb5c";
const imgChevronRightThought = "https://www.figma.com/api/mcp/asset/ab00dcdd-398d-4dfc-b3f7-4fc77a4515a3";
const imgPlusChat = "https://www.figma.com/api/mcp/asset/5f40ebe2-bfb1-49bf-b797-367653d10f56";
const imgSettingsChat = "https://www.figma.com/api/mcp/asset/41a9a4e3-6a20-4694-9477-56c0c6ed916b";
const imgArrowUpChat = "https://www.figma.com/api/mcp/asset/ff641961-e4ca-488f-aa65-39498a45ed47";

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

type ChatPhase = "welcome" | "thinking" | "responded";

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
};

export function WelcomeAiChatModal({ open, onOpenChange }: WelcomeAiChatModalProps) {
  const [phase, setPhase] = useState<ChatPhase>("welcome");
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPhase("welcome");
      setSelectedPrompt(null);
    }
  }, [open]);

  useEffect(() => {
    if (phase !== "thinking") return;
    const t = window.setTimeout(() => setPhase("responded"), THINKING_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  const startPrompt = (text: string) => {
    setSelectedPrompt(text);
    setPhase("thinking");
  };

  const isChat = phase !== "welcome";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "isolate data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-2 data-[state=open]:slide-in-from-bottom-2 fixed z-50 flex flex-col items-start overflow-clip rounded-[19px] border border-solid border-[#edecea] bg-white shadow-[0px_86px_24px_0px_rgba(11,25,31,0),0px_55px_22px_0px_rgba(11,25,31,0.01),0px_31px_19px_0px_rgba(11,25,31,0.03),0px_14px_14px_0px_rgba(11,25,31,0.04),0px_3px_8px_0px_rgba(11,25,31,0.05)] duration-200",
            "bottom-6 right-6 top-auto left-auto max-h-[min(537px,calc(100vh-32px))] w-[min(395px,calc(100vw-32px))] max-w-[395px] translate-x-0 translate-y-0",
            "h-[537px] outline-none",
          )}
          data-node-id="14:3223"
        >
          <DialogPrimitive.Title className="sr-only">AI assistant</DialogPrimitive.Title>

          {/* Header — welcome: 14:3453; active: 14:3531 / 14:3595 */}
          <div
            className={cn(
              "relative z-[2] flex w-full shrink-0 items-center justify-between bg-white",
              isChat ? "px-[15px] pb-0 pt-[15px]" : "py-2 pl-2 pr-4",
            )}
          >
            <div className="relative flex min-w-0 shrink items-center gap-1.5 rounded-[40px] py-1 pr-2 pl-2">
              <p
                className={cn(
                  "relative min-w-0 shrink truncate font-['Satoshi',sans-serif] text-[13px] font-medium not-italic leading-[normal]",
                  isChat ? "text-[#727d83]" : "text-[#151515]",
                )}
              >
                {isChat ? selectedPrompt : "New AI chat"}
              </p>
              {isChat ? (
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
              {isChat && (
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
                    <ComposerWelcome />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="relative z-[1] flex min-h-0 w-full flex-1 flex-col">
              <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-x-clip overflow-y-auto px-[15px] pb-4 pt-12">
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
                  </div>
                </div>
              </div>
              {phase === "thinking" ? <ComposerThinking /> : <ComposerResponded />}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

function ComposerWelcome() {
  return (
    <div className="relative mb-[-11px] flex h-[88px] shrink-0 flex-col items-start justify-between rounded-[14px] border border-solid border-[#edecea] bg-white pb-[7px] pt-[11px] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]">
      <div className="relative flex w-full shrink-0 items-center justify-center px-[13px]">
        <label className="sr-only" htmlFor="welcome-ai-chat-input">
          Message
        </label>
        <textarea
          id="welcome-ai-chat-input"
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
          <div className="relative flex size-[26px] shrink-0 items-center justify-center rounded-[999px] bg-[#f9f9f8]">
            <div className="relative size-[18px] shrink-0 overflow-clip opacity-20">
              <div className="absolute inset-[20.83%]">
                <div className="absolute inset-[-9.52%]">
                  <img alt="" className="block size-full max-w-none" src={imgArrowUp} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Figma 14:3531 — caret + stop control */
function ComposerThinking() {
  return (
    <div className="mt-auto shrink-0 px-[15px] pb-[15px]">
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
    <div className="mt-auto shrink-0 px-[15px] pb-[15px]">
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
