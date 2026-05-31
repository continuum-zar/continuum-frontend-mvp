"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  AlertCircle,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  FileSearch,
  GitPullRequest,
  Loader2,
  MessageSquareText,
  ScanSearch,
  Sparkles,
  X,
} from "lucide-react";

import { useReviewRun } from "@/api";
import {
  isReviewRunActive,
  isReviewRunTerminal,
  type ReviewPhase,
  type ReviewRunDetail,
  type ReviewRunEvent,
  type ReviewRunStatus,
  type ReviewVerdict,
} from "@/types/reviewRun";

import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
} from "./ui/dialog";
import { cn } from "./ui/utils";

type ReviewRunDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | number;
  reviewId: string | null;
};

const STATUS_LABEL: Record<ReviewRunStatus, string> = {
  queued: "Queued",
  running: "Reviewing",
  succeeded: "Done",
  failed: "Failed",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<ReviewRunStatus, string> = {
  queued: "bg-[#f0f3f5] text-[#0b191f]",
  running: "bg-[#24B5F8]/15 text-[#0b191f]",
  succeeded: "bg-[#10b981]/15 text-[#065f46]",
  failed: "bg-[#f87171]/15 text-[#991b1b]",
  cancelled: "bg-[#fde68a]/40 text-[#92400e]",
};

const PHASE_LABEL: Record<ReviewPhase, string> = {
  started: "Review started",
  minting_token: "Authenticating with GitHub",
  fetching_diff: "Fetching diff from GitHub",
  diff_loaded: "Diff loaded",
  calling_llm: "Analysing diff against task requirements…",
  verdict_received: "Verdict received",
  posting_comment: "Posting review",
  completed: "Completed",
};

const VERDICT_LABEL: Record<ReviewVerdict, string> = {
  ready_to_merge: "Ready to merge",
  issues_found: "Issues found",
};

const VERDICT_TONE: Record<ReviewVerdict, string> = {
  ready_to_merge: "bg-[#10b981]/15 text-[#065f46]",
  issues_found: "bg-[#fde68a]/40 text-[#92400e]",
};

function StatusPill({ status }: { status: ReviewRunStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium",
        STATUS_TONE[status],
      )}
    >
      {isReviewRunActive(status) ? (
        <Loader2 size={11} className="animate-spin" aria-hidden />
      ) : null}
      {STATUS_LABEL[status]}
    </span>
  );
}

function VerdictPill({ verdict }: { verdict: ReviewVerdict }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium",
        VERDICT_TONE[verdict],
      )}
    >
      {verdict === "ready_to_merge" ? (
        <CheckCircle2 size={11} aria-hidden />
      ) : (
        <AlertCircle size={11} aria-hidden />
      )}
      {VERDICT_LABEL[verdict]}
    </span>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}

function phaseIcon(phase: string) {
  switch (phase) {
    case "minting_token":
      return <Sparkles size={14} className="text-[#0369a1]" aria-hidden />;
    case "fetching_diff":
    case "diff_loaded":
      return <FileSearch size={14} className="text-[#0369a1]" aria-hidden />;
    case "calling_llm":
    case "verdict_received":
      return <ScanSearch size={14} className="text-[#0369a1]" aria-hidden />;
    case "posting_comment":
      return <MessageSquareText size={14} className="text-[#0369a1]" aria-hidden />;
    case "completed":
      return <CheckCircle2 size={14} className="text-[#065f46]" aria-hidden />;
    default:
      return <CircleDot size={14} className="text-[#727d83]" aria-hidden />;
  }
}

