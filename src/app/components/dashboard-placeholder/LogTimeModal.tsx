"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";

import { Dialog, DialogClose, DialogOverlay, DialogPortal } from "../ui/dialog";
import { cn } from "../ui/utils";

/** Figma playground node 25:10140 */
const imgLucideArrowLeft =
  "https://www.figma.com/api/mcp/asset/2117706d-83d3-4c1d-9e0b-71c1454e8c99";
const imgLucideChevronDown =
  "https://www.figma.com/api/mcp/asset/8faeee75-ddf6-4f27-b584-6f1616dedbea";
const imgLucideCalendar =
  "https://www.figma.com/api/mcp/asset/f1ef5ba5-3c1f-41b1-bab1-b7a4e0d4e160";
const imgLucideBot =
  "https://www.figma.com/api/mcp/asset/45ca08ef-a09e-466c-a13b-102083214a38";
const imgLucidePlus =
  "https://www.figma.com/api/mcp/asset/aac47b62-2c74-4f4f-8d02-d409018b8e1c";

const DESC_MAX = 100;

const placeholderDescription =
  "A long description goes here, this space will only show two lines before truncation.";

const AI_SUGGESTED_DESCRIPTION =
  "Focused on component specs and edge cases for the checkout flow. Synced with design on spacing tokens.";

type LogTimeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LogTimeModal({ open, onOpenChange }: LogTimeModalProps) {
  const [task, setTask] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setTask("");
    setDescription("");
  }, [open]);

  const descLen = description.length;

  const handleWriteWithAI = () => {
    setDescription(AI_SUGGESTED_DESCRIPTION.slice(0, DESC_MAX));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 flex max-h-[min(90vh,720px)] w-[calc(100%-2rem)] max-w-[600px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Log Time</DialogPrimitive.Title>

          {/* Header — Figma I25:10140;2488:110918 */}
          <div className="relative z-[3] flex w-full shrink-0 items-center justify-between border-b border-solid border-[#f5f5f5] bg-[#f9f9f9] px-9 py-4">
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
                aria-label="Back"
              >
                <span className="relative block size-5">
                  <img alt="" className="block size-full max-w-none" src={imgLucideArrowLeft} />
                </span>
              </button>
            </DialogClose>
            <div className="pointer-events-none absolute left-1/2 top-[25px] flex -translate-x-1/2 flex-col items-center gap-3">
              <p className="text-center font-['Satoshi',sans-serif] text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
                Log Time
              </p>
            </div>
            <div className="size-[27px] shrink-0 opacity-0" aria-hidden>
              <span className="relative block size-4" />
            </div>
          </div>

          <div
            className="z-[2] flex w-full flex-col gap-6 px-9 py-6"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(90deg, rgb(249, 249, 249) 0%, rgb(249, 249, 249) 100%)",
            }}
          >
            <div className="flex w-full flex-col gap-6">
              {/* Task + date/time — Figma I25:10140;2488:110958 */}
              <div className="flex w-full flex-col gap-4">
                <div className="flex w-full flex-col gap-1">
                  <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76]">Task</p>
                  <div className="relative w-full">
                    <select
                      value={task}
                      onChange={(e) => setTask(e.target.value)}
                      className={cn(
                        "h-10 w-full cursor-pointer appearance-none rounded-[8px] border border-solid border-[#e9e9e9] bg-white px-4 py-2 pr-10 font-['Satoshi',sans-serif] text-[16px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#2798f5]/40",
                        task ? "text-[#0b191f]" : "text-[#9fa5a8]",
                      )}
                      aria-label="Task"
                    >
                      <option value="">Selecting a task</option>
                      <option value="task1">Design system audit</option>
                      <option value="task2">API integration</option>
                      <option value="task3">QA pass</option>
                    </select>
                    <div className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2" aria-hidden>
                      <img alt="" className="absolute block size-full max-w-none" src={imgLucideChevronDown} />
                    </div>
                  </div>
                </div>

                <div className="flex w-full gap-4">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76]">Date Range</p>
                    <div className="relative w-full">
                      <input
                        type="text"
                        readOnly
                        placeholder="Start Date-End Date"
                        className="h-10 w-full cursor-default rounded-[8px] border border-solid border-[#e9e9e9] bg-white px-4 py-2 pr-10 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] placeholder:text-[#9fa5a8] outline-none focus-visible:ring-2 focus-visible:ring-[#2798f5]/40"
                        aria-label="Date range"
                      />
                      <div className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2" aria-hidden>
                        <img alt="" className="absolute block size-full max-w-none" src={imgLucideCalendar} />
                      </div>
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76]">Time Range</p>
                    <input
                      type="text"
                      readOnly
                      placeholder="Start Time-End Time"
                      className="h-10 w-full cursor-default rounded-[8px] border border-solid border-[#e9e9e9] bg-white px-4 py-2 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] placeholder:text-[#9fa5a8] outline-none focus-visible:ring-2 focus-visible:ring-[#2798f5]/40"
                      aria-label="Time range"
                    />
                  </div>
                </div>
              </div>

              {/* Description + Write with AI — Figma I25:10140;2488:110979 */}
              <div className="flex w-full flex-col justify-center gap-1">
                <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76]">Description</p>
                <div className="flex h-[106px] w-full flex-col justify-between rounded-[8px] border border-solid border-[#e9e9e9] bg-white px-4 pb-2 pt-4">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))}
                    placeholder={placeholderDescription}
                    maxLength={DESC_MAX}
                    rows={2}
                    className="min-h-0 w-full resize-none border-0 bg-transparent font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none placeholder:text-[#9fa5a8] focus:ring-0"
                    aria-label="Description"
                  />
                  <div className="flex w-full items-center justify-end gap-2.5">
                    <p className="shrink-0 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76] opacity-[0.32]">
                      {descLen}/{DESC_MAX} Characters
                    </p>
                    <button
                      type="button"
                      onClick={handleWriteWithAI}
                      className="inline-flex h-[19px] shrink-0 cursor-pointer items-center justify-center gap-1 rounded-[4px] border border-solid border-[#2798f5] bg-white px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[#2798f5]/40"
                      aria-label="Write with AI"
                    >
                      <span className="relative block size-[14px] shrink-0">
                        <img alt="" className="absolute block size-full max-w-none" src={imgLucideBot} />
                      </span>
                      <span className="font-['Satoshi',sans-serif] text-[11px] font-medium whitespace-nowrap text-[#2798f5]">
                        Write with AI
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer CTA — Figma I25:10140;2488:110985 */}
            <div className="flex w-full items-center justify-end">
              <div className="w-[119px] shrink-0">
                <button
                  type="button"
                  disabled
                  className="inline-flex h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-[8px] border-0 bg-[rgba(96,109,118,0.1)] px-4 py-2 outline-none"
                  aria-disabled="true"
                >
                  <span className="relative block size-4 shrink-0">
                    <img alt="" className="absolute block size-full max-w-none" src={imgLucidePlus} />
                  </span>
                  <span className="font-['Inter',sans-serif] text-[14px] font-semibold text-[#606d76] opacity-50">
                    Log Time
                  </span>
                </button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
