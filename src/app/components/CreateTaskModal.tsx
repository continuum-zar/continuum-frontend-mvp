"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, FileText, Link2, Plus, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
} from "./ui/dialog";
import { cn } from "./ui/utils";
import { AddResourceModal } from "./welcome/AddResourceModal";
import { welcomeResourcesMock, type WelcomeResourceItem } from "@/app/data/welcomeDashboardMock";

const imgLucideArrowLeft =
  "https://www.figma.com/api/mcp/asset/27ca96dc-a695-48d3-8f22-628b8eb437bd";
const imgLucideFlag =
  "https://www.figma.com/api/mcp/asset/e52cc33b-1c94-4f51-831d-27613aec8fb7";
const imgVector15 =
  "https://www.figma.com/api/mcp/asset/ed075df4-e80e-41eb-a544-5369dfb77a46";
const imgLucideTag =
  "https://www.figma.com/api/mcp/asset/d427a1f8-33d2-4b4d-a88d-0d6788ed82e6";
const imgLucideCheck =
  "https://www.figma.com/api/mcp/asset/f17b7c55-8260-41c2-9b91-6892f419b0f9";
const imgLucideCalendarPlus =
  "https://www.figma.com/api/mcp/asset/425b9c90-6c91-4ee0-a3d7-1a5b0f599a35";
const imgLucideUserRoundPlus1 =
  "https://www.figma.com/api/mcp/asset/3b9ddb70-8dce-456b-9932-8b226f04049a";
const imgLucideCheck1 =
  "https://www.figma.com/api/mcp/asset/023443fc-c32a-461b-8dbd-55d6e32cd451";
const imgComponent34 =
  "https://www.figma.com/api/mcp/asset/0a33d0b2-07cc-4490-b6ee-909fecb0efb5";
type CreateTaskModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ChecklistRow = { id: string; text: string; done: boolean };