function renderEvent(ev: ReviewRunEvent) {
  const ts = formatTime(ev.created_at);
  const payload = (ev.payload ?? {}) as Record<string, unknown>;

  if (ev.kind === "error") {
    const where = String(payload.where ?? "");
    const msg = String(payload.message ?? "Unknown error");
    return (
      <div className="rounded-[8px] border border-[#f87171]/40 bg-[#f87171]/10 px-3 py-2">
        <div className="flex items-center gap-2 text-[12px] font-medium text-[#991b1b]">
          <AlertCircle size={13} />
          {where ? `Error in ${where}` : "Error"}
          {ts ? <span className="ml-auto font-normal text-[#727d83]">{ts}</span> : null}
        </div>
        <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-[#7f1d1d]">
          {msg}
        </p>
      </div>
    );
  }

  if (ev.kind === "status") {
    const phase = String(payload.phase ?? "");
    const label = (PHASE_LABEL as Record<string, string>)[phase] ?? phase;

    // Per-phase extra detail line.
    let detail: string | null = null;
    if (phase === "diff_loaded") {
      const files = Number(payload.file_count ?? 0);
      const truncated = !!payload.truncated;
      detail = `${files} file${files === 1 ? "" : "s"} changed${
        truncated ? " · diff truncated for review" : ""
      }`;
    } else if (phase === "verdict_received") {
      const verdict = String(payload.verdict ?? "");
      const issues = Number(payload.issue_count ?? 0);
      const v = verdict === "ready_to_merge" ? "Ready to merge" : "Issues found";
      detail = `${v} · ${issues} issue${issues === 1 ? "" : "s"}`;
    } else if (phase === "posting_comment") {
      const target = String(payload.target ?? "");
      if (target === "github_pr_comment") detail = "Posting comment on the pull request";
      else if (target === "task_comment") detail = "Posting comment on the Continuum task";
      else if (target === "task_comment_crosspost") detail = "Cross-posting to the Continuum task";
    } else if (phase === "minting_token") {
      const repo = payload.repo;
      if (typeof repo === "string") detail = repo;
    } else if (phase === "fetching_diff") {
      const repo = payload.repo;
      const mode = payload.mode;
      if (typeof repo === "string" && typeof mode === "string") {
        detail = `${repo} (${mode === "open_pr" ? "PR" : "compare"})`;
      }
    }

    return (
      <div className="rounded-[8px] border border-[#ebedee] bg-white px-3 py-2">
        <div className="flex items-center gap-2 text-[12px] font-medium text-[#0b191f]">
          {phaseIcon(phase)}
          <span>{label}</span>
          {ts ? <span className="ml-auto font-normal text-[#727d83]">{ts}</span> : null}
        </div>
        {detail ? (
          <p className="mt-0.5 pl-[22px] text-[12px] text-[#606d76]">{detail}</p>
        ) : null}
      </div>
    );
  }

  // free-form "message" — render whatever's in payload.message
  const msg = String(payload.message ?? "");
  return (
    <div className="rounded-[8px] border border-[#e9e9e9] bg-white px-3 py-2 text-[12px] text-[#606d76]">
      {msg || ev.kind}
    </div>
  );
}

export function ReviewRunDrawer({
  open,
  onOpenChange,
  taskId,
  reviewId,
}: ReviewRunDrawerProps) {
  const reviewQuery = useReviewRun(taskId, reviewId, {
    enabled: open && !!reviewId,
  });
  const review: ReviewRunDetail | undefined = reviewQuery.data;
  const status = review?.status;
  const isTerminal = status ? isReviewRunTerminal(status) : false;
  const issueCount = review?.issues?.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/30" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed right-0 top-0 z-50 flex h-full w-full max-w-[640px] flex-col overflow-hidden border-l border-border bg-background text-foreground shadow-xl duration-200",
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Continuum review
          </DialogPrimitive.Title>

          {/* Header */}
          <div className="z-[3] flex shrink-0 items-center gap-3 border-b border-border bg-muted/40 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-[#0b191f]">
                Continuum review {reviewId ? `· ${reviewId.slice(0, 8)}` : ""}
              </p>
              <p className="truncate text-[12px] text-[#727d83]">
                {review
                  ? `Build ${review.build_run_id.slice(0, 8)} · ${
                      review.delivery_target === "github_pr_comment"
                        ? "Posts to PR"
                        : "Posts to task"
                    }`
                  : "Loading…"}
              </p>
            </div>
            {status ? <StatusPill status={status} /> : null}
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-md text-[#606d76] hover:bg-[#f0f3f5] hover:text-[#0b191f]"
                aria-label="Close"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </DialogClose>
          </div>

          {/* Feed */}
          <div className="z-[1] flex-1 overflow-y-auto px-5 py-4">
            {reviewQuery.isLoading && !review ? (
              <div className="flex items-center gap-2 text-[13px] text-[#727d83]">
                <Loader2 size={14} className="animate-spin" />
                Loading review…
              </div>
            ) : !review?.events?.length ? (
              <p className="text-[13px] text-[#727d83]">
                Waiting for the reviewer to start…
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {review.events.map((ev) => (
                  <li key={`${ev.seq}`} className="min-w-0">
                    {renderEvent(ev)}
                  </li>
                ))}
              </ul>
            )}

            {/* Terminal extras */}
            {isTerminal && review?.status === "succeeded" && review.summary ? (
              <div className="mt-4 rounded-[10px] border border-[#24B5F8]/30 bg-[#24B5F8]/5 p-4">
                <p className="mb-1 text-[12px] font-medium uppercase tracking-wide text-[#0369a1]">
                  Review summary
                </p>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#0b191f]">
                  {review.summary}
                </p>
              </div>
            ) : null}

            {isTerminal && review?.status === "succeeded" && issueCount > 0 ? (
              <div className="mt-4">
                <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-[#606d76]">
                  Issues ({issueCount})
                </p>
                <ul className="flex flex-col gap-2">
                  {review.issues.map((i, idx) => (
                    <li
                      key={`${i.title}-${idx}`}
                      className="rounded-[8px] border border-[#ebedee] bg-white px-3 py-2"
                    >
                      <div className="flex items-center gap-2 text-[12px] font-medium text-[#0b191f]">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                            i.severity === "critical"
                              ? "bg-[#f87171]/20 text-[#991b1b]"
                              : i.severity === "major"
                                ? "bg-[#fbbf24]/20 text-[#92400e]"
                                : "bg-[#e0e7ef] text-[#475569]",
                          )}
                        >
                          {i.severity}
                        </span>
                        <span>{i.title}</span>
                        {i.file ? (
                          <span className="ml-auto truncate text-[11px] font-normal text-[#727d83]">
                            {i.file}
                            {i.line ? `:${i.line}` : ""}
                          </span>
                        ) : null}
                      </div>
                      {i.detail ? (
                        <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-[#3c4a52]">
                          {i.detail}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {isTerminal && review?.status === "failed" && review.error ? (
              <div className="mt-4 rounded-[8px] border border-[#f87171]/40 bg-[#f87171]/10 p-3 text-[13px] text-[#991b1b]">
                <p className="font-medium">Review failed</p>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                  {review.error}
                </p>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="z-[3] flex shrink-0 items-center justify-between gap-3 border-t border-border bg-muted/40 px-5 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-3 text-[12px] text-[#727d83]">
              {review?.verdict ? <VerdictPill verdict={review.verdict} /> : null}
              {review?.github_comment_url ? (
                <a
                  href={review.github_comment_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#0369a1] hover:underline"
                >
                  <GitPullRequest size={12} aria-hidden />
                  View on PR
                  <ExternalLink size={10} aria-hidden />
                </a>
              ) : null}
              {review?.task_comment_id ? (
                <span className="inline-flex items-center gap-1">
                  <MessageSquareText size={12} aria-hidden />
                  Comment posted on task
                </span>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <DialogClose asChild>
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-[8px] border border-[#ebedee] bg-white px-3 text-[13px] font-medium text-[#0b191f] hover:bg-[#f9fafb]"
                >
                  Close
                </button>
              </DialogClose>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
