"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, Calendar, ChevronDown, Plus } from "lucide-react";

import { Dialog, DialogClose, DialogOverlay, DialogPortal } from "../ui/dialog";
import { cn } from "../ui/utils";

type LogTimeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LogTimeModal({ open, onOpenChange }: LogTimeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[600px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Log Time</DialogPrimitive.Title>

          <div className="grid w-full grid-cols-[20px_1fr_20px] items-center border-b border-[#f5f5f5] bg-[#f9f9f9] px-9 py-4">
            <DialogClose asChild>
              <button type="button" className="inline-flex size-5 items-center justify-center text-[#0b191f]" aria-label="Back">
                <ArrowLeft className="size-5" />
              </button>
            </DialogClose>
            <p className="text-center font-['Satoshi',sans-serif] text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
              Log Time
            </p>
            <div className="size-5" />
          </div>

          <div
            className="flex w-full flex-col gap-6 px-9 py-6"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(90deg, rgb(249, 249, 249) 0%, rgb(249, 249, 249) 100%)",
            }}
          >
            <div className="flex w-full flex-col gap-4">
              <div className="flex w-full flex-col gap-1">
                <p className="text-[14px] font-medium text-[#606d76]">Task</p>
                <div className="flex h-10 items-center justify-between rounded-[8px] border border-[#e9e9e9] bg-white px-4">
                  <p className="text-[16px] font-medium text-[#9fa5a8]">Selecting a task</p>
                  <ChevronDown className="size-4 text-[#0b191f]" />
                </div>
              </div>

              <div className="flex w-full gap-4">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="text-[14px] font-medium text-[#606d76]">Date Range</p>
                  <div className="flex h-10 items-center justify-between rounded-[8px] border border-[#e9e9e9] bg-white px-4">
                    <p className="truncate text-[16px] font-medium text-[#9fa5a8]">Start Date-End Date</p>
                    <Calendar className="size-4 text-[#0b191f]" />
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="text-[14px] font-medium text-[#606d76]">Time Range</p>
                  <div className="flex h-10 items-center rounded-[8px] border border-[#e9e9e9] bg-white px-4">
                    <p className="truncate text-[16px] font-medium text-[#9fa5a8]">Start Time-End Time</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-[#ebedee]" />

            <div className="flex w-full flex-col gap-1">
              <p className="text-[14px] font-medium text-[#606d76]">Description</p>
              <div className="flex h-[106px] flex-col justify-between rounded-[8px] border border-[#e9e9e9] bg-white px-4 pb-2 pt-4">
                <p className="text-[16px] font-medium text-[#606d76]">
                  A long description goes here, this space will only show two lines before truncation.
                </p>
                <p className="self-end text-[14px] font-medium text-[#606d76]/30">85/100 Characters</p>
              </div>
            </div>

            <div className="flex w-full justify-end">
              <button
                type="button"
                disabled
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[rgba(96,109,118,0.1)] px-4 text-[14px] font-semibold text-[#606d76]/50"
              >
                <Plus className="size-4" />
                Log Time
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
