"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useMemo } from "react";

import { useReviewRun } from "@/api";
import {
  isReviewRunActive,
  isReviewRunTerminal,
  type ReviewRunDetail,
  type ReviewRunStatus,
  type ReviewVerdict,
} from "@/types/reviewRun";

import { deriveReviewSteps } from "./agentSteps";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  CloseIcon,
  CommentIcon,
  ExternalLinkIcon,
  PullRequestIcon,
  SpinnerIcon,
} from "./review/icons";
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
} from "./ui/dialog";
import { MultiStepLoader, StepChecklist } from "./ui/multi-step-loader";
import { BouncingDots } from "./ui/bouncing-dots";
import { cn } from "./ui/utils";
import { sanitizeDisplayText } from "@/lib/errorMessages";

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
  queued: "bg-muted text-foreground",
  running: "bg-muted text-foreground",
  succeeded: "bg-[var(--success)]/10 text-[var(--success)]",
  failed: "bg-[var(--destructive)]/10 text-[var(--destructive)]",
  cancelled: "bg-[var(--warning)]/10 text-[var(--warning)]",
};

const VERDICT_LABEL: Record<ReviewVerdict, string> = {
  ready_to_merge: "Ready to merge",
  issues_found: "Issues found",
};

const VERDICT_TONE: Record<ReviewVerdict, string> = {
  ready_to_merge: "bg-[var(--success)]/10 text-[var(--success)]",
  issues_found: "bg-[var(--warning)]/10 text-[var(--warning)]",
};

function StatusPill({ status }: { status: ReviewRunStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium",
        STATUS_TONE[status],
      )}
    >
      {STATUS_LABEL[status]}
      {isReviewRunActive(status) ? <BouncingDots /> : null}
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
        <CheckCircleIcon size={11} />
      ) : (
        <AlertCircleIcon size={11} />
      )}
      {VERDICT_LABEL[verdict]}
    </span>
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
  const isActive = status ? isReviewRunActive(status) : false;
  const issueCount = review?.issues?.length ?? 0;

  // The reviewer's steps, derived from the streamed events.
  const steps = useMemo(
    () => deriveReviewSteps(review?.events ?? [], isActive || status == null),
    [review?.events, isActive, status],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/25" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-2 data-[state=open]:slide-in-from-bottom-2 fixed bottom-6 right-6 left-auto top-auto z-50 flex h-[537px] max-h-[min(537px,calc(100vh-32px))] w-[min(395px,calc(100vw-32px))] max-w-[395px] flex-col overflow-hidden rounded-[19px] border border-solid border-[#edecea] bg-white text-foreground shadow-[0px_86px_24px_0px_rgba(11,25,31,0),0px_55px_22px_0px_rgba(11,25,31,0.01),0px_31px_19px_0px_rgba(11,25,31,0.03),0px_14px_14px_0px_rgba(11,25,31,0.04),0px_3px_8px_0px_rgba(11,25,31,0.05)] outline-none duration-200",
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Continuum review
          </DialogPrimitive.Title>

          {/* Header */}
          <div className="z-[3] flex shrink-0 items-center gap-3 border-b border-border bg-muted/40 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-foreground">
                Continuum review {reviewId ? `· ${reviewId.slice(0, 8)}` : ""}
              </p>
              <p className="truncate text-[12px] text-muted-foreground">
                {review
                  ? `Build ${review.build_run_id.slice(0, 8)} · ${
                      review.delivery_target === "github_pr_comment"
                        ? "Posts to PR"
                        : "Posts to task"
                    }`
                  : "Loading"}
              </p>
            </div>
            {status ? <StatusPill status={status} /> : null}
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <CloseIcon size={16} />
              </button>
            </DialogClose>
          </div>

          {/* Steps — animated multi-step loader while reviewing, static
              checklist once the review is done. */}
          <div className="z-[1] min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {reviewQuery.isLoading && !review ? (
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <SpinnerIcon size={14} />
                Loading review
              </div>
            ) : steps.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
                Waiting for the reviewer to start
              </div>
            ) : isActive ? (
              <div className="relative h-full w-full">
                <MultiStepLoader steps={steps} />
              </div>
            ) : (
              <StepChecklist steps={steps} />
            )}

            {/* Terminal extras */}
            {isTerminal && review?.status === "succeeded" && review.summary ? (
              <div className="mt-4 rounded-[10px] border border-border bg-muted/40 p-4">
                <p className="mb-1 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                  Review summary
                </p>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
                  {review.summary}
                </p>
              </div>
            ) : null}

            {isTerminal && review?.status === "succeeded" && issueCount > 0 ? (
              <div className="mt-4">
                <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                  Issues ({issueCount})
                </p>
                <ul className="flex flex-col gap-2">
                  {review.issues.map((i, idx) => (
                    <li
                      key={`${i.title}-${idx}`}
                      className="rounded-[8px] border border-border bg-card px-3 py-2"
                    >
                      <div className="flex items-center gap-2 text-[12px] font-medium text-foreground">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                            i.severity === "critical"
                              ? "bg-[var(--destructive)]/15 text-[var(--destructive)]"
                              : i.severity === "major"
                                ? "bg-[var(--warning)]/15 text-[var(--warning)]"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {i.severity}
                        </span>
                        <span>{i.title}</span>
                        {i.file ? (
                          <span className="ml-auto truncate text-[11px] font-normal text-muted-foreground">
                            {i.file}
                            {i.line ? `:${i.line}` : ""}
                          </span>
                        ) : null}
                      </div>
                      {i.detail ? (
                        <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-muted-foreground">
                          {i.detail}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {isTerminal && review?.status === "failed" && review.error ? (
              <div className="mt-4 rounded-[8px] border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 p-3 text-[13px] text-[var(--destructive)]">
                <p className="font-medium">Review failed</p>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                  {sanitizeDisplayText(review.error, "The review failed. Please try again.")}
                </p>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="z-[3] flex shrink-0 items-center justify-between gap-3 border-t border-border bg-muted/40 px-4 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
              {review?.verdict ? <VerdictPill verdict={review.verdict} /> : null}
              {review?.github_comment_url ? (
                <a
                  href={review.github_comment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-foreground hover:underline"
                >
                  <PullRequestIcon size={12} />
                  View on PR
                  <ExternalLinkIcon size={10} />
                </a>
              ) : null}
              {review?.task_comment_id ? (
                <span className="inline-flex items-center gap-1">
                  <CommentIcon size={12} />
                  Comment posted on task
                </span>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <DialogClose asChild>
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-[8px] border border-border bg-card px-3 text-[13px] font-medium text-foreground hover:bg-muted"
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
