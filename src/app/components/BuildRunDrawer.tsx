"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  GitCommit,
  GitPullRequest,
  Loader2,
  Square,
  X,
} from "lucide-react";

import { ReviewIcon, SpinnerIcon } from "./review/icons";
import { deriveBuildSteps } from "./agentSteps";
import { MultiStepLoader, StepChecklist } from "./ui/multi-step-loader";

import {
  agentRunEventsStreamUrl,
  useAgentRun,
  useCancelAgentRun,
  useReviewRun,
  useStartReview,
} from "@/api";
import { useAuthStore } from "@/store/authStore";
import {
  isAgentRunActive,
  isAgentRunTerminal,
  type AgentEventKind,
  type AgentRunDetail,
  type AgentRunEvent,
  type AgentRunStatus,
} from "@/types/agentRun";
import {
  isReviewRunTerminal,
  type ReviewRun,
  type ReviewVerdict,
} from "@/types/reviewRun";

import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
} from "./ui/dialog";
import { PlannerAssistantMarkdown } from "./planner/PlannerAssistantMarkdown";
import { cn } from "./ui/utils";
import { useSseStream } from "@/hooks/useSseStream";

type BuildRunDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | number;
  runId: string | null;
};

const STATUS_LABEL: Record<AgentRunStatus, string> = {
  queued: "Queued",
  running: "Running",
  succeeded: "Succeeded",
  failed: "Failed",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<AgentRunStatus, string> = {
  queued: "bg-muted text-foreground",
  running: "bg-info/15 text-foreground",
  succeeded: "bg-success/15 text-foreground",
  failed: "bg-destructive/15 text-destructive",
  cancelled: "bg-warning/40 text-warning",
};

function shortSha(sha: string | null | undefined): string {
  if (!sha) return "";
  return sha.length > 8 ? sha.slice(0, 8) : sha;
}

const VERDICT_LABEL: Record<ReviewVerdict, string> = {
  ready_to_merge: "Ready to merge",
  issues_found: "Issues found",
};

const VERDICT_TONE: Record<ReviewVerdict, string> = {
  ready_to_merge: "bg-success/15 text-foreground",
  issues_found: "bg-warning/40 text-warning",
};

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

function ReviewSummary({
  review,
  pending,
}: {
  review: ReviewRun | null;
  pending: boolean;
}) {
  // Pending / running — no terminal result yet.
  if (!review || (pending && !isReviewRunTerminal(review?.status ?? "queued"))) {
    return (
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <Loader2 size={12} className="animate-spin" />
        Reviewing diff against task requirements…
      </div>
    );
  }

  if (review.status === "failed") {
    return (
      <div className="flex flex-col gap-1 text-[12px]">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle size={12} />
          <span className="font-medium">Review failed</span>
        </div>
        {review.error ? (
          <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
            {review.error}
          </p>
        ) : null}
      </div>
    );
  }

  if (review.status === "cancelled") {
    return (
      <p className="text-[12px] text-muted-foreground">Review was cancelled.</p>
    );
  }

  // Succeeded
  const issueCount = review.issues?.length ?? 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {review.verdict ? <VerdictPill verdict={review.verdict} /> : null}
        {issueCount > 0 ? (
          <span className="text-[12px] text-muted-foreground">
            {issueCount} issue{issueCount === 1 ? "" : "s"}
          </span>
        ) : null}
        {review.delivery_target === "github_pr_comment" && review.github_comment_url ? (
          <a
            href={review.github_comment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-info hover:underline"
          >
            View review on PR
            <ExternalLink size={10} aria-hidden />
          </a>
        ) : null}
        {review.delivery_target === "task_comment" && review.task_comment_id ? (
          <span className="text-[12px] text-muted-foreground">
            Posted as comment on this task
          </span>
        ) : null}
      </div>
      {review.summary ? (
        <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-foreground">
          {review.summary}
        </p>
      ) : null}
    </div>
  );
}

function StatusPill({ status }: { status: AgentRunStatus }) {
  const tone = STATUS_TONE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium",
        tone,
      )}
    >
      {status === "running" || status === "queued" ? (
        <Loader2 size={11} className="animate-spin" aria-hidden />
      ) : null}
      {STATUS_LABEL[status]}
    </span>
  );
}