export function CreateTaskModal({ open, onOpenChange }: CreateTaskModalProps) {
  const [checklistItems, setChecklistItems] = useState<ChecklistRow[]>([]);
  const [addResourceOpen, setAddResourceOpen] = useState(false);

  const addChecklistRow = useCallback(() => {
    setChecklistItems((prev) => [...prev, { id: crypto.randomUUID(), text: "", done: false }]);
  }, []);

  const updateChecklistText = useCallback((id: string, text: string) => {
    setChecklistItems((prev) => prev.map((r) => (r.id === id ? { ...r, text } : r)));
  }, []);

  const toggleChecklist = useCallback((id: string) => {
    setChecklistItems((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (!r.done && !r.text.trim()) return r;
        return { ...r, done: !r.done };
      }),
    );
  }, []);

  const removeChecklistIfEmpty = useCallback((id: string) => {
    setChecklistItems((prev) => prev.filter((r) => !(r.id === id && !r.text.trim())));
  }, []);

  useEffect(() => {
    if (!open) setChecklistItems([]);
  }, [open]);

  const renderResourceRow = (item: WelcomeResourceItem) => {
    if (item.kind === "link") {
      return (
        <div key={item.id} className="flex w-full items-center gap-2">
          <div className="flex min-h-[34px] min-w-0 flex-1 items-stretch overflow-hidden rounded-[8px] border border-solid border-[#ededed] pr-2">
            <div className="flex w-[50px] shrink-0 items-center justify-center self-stretch bg-[#edf0f3]">
              <Link2 className="size-4 text-[#606d76]" strokeWidth={1.75} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center border-l border-solid border-[#ededed] px-4 py-1.5">
              <p className="break-words font-['Satoshi',sans-serif] text-[16px] font-medium leading-normal text-[#0b191f]">
                {item.url}
              </p>
            </div>
          </div>
          <button type="button" className="inline-flex shrink-0 text-[#606d76]" aria-label="Remove resource">
            <X className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      );
    }

    return (
      <div key={item.id} className="flex w-full items-center gap-2">
        <div className="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-[8px] border border-solid border-[#ededed] pr-2">
          <div className="flex w-[50px] shrink-0 items-center justify-center self-stretch bg-[#edf0f3]">
            <FileText className="size-4 text-[#606d76]" strokeWidth={1.75} />
          </div>
          <div className="flex min-h-[50px] min-w-0 flex-1 flex-col justify-center border-l border-solid border-[#ededed] px-4 py-1.5">
            <p className="break-words font-['Satoshi',sans-serif] text-[16px] font-medium leading-normal text-[#0b191f]">
              {item.name}
            </p>
            <p className="font-['Satoshi',sans-serif] text-[12px] font-medium leading-normal text-[#727d83]">
              {item.sizeLabel}
            </p>
          </div>
        </div>
        <button type="button" className="inline-flex shrink-0 text-[#606d76]" aria-label="Remove resource">
          <X className="size-4" strokeWidth={1.75} />
        </button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AddResourceModal open={addResourceOpen} onOpenChange={setAddResourceOpen} />
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 flex max-h-[min(886px,90vh)] w-[calc(100%-2rem)] max-w-[600px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Create Task</DialogPrimitive.Title>

          <div className="z-[3] flex w-full shrink-0 items-center justify-between border-b border-solid border-[#f5f5f5] bg-[#f9f9f9] px-9 py-4">
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
                Create Task
              </p>
            </div>
            <button
              type="button"
              className="inline-flex size-[27px] shrink-0 items-center justify-center rounded-md border-0 bg-transparent p-0"
              aria-label="Flag task"
            >
              <span className="relative block size-4">
                <img alt="" className="absolute block size-full max-w-none" src={imgLucideFlag} />
              </span>
            </button>
          </div>

          <div
            className="z-[2] min-h-0 flex-1 overflow-x-clip overflow-y-auto px-9 py-6"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(90deg, rgb(249, 249, 249) 0%, rgb(249, 249, 249) 100%)",
            }}
          >
            <div className="flex w-full flex-col gap-6 pb-6">
              <div className="flex w-full items-center bg-white py-2">
                <p className="min-w-0 flex-1 font-['Satoshi',sans-serif] text-[24px] font-medium text-[#0b191f]">
                  Set up high-fidelity prototypes with conditional logic
                </p>
              </div>

              <div className="flex w-full flex-col gap-1">
                <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76]">
                  Description
                </p>
                <div className="flex h-[106px] w-full flex-col justify-between rounded-[8px] border border-solid border-[#e9e9e9] bg-white px-4 pt-4 pb-2">
                  <p className="w-full font-['Satoshi',sans-serif] text-[16px] font-medium text-[#606d76]">
                    A long description goes here, this space will only show two lines before truncation.{" "}
                  </p>
                  <div className="flex w-full items-center justify-end opacity-[0.32]">
                    <p className="font-['Satoshi',sans-serif] text-[14px] font-medium whitespace-nowrap text-[#606d76]">
                      85/100 Characters
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative h-0 w-full shrink-0">
                <div className="absolute inset-x-0 -top-px">
                  <img alt="" className="block h-px w-full max-w-none" src={imgVector15} />
                </div>
              </div>

              <div className="flex w-full flex-col gap-4">
                <div className="flex w-full items-center justify-between">
                  <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                    Tags
                  </p>
                  <div
                    className="flex size-9 items-center justify-center rounded-[8px] border border-solid border-[#ebedee] bg-white p-2 shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(141.68deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%)",
                    }}
                  >
                    <img alt="" className="size-4" src={imgLucideTag} />
                  </div>
                </div>
                <div className="flex w-full flex-wrap content-start items-start gap-2">
                  <div className="flex items-center justify-center gap-2 rounded-[16px] bg-[#0b191f] py-1 pr-3 pl-4">
                    <p className="font-['Satoshi',sans-serif] text-[14px] font-medium whitespace-nowrap text-white">
                      Wireframes
                    </p>
                    <img alt="" className="size-4" src={imgLucideCheck} />
                  </div>
                  {[
                    "Prototypes",
                    "User Flows",
                    "Design Systems",
                    "Usability Testing",
                    "Final Mockups",
                    "User Testing Feedback",
                  ].map((label) => (
                    <div
                      key={label}
                      className="flex items-center justify-center rounded-[16px] border border-solid border-[#cdd2d5] px-4 py-1"
                    >
                      <p className="font-['Satoshi',sans-serif] text-[14px] font-medium whitespace-nowrap text-[#606d76]">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative h-0 w-full shrink-0">
                <div className="absolute inset-x-0 -top-px">
                  <img alt="" className="block h-px w-full max-w-none" src={imgVector15} />
                </div>
              </div>

              <div className="flex w-full flex-col gap-4">
                <div className="flex w-full items-center justify-between">
                  <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                    Due Date
                  </p>
                  <div
                    className="flex size-9 items-center justify-center rounded-[8px] border border-solid border-[#ebedee] bg-white p-2 shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(141.68deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%)",
                    }}
                  >
                    <img alt="" className="size-4" src={imgLucideCalendarPlus} />
                  </div>
                </div>
                <div className="flex w-full flex-wrap content-start items-start gap-2">
                  <div className="flex items-center justify-center gap-2 rounded-[16px] bg-[#0b191f] py-1 pr-3 pl-4">
                    <p className="font-['Satoshi',sans-serif] text-[14px] font-medium whitespace-nowrap text-white">
                      1 Hour
                    </p>
                    <img alt="" className="size-4" src={imgLucideCheck} />
                  </div>
                  {["4 Hours", "8 Hours", "12 Hours", "48 Hours"].map((label) => (
                    <div
                      key={label}
                      className="flex items-center justify-center rounded-[16px] border border-solid border-[#cdd2d5] px-4 py-1"
                    >
                      <p className="font-['Satoshi',sans-serif] text-[14px] font-medium whitespace-nowrap text-[#606d76]">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative h-0 w-full shrink-0">
                <div className="absolute inset-x-0 -top-px">
                  <img alt="" className="block h-px w-full max-w-none" src={imgVector15} />
                </div>
              </div>

              <div className="flex w-full flex-col gap-4">
                <div className="flex w-full items-center justify-between">
                  <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                    Assigned to
                  </p>
                  <div
                    className="flex size-9 items-center justify-center rounded-[8px] border border-solid border-[#ebedee] bg-white p-2 shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(141.68deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%)",
                    }}
                  >
                    <img alt="" className="size-4" src={imgLucideUserRoundPlus1} />
                  </div>
                </div>
                <div className="flex w-full flex-wrap items-center gap-4">
                  <div className="relative inline-flex shrink-0 flex-none">
                    <div className="box-border flex size-[36px] min-h-[36px] min-w-[36px] max-h-[36px] max-w-[36px] flex-none items-center justify-center overflow-hidden rounded-full border-[1.5px] border-solid border-white bg-[#e19c02] [aspect-ratio:1/1]">
                      <span className="leading-none font-['Satoshi',sans-serif] text-[13.5px] font-medium text-white">
                        FA
                      </span>
                    </div>
                    <span className="absolute -right-px -bottom-px box-border flex size-[12px] min-h-[12px] min-w-[12px] flex-none items-center justify-center overflow-hidden rounded-full border-[1.5px] border-solid border-white bg-black [aspect-ratio:1/1]">
                      <img alt="" className="block size-[7px] shrink-0 object-contain" src={imgLucideCheck1} />
                    </span>
                  </div>
                  <div className="relative inline-flex shrink-0 flex-none">
                    <div className="box-border flex size-[36px] min-h-[36px] min-w-[36px] max-h-[36px] max-w-[36px] flex-none items-center justify-center overflow-hidden rounded-full border-[1.5px] border-solid border-white bg-[#f17173] [aspect-ratio:1/1]">
                      <span className="leading-none font-['Satoshi',sans-serif] text-[13.5px] font-medium text-white">
                        GB
                      </span>
                    </div>
                    <span className="absolute -right-px -bottom-px box-border flex size-[12px] min-h-[12px] min-w-[12px] flex-none items-center justify-center overflow-hidden rounded-full border-[1.5px] border-solid border-white bg-black [aspect-ratio:1/1]">
                      <img alt="" className="block size-[7px] shrink-0 object-contain" src={imgLucideCheck1} />
                    </span>
                  </div>
                  <div className="inline-flex size-[36px] min-h-[36px] min-w-[36px] max-h-[36px] max-w-[36px] flex-none shrink-0 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-solid border-white bg-[#815cf8] [aspect-ratio:1/1]">
                    <span className="leading-none font-['Satoshi',sans-serif] text-[13.5px] font-medium text-white">
                      HC
                    </span>
                  </div>
                  <div className="inline-flex size-[36px] min-h-[36px] min-w-[36px] max-h-[36px] max-w-[36px] flex-none shrink-0 overflow-hidden rounded-full border-[1.5px] border-solid border-white [aspect-ratio:1/1]">
                    <img
                      alt=""
                      className="h-full w-full min-h-0 min-w-0 flex-none object-cover"
                      height={36}
                      src={imgComponent34}
                      width={36}
                    />
                  </div>
                  <div className="relative inline-flex shrink-0 flex-none">
                    <div className="box-border flex size-[36px] min-h-[36px] min-w-[36px] max-h-[36px] max-w-[36px] flex-none items-center justify-center overflow-hidden rounded-full border-[1.5px] border-solid border-white bg-[#3899fa] [aspect-ratio:1/1]">
                      <span className="leading-none font-['Satoshi',sans-serif] text-[13.5px] font-medium text-white">
                        JE
                      </span>
                    </div>
                    <span className="absolute -right-px -bottom-px box-border flex size-[12px] min-h-[12px] min-w-[12px] flex-none items-center justify-center overflow-hidden rounded-full border-[1.5px] border-solid border-white bg-black [aspect-ratio:1/1]">
                      <img alt="" className="block size-[7px] shrink-0 object-contain" src={imgLucideCheck1} />
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative h-0 w-full shrink-0">
                <div className="absolute inset-x-0 -top-px">
                  <img alt="" className="block h-px w-full max-w-none" src={imgVector15} />
                </div>
              </div>

              <div className="flex w-full flex-col gap-4">
                <div className="flex w-full items-center justify-between">
                  <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                    Checklist
                  </p>
                  <button
                    type="button"
                    onClick={addChecklistRow}
                    className="flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-solid border-[#ebedee] bg-white p-2 shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                    aria-label="Add checklist item"
                  >
                    <Plus className="size-4 text-[#0b191f]" strokeWidth={2} />
                  </button>
                </div>
                <div className="flex w-full max-w-[363px] flex-col gap-2">
                  {checklistItems.map((item) => (
                    <div key={item.id} className="flex w-full min-w-0 items-center">
                      <button
                        type="button"
                        onClick={() => toggleChecklist(item.id)}
                        className={cn(
                          "flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border border-solid transition-colors",
                          item.done
                            ? "border-0 bg-[#24B5F8]"
                            : "border-[#ebedee] bg-[#f9f9f9]",
                        )}
                        aria-label={item.done ? "Mark checklist item incomplete" : "Mark checklist item complete"}
                      >
                        {item.done && <Check className="size-[13px] text-white" strokeWidth={2.5} />}
                      </button>
                      <div className="min-w-0 flex-1 overflow-hidden px-4 py-1">
                        {item.done ? (
                          <button
                            type="button"
                            onClick={() => toggleChecklist(item.id)}
                            className="w-full cursor-pointer text-left font-['Inter',sans-serif] text-[13px] leading-[19px] text-[#0b191f] opacity-50 line-through"
                          >
                            {item.text}
                          </button>
                        ) : (
                          <input
                            type="text"
                            value={item.text}
                            onChange={(e) => updateChecklistText(item.id, e.target.value)}
                            onBlur={() => removeChecklistIfEmpty(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            }}
                            placeholder="Checklist item..."
                            className="w-full border-0 bg-transparent p-0 font-['Inter',sans-serif] text-[13px] leading-[19px] text-[#0b191f] outline-none placeholder:text-[#606d76]/70"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative h-0 w-full shrink-0">
                <div className="absolute inset-x-0 -top-px">
                  <img alt="" className="block h-px w-full max-w-none" src={imgVector15} />
                </div>
              </div>

              <div className="flex w-full flex-col gap-4">
                <div className="flex w-full items-center justify-between">
                  <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                    Resources
                  </p>
                  <button
                    type="button"
                    onClick={() => setAddResourceOpen(true)}
                    className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-[8px] border border-solid border-[#ebedee] bg-white py-2 pl-4 pr-3 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] shadow-[0px_5px_1px_0px_rgba(14,14,34,0),0px_3px_1px_0px_rgba(14,14,34,0.01),0px_2px_1px_0px_rgba(14,14,34,0.02),0px_1px_1px_0px_rgba(14,14,34,0.03)]"
                  >
                    Add
                    <Plus className="size-4" strokeWidth={2} />
                  </button>
                </div>
                <div className="flex w-full flex-col gap-4">{welcomeResourcesMock.map(renderResourceRow)}</div>
              </div>
            </div>
          </div>

          <div className="z-[1] flex w-full shrink-0 items-center justify-end border-t border-solid border-[#ebedee] bg-white px-9 py-4">
            <DialogClose asChild>
              <button
                type="button"
                className="flex h-10 cursor-pointer items-center justify-center rounded-[8px] border-0 px-4 py-2"
                style={{
                  backgroundImage:
                    "linear-gradient(164.88deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%), linear-gradient(100.84deg, rgb(36, 181, 248) 1.258%, rgb(85, 33, 254) 269.28%), linear-gradient(90deg, rgb(36, 181, 248) 0%, rgb(36, 181, 248) 100%)",
                }}
              >
                <span className="font-['Inter',sans-serif] text-[14px] font-semibold text-white">
                  Create Task
                </span>
              </button>
            </DialogClose>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
