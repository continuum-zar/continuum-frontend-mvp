"use client";

import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
} from "./ui/dialog";
import { cn } from "./ui/utils";
import { AddResourceModal } from "./welcome/AddResourceModal";
import { mcpAsset } from "@/app/assets/dashboardPlaceholderAssets";
import { formatEstimatedEffortLabel } from "@/api";
import { useAutosizeTextarea } from "@/hooks/useAutosizeTextarea";

function ChecklistItemTextarea({
  value,
  onChange,
  onBlur,
  onKeyDown,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
}) {
  const ref = useAutosizeTextarea(value, { minPx: 40, maxPx: 160 });
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      rows={1}
      className="max-h-[160px] w-full resize-none overflow-y-auto border-0 bg-transparent p-0 font-['Inter',sans-serif] text-[13px] font-normal leading-[19px] tracking-normal text-[#0b191f] outline-none placeholder:text-[#606d76]/70"
    />
  );
}

const imgLucideArrowLeft =
  mcpAsset("27ca96dc-a695-48d3-8f22-628b8eb437bd");
const imgLucideFlag =
  mcpAsset("e52cc33b-1c94-4f51-831d-27613aec8fb7");
const imgVector15 =
  mcpAsset("ed075df4-e80e-41eb-a544-5369dfb77a46");
const imgLucideTag =
  mcpAsset("d427a1f8-33d2-4b4d-a88d-0d6788ed82e6");
const imgLucideUserRoundPlus1 =
  mcpAsset("3b9ddb70-8dce-456b-9932-8b226f04049a");
const DEFAULT_TASK_TITLE = "Set up high-fidelity prototypes with conditional logic";
const DEFAULT_TASK_DESCRIPTION =
  "A long description goes here, this space will only show two lines before truncation. ";

export type ChecklistRow = { id: string; text: string; done: boolean };

export type CreateTaskModalPrefill = {
  title: string;
  description: string;
  descriptionMeta?: string;
  checklist?: ChecklistRow[];
  /** AI-generated labels (e.g. backend, security). Shown as tag pills when present. */
  labels?: string[];
};

type CreateTaskModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** AI / deep-link: seed fields when opening or when prefillKey changes */
  prefill?: CreateTaskModalPrefill;
  /** Bump when switching carousel slides so prefill re-applies */
  prefillKey?: string | number;
  headerTitle?: string;
  submitLabel?: string;
  carousel?: {
    index: number;
    total: number;
    onPrev: () => void;
    onNext: () => void;
  };
};