export function BuildRunDrawer({
  open,
  onOpenChange,
  taskId,
  runId,
}: BuildRunDrawerProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const cancelMutation = useCancelAgentRun(taskId);

  const detailQuery = useAgentRun(taskId, runId, { enabled: open && !!runId });
  const detail: AgentRunDetail | undefined = detailQuery.data;

  // Live event stream is keyed by run id; the seq number is monotonic so we
  // can dedupe by `seq` even if the SSE replay overlaps the persisted events.
  const [liveEvents, setLiveEvents] = useState<AgentRunEvent[]>([]);

  useEffect(() => {
    setLiveEvents([]);
  }, [runId]);

  // Open the SSE stream while the modal is open and the run is non-terminal.
  const status = detail?.status;
  const shouldStream =
    open && !!runId && !!accessToken && (status == null || isAgentRunActive(status));

  useSseStream({
    enabled: shouldStream,
    resetKey: runId ?? undefined,
    getUrl: () => agentRunEventsStreamUrl(taskId, runId!),
    onEvent: (data) => {
      if (!data || typeof data !== "object" || !("seq" in (data as object))) return;
      const d = data as Record<string, unknown>;
      const ev: AgentRunEvent = {
        seq: Number(d.seq) || 0,
        kind: d.kind as AgentEventKind,
        payload: d.payload && typeof d.payload === "object" ? (d.payload as Record<string, unknown>) : {},
        created_at: typeof d.created_at === "string" ? d.created_at : new Date().toISOString(),
      };
      setLiveEvents((prev) => {
        // Dedupe by seq; keep the highest-seq view of an entry.
        const map = new Map<number, AgentRunEvent>();
        for (const x of prev) map.set(x.seq, x);
        map.set(ev.seq, ev);
        return [...map.values()].sort((a, b) => a.seq - b.seq);
      });
    },
    onDropped: () => {
      // Backpressure: we missed events. Refetch the authoritative run detail
      // (it carries the full persisted event list) to resync.
      void detailQuery.refetch();
    },
  });

  const merged: AgentRunEvent[] = useMemo(() => {
    const out = new Map<number, AgentRunEvent>();
    for (const ev of detail?.events ?? []) out.set(ev.seq, ev);
    for (const ev of liveEvents) out.set(ev.seq, ev);
    return [...out.values()].sort((a, b) => a.seq - b.seq);
  }, [detail?.events, liveEvents]);

  const handleCancel = useCallback(() => {
    if (!runId) return;
    cancelMutation.mutate(runId);
  }, [cancelMutation, runId]);

  const isTerminal = status ? isAgentRunTerminal(status) : false;
  const isActive = status ? isAgentRunActive(status) : false;

  // The AI's steps, derived from the streamed events (terminal noise dropped).
  const steps = useMemo(
    () => deriveBuildSteps(merged, isActive || status == null),
    [merged, isActive, status],
  );

  // ---- Review agent --------------------------------------------------------
  // Track the most-recently-started review for this open of the drawer; fall
  // back to whatever the backend says the latest review is.
  const [startedReviewId, setStartedReviewId] = useState<string | null>(null);
  useEffect(() => {
    setStartedReviewId(null);
  }, [runId]);

  const effectiveReviewId =
    startedReviewId ?? detail?.latest_review?.id ?? null;
  const reviewQuery = useReviewRun(taskId, effectiveReviewId, {
    enabled: open && !!effectiveReviewId,
  });
  // Prefer the freshly-polled row; fall back to the one we got in the detail
  // payload so the UI shows the verdict even before the first poll lands.
  const review: ReviewRun | null =
    reviewQuery.data ?? detail?.latest_review ?? null;
  const reviewInFlight =
    !!review && !isReviewRunTerminal(review.status);

  const startReviewMutation = useStartReview(taskId, runId ?? "");
  const handleStartReview = useCallback(() => {
    if (!runId) return;
    startReviewMutation.mutate(undefined, {
      onSuccess: (r) => setStartedReviewId(r.id),
    });
  }, [runId, startReviewMutation]);

  // Review prerequisites mirror the backend's enqueue check.
  const reviewPrereqOk = !!detail && (
    (detail.mode === "open_pr" && !!detail.pr_url) ||
    (detail.mode === "direct_push" && !!detail.commit_sha)
  );
  const canStartReview =
    !!runId &&
    isTerminal &&
    status === "succeeded" &&
    reviewPrereqOk &&
    !reviewInFlight &&
    !startReviewMutation.isPending;
  const showReviewArea = isTerminal && status === "succeeded";

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
          <DialogPrimitive.Title className="sr-only">Agent build run</DialogPrimitive.Title>

          {/* Header */}
          <div className="z-[3] flex shrink-0 items-center gap-3 border-b border-border bg-muted/40 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-foreground">
                Agent build {runId ? `· ${runId.slice(0, 8)}` : ""}
              </p>
              <p className="truncate text-[12px] text-muted-foreground">
                {detail
                  ? `${detail.linked_repo} • ${detail.linked_branch} • ${
                      detail.mode === "open_pr" ? "PR mode" : "Direct push"
                    }`
                  : "Loading…"}
              </p>
            </div>
            {status ? <StatusPill status={status} /> : null}
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </DialogClose>
          </div>

          {/* AI steps — animated multi-step loader while running, static
              checklist once the run is done. */}
          <div className="z-[2] min-h-0 flex-1 overflow-y-auto bg-background px-5 py-4">
            {detailQuery.isLoading && steps.length === 0 ? (
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                Loading run…
              </div>
            ) : steps.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
                Waiting for the agent to start…
              </div>
            ) : isActive ? (
              <div className="relative h-full w-full">
                <MultiStepLoader steps={steps} />
              </div>
            ) : (
              <StepChecklist steps={steps} />
            )}

            {detail?.error && isTerminal && status === "failed" ? (
              <div className="mt-3 rounded-[8px] border border-destructive/40 bg-destructive/10 p-3 text-[13px] text-destructive">
                <p className="font-medium">Run failed</p>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed">{detail.error}</p>
              </div>
            ) : null}

            {detail?.summary && isTerminal && status === "succeeded" && !merged.some((m) => m.kind === "final_message") ? (
              <div className="mt-3 rounded-[10px] border border-info/30 bg-info/5 p-4">
                <p className="mb-1 text-[12px] font-medium uppercase tracking-wide text-info">
                  Agent summary
                </p>
                <PlannerAssistantMarkdown content={detail.summary} />
              </div>
            ) : null}
          </div>

          {/* Review summary banner — sits between the feed and the footer
              so users see the verdict alongside the build outcome. */}
          {showReviewArea && (review || reviewInFlight || startReviewMutation.isPending) ? (
            <div className="z-[3] shrink-0 border-t border-border bg-card px-5 py-3">
              <ReviewSummary
                review={review}
                pending={reviewInFlight || startReviewMutation.isPending}
              />
            </div>
          ) : null}

          {/* Footer */}
          <div className="z-[3] flex shrink-0 items-center justify-between gap-3 border-t border-border bg-muted/40 px-5 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
              {detail?.commit_sha ? (
                <span className="inline-flex items-center gap-1">
                  <GitCommit size={12} aria-hidden />
                  {shortSha(detail.commit_sha)}
                </span>
              ) : null}
              {detail?.pr_url ? (
                <a
                  href={detail.pr_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-info hover:underline"
                >
                  <GitPullRequest size={12} aria-hidden />
                  View PR
                  <ExternalLink size={10} aria-hidden />
                </a>
              ) : null}
              {typeof detail?.iterations === "number" ? (
                <span>{detail.iterations} iters</span>
              ) : null}
              {typeof detail?.tokens_used === "number" && detail.tokens_used > 0 ? (
                <span>{detail.tokens_used.toLocaleString()} tokens</span>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {isActive ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-destructive/50 bg-card px-3 text-[13px] font-medium text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cancelMutation.isPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Square size={13} />
                  )}
                  Cancel run
                </button>
              ) : null}
              {showReviewArea ? (
                <button
                  type="button"
                  onClick={handleStartReview}
                  disabled={!canStartReview}
                  title={
                    !reviewPrereqOk
                      ? detail?.mode === "open_pr"
                        ? "No PR URL on this run."
                        : "No commit on this run."
                      : reviewInFlight
                        ? "A review is already running."
                        : undefined
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-border bg-card px-3 text-[13px] font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {reviewInFlight || startReviewMutation.isPending ? (
                    <SpinnerIcon size={13} />
                  ) : (
                    <ReviewIcon size={13} />
                  )}
                  {review && isReviewRunTerminal(review.status)
                    ? "Re-review"
                    : reviewInFlight
                      ? "Reviewing"
                      : "Review"}
                </button>
              ) : null}
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
