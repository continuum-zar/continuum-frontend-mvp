"use client";

import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { parseISO } from "date-fns";
import type { ActiveWorkSessionItem } from "@/api/dashboard";
import {
  DialogClose,
  Dialog,
  DialogOverlay,
  DialogPortal,
} from "@/app/components/ui/dialog";
import { cn } from "@/app/components/ui/utils";
import { ArrowLeft } from "lucide-react";
import { memberAvatarBackground } from "@/lib/memberAvatar";

export function initialsFromActiveSession(s: ActiveWorkSessionItem): string {
  const a = `${s.first_name?.[0] ?? ""}${s.last_name?.[0] ?? ""}`.trim();
  if (a) return a.toUpperCase().slice(0, 2);
  const dn = s.display_name?.trim();
  if (dn) {
    const parts = dn.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
    return dn.slice(0, 2).toUpperCase();
  }
  return "?";
}

export function formatWorkingDuration(startedAtIso: string, now: Date): string {
  const t0 = parseISO(startedAtIso).getTime();
  let mins = Math.floor((now.getTime() - t0) / 60_000);
  if (mins < 0 || Number.isNaN(mins)) mins = 0;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export type ActiveWorkSessionDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: ActiveWorkSessionItem | null;
};

export function ActiveWorkSessionDetailDialog({ open, onOpenChange, session }: ActiveWorkSessionDetailDialogProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!open || !session) return;
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, [open, session]);

  const displayName =
    [session?.first_name, session?.last_name].filter(Boolean).join(" ").trim() || session?.display_name || "Member";
  const initials = session ? initialsFromActiveSession(session) : "";
  const taskTitle = session?.task_title?.trim() || "No task";
  const elapsed = session ? formatWorkingDuration(session.started_at, now) : "";
  const paused = String(session?.status ?? "").toUpperCase() === "PAUSED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[600px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <DialogPrimitive.Title className="sr-only">Active time session</DialogPrimitive.Title>
          <div className="grid w-full grid-cols-[20px_1fr_20px] items-center border-b border-[#f5f5f5] bg-[#f9f9f9] px-9 py-4">
            <DialogClose asChild>
              <button type="button" className="inline-flex size-5 items-center justify-center text-[#606d76]" aria-label="Back">
                <ArrowLeft className="size-5" />
              </button>
            </DialogClose>
            <p className="text-center font-['Satoshi',sans-serif] text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
              Active time session
            </p>
            <div className="size-5" />
          </div>
          {session ? (
          <div
            className="flex flex-col gap-6 px-9 py-6"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(90deg, rgb(249, 249, 249) 0%, rgb(249, 249, 249) 100%)",
            }}
          >
            <p className="font-['Satoshi',sans-serif] text-[14px] text-[#606d76]">
              Task and duration for the selected team member.
            </p>
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: memberAvatarBackground(session.user_id) }}
                aria-hidden
              >
                {initials}
              </div>
              <div>
                <p className="font-['Satoshi',sans-serif] text-[16px] font-medium leading-tight text-[#0b191f]">{displayName}</p>
                <p className="inline-flex items-center gap-2 font-['Satoshi',sans-serif] text-[14px] text-[#5f6f7b]">
                  <span className={cn("inline-block h-2 w-2 rounded-full", paused ? "bg-amber-500" : "bg-emerald-500")} aria-hidden />
                  Session status: {session.status}
                </p>
              </div>
            </div>
            <div>
              <p className="font-['Satoshi',sans-serif] text-[14px] uppercase tracking-wide text-[#6f7e87]">Task</p>
              <p className={cn("font-['Satoshi',sans-serif] text-[18px] leading-tight text-[#0b191f]", taskTitle === "No task" && "text-amber-700")}>
                {taskTitle === "No task" ? "Task missing on session payload" : taskTitle}
              </p>
            </div>
            <div>
              <p className="font-['Satoshi',sans-serif] text-[14px] uppercase tracking-wide text-[#6f7e87]">Working for</p>
              <p className="font-['Satoshi',sans-serif] text-[32px] leading-none tabular-nums text-[#0b191f]" aria-live="polite">
                {elapsed}
              </p>
              {paused ? (
                <p className="mt-1 font-['Satoshi',sans-serif] text-[13px] text-[#6b7b86]">Timer is paused. Duration reflects time accumulated so far.</p>
              ) : null}
              <p className="mt-1 font-['Satoshi',sans-serif] text-[13px] text-[#6b7b86]">
                Started {new Date(session.started_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
          </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