export function CreateTaskModal({
  open,
  onOpenChange,
  prefill,
  prefillKey,
  headerTitle = "Create Task",
  submitLabel,
  carousel,
}: CreateTaskModalProps) {
  const [checklistItems, setChecklistItems] = useState<ChecklistRow[]>([]);
  const [taskTitle, setTaskTitle] = useState(DEFAULT_TASK_TITLE);
  const [taskDescription, setTaskDescription] = useState(DEFAULT_TASK_DESCRIPTION);
  const [taskDescriptionMeta, setTaskDescriptionMeta] = useState("85/100 Characters");
  const [addResourceOpen, setAddResourceOpen] = useState(false);
  const [mockEffortHours, setMockEffortHours] = useState<number | null>(null);
  const [addingMockEffort, setAddingMockEffort] = useState(false);
  const [mockEffortDraft, setMockEffortDraft] = useState("");

  const resolvedSubmitLabel = submitLabel ?? "Create Task";

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
    if (!open) {
      setChecklistItems([]);
      return;
    }
    if (prefill) {
      setTaskTitle(prefill.title);
      setTaskDescription(prefill.description);
      setTaskDescriptionMeta(prefill.descriptionMeta ?? "85/100 Characters");
      setChecklistItems(prefill.checklist?.length ? prefill.checklist : []);
    } else {
      setTaskTitle(DEFAULT_TASK_TITLE);
      setTaskDescription(DEFAULT_TASK_DESCRIPTION);
      setTaskDescriptionMeta("85/100 Characters");
      setChecklistItems([]);
    }
  }, [open, prefill, prefillKey]);

  const showCarousel = Boolean(carousel && carousel.total > 1);
  const canPrev = showCarousel && carousel!.index > 0;
  const canNext = showCarousel && carousel!.index < carousel!.total - 1;

  if (!open) return null;

  return (
    <Dialog open onOpenChange={() => {}}>
      <AddResourceModal open={addResourceOpen} onOpenChange={setAddResourceOpen} />
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        {showCarousel && canPrev && (
          <button
            type="button"
            aria-label="Previous task"
            onClick={() => carousel!.onPrev()}
            style={{ pointerEvents: "auto" }}
            className="fixed top-1/2 left-4 z-[60] flex size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[999px] border-0 bg-white shadow-md md:left-8"
          >
            <ChevronLeft className="size-8 text-[#0b191f]" strokeWidth={1.5} />
          </button>
        )}
        {showCarousel && canNext && (
          <button
            type="button"
            aria-label="Next task"
            onClick={() => carousel!.onNext()}
            style={{ pointerEvents: "auto" }}
            className="fixed top-1/2 right-4 z-[60] flex size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[999px] border-0 bg-white shadow-md md:right-8"
          >
            <ChevronRight className="size-8 text-[#0b191f]" strokeWidth={1.5} />
          </button>
        )}
        {showCarousel && (
          <div className="fixed bottom-8 left-1/2 z-[60] -translate-x-1/2" style={{ pointerEvents: "auto" }}>
            <div
              className="flex gap-2 rounded-[99px] bg-white/90 p-2 shadow-sm backdrop-blur-[10px]"
              role="tablist"
              aria-label="Task carousel"
            >
              {Array.from({ length: carousel!.total }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-[99px] transition-[width,background-color]",
                    i === carousel!.index ? "h-2 w-6 bg-black" : "size-2 bg-[#d9d9d9]",
                  )}
                  aria-hidden
                />
              ))}
            </div>
          </div>
        )}
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onFocusOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={() => onOpenChange(false)}
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 flex max-h-[min(886px,90vh)] w-[calc(100%-2rem)] max-w-[600px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200",
          )}
        >
          <DialogPrimitive.Title className="sr-only">{headerTitle}</DialogPrimitive.Title>

          <div className="z-[3] flex w-full shrink-0 items-center justify-between border-b border-solid border-[#f5f5f5] bg-[#f9f9f9] px-9 py-4">
            <button
              type="button"
              className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
              aria-label="Back"
              onClick={() => onOpenChange(false)}
            >
              <span className="relative block size-5">
                <img alt="" className="block size-full max-w-none" src={imgLucideArrowLeft} />
              </span>
            </button>
            <div className="pointer-events-none absolute left-1/2 top-[25px] flex -translate-x-1/2 flex-col items-center gap-3">
              <p className="text-center font-['Satoshi',sans-serif] text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
                {headerTitle}
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
                <p className="min-w-0 flex-1 break-words font-['Satoshi',sans-serif] text-[24px] font-medium text-[#0b191f]">
                  {taskTitle}
                </p>
              </div>

              <div className="flex w-full flex-col gap-1">
                <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76]">
                  Description
                </p>
                <div className="flex max-h-[min(240px,40vh)] w-full min-h-[120px] flex-col overflow-hidden rounded-[8px] border border-solid border-[#e9e9e9] bg-white">
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-2">
                    <p className="whitespace-pre-wrap break-words font-['Satoshi',sans-serif] text-[16px] font-medium leading-relaxed text-[#0b191f]">
                      {taskDescription}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center justify-end border-t border-[#e9e9e9]/80 px-4 py-2 opacity-[0.5]">
                    <p className="font-['Satoshi',sans-serif] text-[12px] font-medium whitespace-nowrap text-[#606d76]">
                      {taskDescriptionMeta}
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
                  {(prefill?.labels ?? []).length > 0 ? (
                    prefill!.labels!.map((label, i) => (
                      <div
                        key={`${label}-${i}`}
                        className="inline-flex max-w-full items-center rounded-[16px] border border-solid border-[#cdd2d5] bg-white px-4 py-1.5"
                      >
                        <p className="min-w-0 break-words font-['Satoshi',sans-serif] text-[14px] font-medium leading-snug text-[#606d76]">
                          {label}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="w-full font-['Satoshi',sans-serif] text-[14px] text-[#a3aab0]">
                      No tags
                    </p>
                  )}
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
                    Estimated effort
                  </p>
                  {mockEffortHours == null && !addingMockEffort ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAddingMockEffort(true);
                        setMockEffortDraft("");
                      }}
                      className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[#ebedee] bg-white px-3 py-2 font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f]"
                    >
                      Add <Plus size={16} />
                    </button>
                  ) : null}
                </div>
                <div className="flex w-full flex-wrap content-start items-start gap-2">
                  {mockEffortHours != null && !addingMockEffort ? (
                    <div className="group inline-flex items-center gap-1.5 rounded-[16px] bg-[#0b191f] px-4 py-1.5">
                      <p className="font-['Satoshi',sans-serif] text-[14px] font-medium leading-none text-white">
                        {formatEstimatedEffortLabel(mockEffortHours)}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setMockEffortHours(null);
                          setAddingMockEffort(false);
                          setMockEffortDraft("");
                        }}
                        className="inline-flex size-4 items-center justify-center text-white/80 opacity-0 transition-opacity group-hover:opacity-100 hover:text-white"
                        aria-label="Remove estimated effort"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : null}
                  {addingMockEffort && (
                    <div className="inline-flex items-center rounded-[16px] border border-solid border-[#cdd2d5] bg-white px-4 py-1.5">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Hours"
                        value={mockEffortDraft}
                        onChange={(e) => setMockEffortDraft(e.target.value)}
                        onBlur={() => {
                          setAddingMockEffort(false);
                          const t = mockEffortDraft.trim().replace(/h$/i, "");
                          if (t === "") return;
                          const n = Number(t);
                          if (Number.isFinite(n) && n >= 0) setMockEffortHours(n);
                          setMockEffortDraft("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                          if (e.key === "Escape") {
                            setAddingMockEffort(false);
                            setMockEffortDraft("");
                          }
                        }}
                        className="w-20 border-0 bg-transparent p-0 font-['Satoshi',sans-serif] text-[14px] font-medium leading-none text-[#606d76] outline-none placeholder:text-[#606d76]/60"
                        autoFocus
                      />
                    </div>
                  )}
                  {mockEffortHours == null && !addingMockEffort ? (
                    <p className="w-full font-['Satoshi',sans-serif] text-[14px] text-[#a3aab0]">No effort set</p>
                  ) : null}
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
                <p className="w-full font-['Satoshi',sans-serif] text-[14px] text-[#a3aab0]">
                  Not assigned
                </p>
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
                <div className="flex w-full max-w-[363px] flex-col gap-3">
                  {checklistItems.map((item) => (
                    <div key={item.id} className="flex w-full min-w-0 items-start gap-0">
                      <button
                        type="button"
                        onClick={() => toggleChecklist(item.id)}
                        className={cn(
                          "mt-1 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border border-solid transition-colors",
                          item.done
                            ? "border-0 bg-[#24B5F8]"
                            : "border-[#ebedee] bg-[#f9f9f9]",
                        )}
                        aria-label={item.done ? "Mark checklist item incomplete" : "Mark checklist item complete"}
                      >
                        {item.done && <Check className="size-[13px] text-white" strokeWidth={2.5} />}
                      </button>
                      <div className="min-w-0 flex-1 px-4 py-0.5">
                        {item.done ? (
                          <button
                            type="button"
                            onClick={() => toggleChecklist(item.id)}
                            className="w-full cursor-pointer text-left break-words whitespace-pre-wrap font-['Inter',sans-serif] text-[13px] font-normal leading-[19px] tracking-normal text-[#0b191f] opacity-50 line-through"
                          >
                            {item.text}
                          </button>
                        ) : (
                          <ChecklistItemTextarea
                            value={item.text}
                            onChange={(v) => updateChecklistText(item.id, v)}
                            onBlur={() => removeChecklistIfEmpty(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                (e.target as HTMLTextAreaElement).blur();
                              }
                            }}
                            placeholder="Checklist item..."
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
                <p className="w-full font-['Satoshi',sans-serif] text-[14px] text-[#a3aab0]">
                  No resources
                </p>
              </div>
            </div>
          </div>

          <div className="z-[1] flex w-full shrink-0 items-center justify-end border-t border-solid border-[#ebedee] bg-white px-9 py-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-10 cursor-pointer items-center justify-center rounded-[8px] border-0 px-4 py-2"
              style={{
                backgroundImage:
                  "linear-gradient(164.88deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%), linear-gradient(100.84deg, rgb(36, 181, 248) 1.258%, rgb(85, 33, 254) 269.28%), linear-gradient(90deg, rgb(36, 181, 248) 0%, rgb(36, 181, 248) 100%)",
              }}
            >
              <span className="font-['Inter',sans-serif] text-[14px] font-semibold text-white">
                {resolvedSubmitLabel}
              </span>
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
