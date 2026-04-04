"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Dialog, DialogClose, DialogOverlay, DialogPortal } from "../ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../ui/utils";
import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";
import { useProjectTasks } from "@/api/hooks";

/** Figma playground node 25:10140 */
const imgLucideArrowLeft =
  mcpAsset("2117706d-83d3-4c1d-9e0b-71c1454e8c99");
const imgLucideChevronDown =
  mcpAsset("8faeee75-ddf6-4f27-b584-6f1616dedbea");
const imgLucideBot =
  mcpAsset("45ca08ef-a09e-466c-a13b-102083214a38");
const DESC_MAX = 100;

const placeholderDescription =
  "A long description goes here, this space will only show two lines before truncation.";

const AI_SUGGESTED_DESCRIPTION =
  "Focused on component specs and edge cases for the checkout flow. Synced with design on spacing tokens.";

type LogTimeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, task list loads from this project (API). Omit on demo routes without a project. */
  projectId?: number | null;
};

export function LogTimeModal({ open, onOpenChange, projectId }: LogTimeModalProps) {
  const [taskId, setTaskId] = useState("");
  const [taskPickerOpen, setTaskPickerOpen] = useState(false);
  const [taskSearch, setTaskSearch] = useState("");
  const [hoursSpent, setHoursSpent] = useState("");
  const [description, setDescription] = useState("");
  const taskSearchInputRef = useRef<HTMLInputElement>(null);
  /** Dialog surface for Radix popper collision — keeps task dropdown inside the modal. */
  const [dialogBoundary, setDialogBoundary] = useState<Element | null>(null);
  const setDialogContentNode = useCallback((node: HTMLDivElement | null) => {
    setDialogBoundary(node);
  }, []);

  const { data: projectTasks = [], isLoading: tasksLoading } = useProjectTasks(
    projectId != null ? projectId : undefined,
  );

  const filteredTasks = useMemo(() => {
    const q = taskSearch.trim().toLowerCase();
    if (!q) return projectTasks;
    return projectTasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [projectTasks, taskSearch]);

  const selectedTask = projectTasks.find((t) => t.id === taskId);

  useEffect(() => {
    if (!open) return;
    setTaskId("");
    setTaskPickerOpen(false);
    setTaskSearch("");
    setHoursSpent("");
    setDescription("");
  }, [open]);

  useEffect(() => {
    if (taskPickerOpen) {
      setTimeout(() => taskSearchInputRef.current?.focus(), 0);
    } else {
      setTaskSearch("");
    }
  }, [taskPickerOpen]);

  const hoursNum = Number.parseFloat(hoursSpent);
  const canSubmit =
    taskId !== "" &&
    hoursSpent.trim() !== "" &&
    Number.isFinite(hoursNum) &&
    hoursNum > 0 &&
    projectId != null;

  const descLen = description.length;

  const handleWriteWithAI = () => {
    setDescription(AI_SUGGESTED_DESCRIPTION.slice(0, DESC_MAX));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          ref={setDialogContentNode}
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
              {/* Task + time spent — Figma I25:10140;2488:110958 */}
              <div className="flex w-full flex-col gap-4">
                <div className="flex w-full flex-col gap-1">
                  <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76]">Task</p>
                  {projectId != null ? (
                    <Popover open={taskPickerOpen} onOpenChange={setTaskPickerOpen} modal={false}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "flex h-10 w-full items-center justify-between rounded-[8px] border border-solid border-[#e9e9e9] bg-white px-4 py-2 text-left font-['Satoshi',sans-serif] text-[16px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#2798f5]/40",
                            selectedTask ? "text-[#0b191f]" : "text-[#9fa5a8]",
                          )}
                          aria-expanded={taskPickerOpen}
                          aria-haspopup="listbox"
                          aria-label="Select task"
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {selectedTask ? selectedTask.title : "Selecting a task"}
                          </span>
                          <img alt="" className="ml-2 size-4 shrink-0" src={imgLucideChevronDown} aria-hidden />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        sideOffset={4}
                        collisionBoundary={dialogBoundary ?? undefined}
                        collisionPadding={12}
                        className={cn(
                          "z-[100] flex w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden border border-solid border-[#e9e9e9] p-0 shadow-lg",
                          "max-h-[min(320px,var(--radix-popper-available-height,280px))]",
                        )}
                        onOpenAutoFocus={(e) => {
                          e.preventDefault();
                          taskSearchInputRef.current?.focus();
                        }}
                      >
                        <div
                          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[8px] bg-white"
                          role="listbox"
                        >
                          <div className="flex shrink-0 items-center gap-2 border-b border-[#f0f0f0] px-3 py-2">
                            <Search className="size-4 shrink-0 text-[#9fa5a8]" strokeWidth={2} />
                            <input
                              ref={taskSearchInputRef}
                              type="text"
                              value={taskSearch}
                              onChange={(e) => setTaskSearch(e.target.value)}
                              placeholder="Search tasks…"
                              className="min-w-0 flex-1 border-0 bg-transparent font-['Satoshi',sans-serif] text-[14px] text-[#0b191f] outline-none placeholder:text-[#9fa5a8]"
                              aria-label="Search tasks"
                            />
                          </div>
                          <div
                            className="scrollbar-hide min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain py-1 [-webkit-overflow-scrolling:touch]"
                            onWheel={(e) => e.stopPropagation()}
                          >
                            {tasksLoading ? (
                              <p className="px-3 py-3 text-center font-['Satoshi',sans-serif] text-[13px] text-[#9fa5a8]">
                                Loading tasks…
                              </p>
                            ) : filteredTasks.length === 0 ? (
                              <p className="px-3 py-3 text-center font-['Satoshi',sans-serif] text-[13px] text-[#9fa5a8]">
                                {projectTasks.length === 0 ? "No tasks in this project" : "No matching tasks"}
                              </p>
                            ) : (
                              filteredTasks.map((t) => (
                                <button
                                  key={t.id}
                                  type="button"
                                  role="option"
                                  aria-selected={taskId === t.id}
                                  onClick={() => {
                                    setTaskId(t.id);
                                    setTaskPickerOpen(false);
                                  }}
                                  className={cn(
                                    "flex w-full items-center gap-2 px-3 py-2.5 text-left font-['Satoshi',sans-serif] text-[14px] transition-colors hover:bg-[#f5f7f8]",
                                    taskId === t.id && "bg-[#f0f8ff]",
                                  )}
                                >
                                  <span className="min-w-0 flex-1 truncate text-[#0b191f]">{t.title}</span>
                                  {taskId === t.id ? (
                                    <Check className="size-4 shrink-0 text-[#2798f5]" strokeWidth={2} />
                                  ) : null}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex h-10 w-full cursor-not-allowed items-center justify-between rounded-[8px] border border-solid border-[#e9e9e9] bg-white px-4 py-2 text-left font-['Satoshi',sans-serif] text-[16px] font-medium text-[#9fa5a8] opacity-60 outline-none"
                      aria-label="Select task"
                    >
                      <span className="min-w-0 flex-1 truncate">Open a project board to select tasks</span>
                      <img alt="" className="ml-2 size-4 shrink-0" src={imgLucideChevronDown} aria-hidden />
                    </button>
                  )}
                </div>

                <div className="flex w-1/2 min-w-0 flex-col gap-1">
                  <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76]">Time spent</p>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={hoursSpent}
                    onChange={(e) => setHoursSpent(e.target.value)}
                    placeholder="Hours (e.g. 2.5)"
                    className="h-10 w-full rounded-[8px] border border-solid border-[#e9e9e9] bg-white px-4 py-2 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] placeholder:text-[#9fa5a8] outline-none focus-visible:ring-2 focus-visible:ring-[#2798f5]/40"
                    aria-label="Time spent in hours"
                  />
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
                  disabled={!canSubmit}
                  className={cn(
                    "inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] border-0 px-4 py-2 outline-none",
                    canSubmit
                      ? "cursor-pointer bg-[#2798f5] text-white hover:bg-[#1e87e0]"
                      : "cursor-not-allowed bg-[rgba(96,109,118,0.1)]",
                  )}
                  aria-disabled={!canSubmit}
                >
                  <Plus
                    size={16}
                    className={cn("shrink-0", canSubmit ? "text-white" : "text-[#606d76] opacity-50")}
                    strokeWidth={2}
                  />
                  <span
                    className={cn(
                      "font-['Inter',sans-serif] text-[14px] font-semibold",
                      canSubmit ? "text-white" : "text-[#606d76] opacity-50",
                    )}
                  >
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
