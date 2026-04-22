"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, X } from "lucide-react";

import { useProjectMembers, useSetTaskAssignees } from "@/api/hooks";
import type { Member } from "@/types/member";

import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
} from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";

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
  /** All user ids currently assigned to the task. */
  currentAssigneeIds: number[];
};

export function AssignMemberModal({
  open,
  onOpenChange,
  projectId,
  taskId,
  currentAssigneeIds,
}: AssignMemberModalProps) {
  const [search, setSearch] = useState("");

  const membersQuery = useProjectMembers(projectId, {
    enabled: !!projectId && open,
  });
  const setAssigneesMutation = useSetTaskAssignees();

  const members = useMemo(
    () => membersQuery.data ?? [],
    [membersQuery.data],
  );

  const assigneeSet = useMemo(
    () => new Set(currentAssigneeIds.filter((id) => Number.isFinite(id))),
    [currentAssigneeIds],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [members, search]);

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aAs = assigneeSet.has(a.userId) ? 0 : 1;
      const bAs = assigneeSet.has(b.userId) ? 0 : 1;
      if (aAs !== bAs) return aAs - bAs;
      return memberDisplayLines(a).primary.localeCompare(memberDisplayLines(b).primary);
    });
  }, [filtered, assigneeSet]);

  const applyUserIds = (next: Set<number>) => {
    if (!taskId) return;
    setAssigneesMutation.mutate({
      taskId,
      userIds: [...next].sort((a, b) => a - b),
    });
  };

  const toggleMember = (userId: number, checked: boolean) => {
    const next = new Set(assigneeSet);
    if (checked) next.add(userId);
    else next.delete(userId);
    applyUserIds(next);
  };

  const handleUnassignOne = (userId: number) => {
    const next = new Set(assigneeSet);
    next.delete(userId);
    applyUserIds(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 flex max-h-[min(92vh,900px)] w-[calc(100%-2rem)] max-w-[600px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-border bg-background text-foreground shadow-lg duration-200",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Assign members</DialogPrimitive.Title>

          <div className="relative z-[3] flex w-full shrink-0 items-center justify-between border-b border-border bg-muted/40 px-6 py-4 sm:px-9">
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-foreground"
                aria-label="Back"
              >
                <ArrowLeft className="size-5" strokeWidth={2} />
              </button>
            </DialogClose>
            <p className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-medium text-base tracking-tight text-muted-foreground">
              Assign members
            </p>
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex size-[27px] shrink-0 items-center justify-center rounded-md border-0 bg-transparent p-0 text-foreground"
                aria-label="Close"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </DialogClose>
          </div>

          <div className="z-[2] min-h-0 flex-1 overflow-x-clip overflow-y-auto bg-background px-6 py-6 sm:px-9">
            <div className="flex w-full flex-col gap-6 pb-6">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search members"
                  className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-base font-medium text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </div>

              <div className="flex w-full flex-col gap-2">
                <p className="text-base font-medium text-foreground">
                  Project members
                </p>

                {membersQuery.isLoading ? (
                  <div className="flex flex-col gap-4 py-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex w-full items-center gap-2 pr-2">
                        <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
                        <div className="min-w-0 flex-1 space-y-2 py-1">
                          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                          <div className="h-3 w-56 animate-pulse rounded bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : membersQuery.isError ? (
                  <p className="text-sm font-medium text-destructive">
                    Couldn&apos;t load members. Try again.
                  </p>
                ) : sortedFiltered.length === 0 ? (
                  <p className="text-sm font-medium text-muted-foreground">
                    {search.trim() ? "No members match your search." : "No members in this project."}
                  </p>
                ) : (
                  <ul className="flex w-full flex-col gap-3" aria-busy={setAssigneesMutation.isPending}>
                    {sortedFiltered.map((m) => {
                      const { primary, secondary } = memberDisplayLines(m);
                      const bg = AVATAR_BGS[m.id % AVATAR_BGS.length];
                      const isAssigned = assigneeSet.has(m.userId);
                      const rowId = `assign-member-${m.id}`;
                      return (
                        <li
                          key={m.id}
                          className={cn(
                            "flex w-full flex-wrap items-center gap-3 overflow-hidden rounded-lg border px-3 py-2.5 sm:flex-nowrap",
                            isAssigned ? "border-primary/30 bg-primary/5" : "border-border bg-card",
                          )}
                        >
                          <div
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-full border border-background text-xs font-medium text-white",
                              bg,
                            )}
                            aria-hidden
                          >
                            {m.initials}
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <p className="truncate text-base font-medium text-foreground" id={`${rowId}-label`}>
                                {primary}
                              </p>
                              {isAssigned ? (
                                <Badge variant="secondary" className="shrink-0 text-[10px] uppercase tracking-wide">
                                  Assigned
                                </Badge>
                              ) : null}
                            </div>
                            {secondary ? (
                              <p className="truncate text-xs font-medium text-muted-foreground">
                                {secondary}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
                            <Checkbox
                              id={rowId}
                              checked={isAssigned}
                              disabled={setAssigneesMutation.isPending || !taskId}
                              onCheckedChange={(v) => toggleMember(m.userId, v === true)}
                              aria-labelledby={`${rowId}-label`}
                            />
                            {isAssigned ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 shrink-0 px-2 text-muted-foreground hover:text-foreground"
                                disabled={setAssigneesMutation.isPending || !taskId}
                                onClick={() => handleUnassignOne(m.userId)}
                              >
                                Unassign
                              </Button>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
