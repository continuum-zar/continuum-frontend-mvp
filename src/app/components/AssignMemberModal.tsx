"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, X } from "lucide-react";

import { useProjectMembers, useAssignTask } from "@/api/hooks";
import type { Member } from "@/types/member";

import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
} from "./ui/dialog";
import { cn } from "./ui/utils";

const assignButtonGradient =
  "linear-gradient(151.86872497935377deg, rgb(36, 181, 248) 123.02%, rgb(85, 33, 254) 802.55%)";

const AVATAR_BGS = [
  "bg-[#e19c02]",
  "bg-[#f5c542]",
  "bg-[#3b82f6]",
  "bg-[#8b5cf6]",
  "bg-[#10b981]",
  "bg-[#f17173]",
];

function memberDisplayLines(m: Member): { primary: string; secondary: string } {
  const email = m.email?.trim() ?? "";
  const hasName = m.name && m.name !== "Unknown" && m.name.trim() !== "";
  if (hasName) {
    return { primary: m.name.trim(), secondary: email };
  }
  return { primary: email || "Member", secondary: "" };
}

type AssignMemberModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: number | string;
  taskId?: string | number;
  currentAssigneeId?: number | null;
};

export function AssignMemberModal({
  open,
  onOpenChange,
  projectId,
  taskId,
  currentAssigneeId,
}: AssignMemberModalProps) {
  const [search, setSearch] = useState("");

  const membersQuery = useProjectMembers(projectId, {
    enabled: !!projectId && open,
  });
  const assignTaskMutation = useAssignTask();

  const members = membersQuery.data ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [members, search]);

  const handleAssign = (userId: number) => {
    if (!taskId) return;
    assignTaskMutation.mutate(
      { taskId, userId },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const handleUnassign = () => {
    if (!taskId) return;
    assignTaskMutation.mutate(
      { taskId, userId: null },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 flex max-h-[min(92vh,900px)] w-[calc(100%-2rem)] max-w-[600px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f5f5f5] bg-white shadow-[0px_39px_11px_0px_rgba(181,181,181,0),0px_25px_10px_0px_rgba(181,181,181,0.04),0px_14px_8px_0px_rgba(181,181,181,0.12),0px_6px_6px_0px_rgba(181,181,181,0.2),0px_2px_3px_0px_rgba(181,181,181,0.24)] duration-200",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Assign Member</DialogPrimitive.Title>

          <div className="relative z-[3] flex w-full shrink-0 items-center justify-between border-b border-solid border-[#f5f5f5] bg-[#f9f9f9] px-9 py-4">
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-[#0b191f]"
                aria-label="Back"
              >
                <ArrowLeft className="size-5" strokeWidth={2} />
              </button>
            </DialogClose>
            <p className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-['Satoshi',sans-serif] text-[16px] font-medium tracking-[-0.16px] text-[#595959]">
              Assign Member
            </p>
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

          <div
            className="z-[2] min-h-0 flex-1 overflow-x-clip overflow-y-auto px-9 py-6"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%), linear-gradient(90deg, rgb(249, 249, 249) 0%, rgb(249, 249, 249) 100%)",
            }}
          >
            <div className="flex w-full flex-col gap-6 pb-6">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#606d76]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search members"
                  className="w-full rounded-[8px] border border-solid border-[#e9e9e9] bg-white py-3 pl-10 pr-4 font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f] outline-none placeholder:text-[#606d76] focus-visible:ring-2 focus-visible:ring-[#24b5f8]/40"
                />
              </div>

              {currentAssigneeId != null && (
                <button
                  type="button"
                  onClick={handleUnassign}
                  disabled={assignTaskMutation.isPending}
                  className="w-full rounded-[8px] border border-solid border-[#e9e9e9] bg-white px-4 py-2.5 text-center font-['Satoshi',sans-serif] text-[14px] font-medium text-[#606d76] hover:bg-[#f0f3f5] disabled:opacity-50"
                >
                  Remove assignment
                </button>
              )}

              <div className="flex w-full flex-col gap-2">
                <p className="font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                  Project Members
                </p>

                {membersQuery.isLoading ? (
                  <div className="flex flex-col gap-4 py-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex w-full items-center gap-2 pr-2">
                        <div className="size-8 shrink-0 animate-pulse rounded-[999px] bg-[#e4eaec]" />
                        <div className="min-w-0 flex-1 space-y-2 py-1">
                          <div className="h-4 w-40 animate-pulse rounded bg-[#e4eaec]" />
                          <div className="h-3 w-56 animate-pulse rounded bg-[#e4eaec]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : membersQuery.isError ? (
                  <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#c02626]">
                    Couldn't load members. Try again.
                  </p>
                ) : filtered.length === 0 ? (
                  <p className="font-['Satoshi',sans-serif] text-[14px] font-medium text-[#727d83]">
                    {search.trim() ? "No members match your search." : "No members in this project."}
                  </p>
                ) : (
                  <div className="flex w-full flex-col gap-4">
                    {filtered.map((m) => {
                      const { primary, secondary } = memberDisplayLines(m);
                      const bg = AVATAR_BGS[m.id % AVATAR_BGS.length];
                      const isAssigned = m.userId === currentAssigneeId;
                      return (
                        <div
                          key={m.id}
                          className="flex w-full items-center gap-2 overflow-hidden rounded-[8px] pr-2"
                        >
                          <div
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-[999px] border-[1.333px] border-solid border-white text-white",
                              bg,
                            )}
                            aria-hidden
                          >
                            <span className="font-['Satoshi',sans-serif] text-[12px] font-medium leading-[0.4]">
                              {m.initials}
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col justify-center px-2 py-1.5">
                            <p className="w-full truncate font-['Satoshi',sans-serif] text-[16px] font-medium text-[#0b191f]">
                              {primary}
                            </p>
                            {secondary ? (
                              <p className="w-full truncate font-['Satoshi',sans-serif] text-[12px] font-medium text-[#727d83]">
                                {secondary}
                              </p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            disabled={isAssigned || assignTaskMutation.isPending}
                            onClick={() => handleAssign(m.userId)}
                            className={cn(
                              "inline-flex min-w-[88px] shrink-0 items-center justify-center gap-2 rounded-[8px] border-0 px-4 py-2 font-['Satoshi',sans-serif] text-[14px] font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-[#24b5f8]/50 disabled:cursor-not-allowed disabled:opacity-50",
                            )}
                            style={{ backgroundImage: assignButtonGradient }}
                          >
                            {isAssigned ? "Assigned" : "Assign"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
