"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, GitBranch, GitPullRequest, Loader2, Sparkles, X } from "lucide-react";

import { useStartAgentRun } from "@/api/hooks";
import {
  getTaskLinkedBranches,
  type TaskAPIResponse,
  type TaskLinkedBranch,
} from "@/types/task";
import type { AgentRun, AgentRunMode } from "@/types/agentRun";

import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
} from "./ui/dialog";
import { cn } from "./ui/utils";

type BuildTaskModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | number;
  task: TaskAPIResponse;
  /** Called once a run has been successfully created. */
  onRunStarted: (run: AgentRun) => void;
};

/** Display label for a single (repo, branch) pair. */
function branchLabel(b: TaskLinkedBranch): string {
  return `${b.linked_repo} • ${b.linked_branch}`;
}

function isCompleteBranch(b: TaskLinkedBranch): boolean {
  return Boolean(
    b &&
      typeof b.linked_repo === "string" &&
      b.linked_repo.trim() &&
      typeof b.linked_branch === "string" &&
      b.linked_branch.trim(),
  );
}

export function BuildTaskModal({
  open,
  onOpenChange,
  taskId,
  task,
  onRunStarted,
}: BuildTaskModalProps) {
  const branches = useMemo<TaskLinkedBranch[]>(
    () => getTaskLinkedBranches(task).filter(isCompleteBranch),
    [task],
  );

  const [selectedKey, setSelectedKey] = useState<string>(() =>
    branches.length > 0 ? `${branches[0]!.linked_repo}::${branches[0]!.linked_branch}` : "",
  );
  const [mode, setMode] = useState<AgentRunMode>("open_pr");
  const [instructions, setInstructions] = useState("");

  // Re-pick the first branch when the modal is reopened or branches change.
  useEffect(() => {
    if (!open) return;
    if (branches.length === 0) {
      setSelectedKey("");
      return;
    }
    setSelectedKey((prev) => {
      const stillThere = branches.some(
        (b) => `${b.linked_repo}::${b.linked_branch}` === prev,
      );
      return stillThere ? prev : `${branches[0]!.linked_repo}::${branches[0]!.linked_branch}`;
    });
  }, [open, branches]);

  const startMutation = useStartAgentRun(taskId);
  const isPending = startMutation.isPending;

  const selected = useMemo(
    () =>
      branches.find(
        (b) => `${b.linked_repo}::${b.linked_branch}` === selectedKey,
      ) ?? null,
    [branches, selectedKey],
  );

  const canSubmit = !isPending && !!selected;

  const handleSubmit = async () => {
    if (!selected) return;
    try {
      const run = await startMutation.mutateAsync({
        linked_repo: selected.linked_repo,
        linked_branch: selected.linked_branch,
        mode,
        instructions: instructions.trim() || null,
      });
      setInstructions("");
      onOpenChange(false);
      onRunStarted(run);
    } catch {
      // toast already shown by useStartAgentRun.onError
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-1/2 top-1/2 z-50 flex max-h-[min(92vh,800px)] w-[calc(100%-2rem)] max-w-[640px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-border bg-background text-foreground shadow-lg duration-200",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Build task with the agent</DialogPrimitive.Title>

          {/* Header */}
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
            <p className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-base font-medium tracking-tight text-muted-foreground">
              Build task with agent
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

          {/* Body */}
          <div className="z-[2] min-h-0 flex-1 overflow-x-clip overflow-y-auto bg-background px-6 py-6 sm:px-9">
            <div className="flex flex-col gap-6">
              <p className="text-[14px] leading-relaxed text-[#606d76]">
                The Continuum agent will clone the repo, work on the linked branch, and stream
                its activity here. Configure the run before kicking it off.
              </p>

              {/* --- Branch picker --- */}
              <section className="flex flex-col gap-2">
                <label
                  htmlFor="build-branch"
                  className="text-[13px] font-medium text-[#0b191f]"
                >
                  Target repository &amp; branch
                </label>
                {branches.length === 0 ? (
                  <p className="rounded-[8px] border border-dashed border-[#e9e9e9] bg-[#f9fafb] p-3 text-[13px] leading-snug text-[#727d83]">
                    Link at least one repository and branch under <em>Development</em> on the
                    task before starting a build.
                  </p>
                ) : (
                  <div className="relative">
                    <GitBranch
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#727d83]"
                      aria-hidden
                    />
                    <select
                      id="build-branch"
                      value={selectedKey}
                      onChange={(e) => setSelectedKey(e.target.value)}
                      disabled={isPending}
                      className="h-[46px] w-full appearance-none rounded-[8px] border border-[#e9e9e9] bg-white pl-9 pr-4 text-[14px] font-medium text-[#0b191f] outline-none focus-visible:ring-2 focus-visible:ring-[#24B5F8]/40 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {branches.map((b) => {
                        const key = `${b.linked_repo}::${b.linked_branch}`;
                        return (
                          <option key={key} value={key}>
                            {branchLabel(b)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
                {branches.length > 1 ? (
                  <p className="text-[12px] text-[#727d83]">
                    This task has multiple linked branches. The agent only targets one per run.
                  </p>
                ) : null}
              </section>

              {/* --- Commit mode --- */}
              <section className="flex flex-col gap-2">
                <span className="text-[13px] font-medium text-[#0b191f]">
                  How should the agent land changes?
                </span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setMode("open_pr")}
                    disabled={isPending}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-[10px] border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                      mode === "open_pr"
                        ? "border-[#24B5F8] bg-[#24B5F8]/5"
                        : "border-[#e9e9e9] bg-white hover:border-[#24B5F8]/50",
                    )}
                  >
                    <span className="flex items-center gap-2 text-[14px] font-medium text-[#0b191f]">
                      <GitPullRequest size={16} aria-hidden />
                      Open a pull request
                    </span>
                    <span className="text-[12px] leading-snug text-[#727d83]">
                      Safer. Commits to a fresh branch and opens a PR back into the linked branch
                      so a human can review.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("direct_push")}
                    disabled={isPending}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-[10px] border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                      mode === "direct_push"
                        ? "border-[#24B5F8] bg-[#24B5F8]/5"
                        : "border-[#e9e9e9] bg-white hover:border-[#24B5F8]/50",
                    )}
                  >
                    <span className="flex items-center gap-2 text-[14px] font-medium text-[#0b191f]">
                      <GitBranch size={16} aria-hidden />
                      Push directly to the branch
                    </span>
                    <span className="text-[12px] leading-snug text-[#727d83]">
                      Commits land directly on{" "}
                      <code className="font-mono text-[12px]">{selected?.linked_branch ?? "the linked branch"}</code>.
                      No review gate.
                    </span>
                  </button>
                </div>
              </section>

              {/* --- Instructions --- */}
              <section className="flex flex-col gap-2">
                <label
                  htmlFor="build-instructions"
                  className="text-[13px] font-medium text-[#0b191f]"
                >
                  Anything specific the agent should focus on?{" "}
                  <span className="text-[12px] font-normal text-[#727d83]">(optional)</span>
                </label>
                <textarea
                  id="build-instructions"
                  rows={4}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value.slice(0, 4000))}
                  placeholder="e.g. Stick to TypeScript files. Don't touch the migrations folder. Run `pnpm test` before committing."
                  disabled={isPending}
                  className="w-full resize-none rounded-[8px] border border-[#e9e9e9] bg-white p-3 text-[14px] leading-relaxed text-[#0b191f] outline-none focus-visible:ring-2 focus-visible:ring-[#24B5F8]/40 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <p className="text-[12px] text-[#727d83]">
                  The task title, description, checklist, and recent comments are already passed
                  to the agent — only add extra context here.
                </p>
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="z-[3] flex w-full shrink-0 items-center justify-end gap-3 border-t border-border bg-muted/40 px-6 py-4 sm:px-9">
            <DialogClose asChild>
              <button
                type="button"
                disabled={isPending}
                className="h-11 rounded-[10px] border border-[#ebedee] bg-white px-5 text-[14px] font-medium text-[#0b191f] hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </DialogClose>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] px-5 text-[14px] font-medium text-white transition-colors",
                canSubmit
                  ? "bg-[#24B5F8] hover:bg-[#1da8ea]"
                  : "cursor-not-allowed bg-[#9ed6f1]",
              )}
            >
              {isPending ? (
                <Loader2 size={16} className="animate-spin" aria-hidden />
              ) : (
                <Sparkles size={16} aria-hidden />
              )}
              {isPending ? "Queuing build…" : "Start build"}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
