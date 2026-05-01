"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  CircleDot,
  ExternalLink,
  GitCommit,
  GitPullRequest,
  Loader2,
  Square,
  Terminal,
  X,
} from "lucide-react";

import {
  agentRunEventsStreamUrl,
  useAgentRun,
  useCancelAgentRun,
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
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
} from "./ui/dialog";
import { PlannerAssistantMarkdown } from "./planner/PlannerAssistantMarkdown";
import { cn } from "./ui/utils";

type BuildRunDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | number;
  runId: string | null;
};

interface MergedEvent extends AgentRunEvent {
  /** Stable react key (fallback for events that don't yet have a seq from the server). */
  _key: string;
}

const STATUS_LABEL: Record<AgentRunStatus, string> = {
  queued: "Queued",
  running: "Running",
  succeeded: "Succeeded",
  failed: "Failed",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<AgentRunStatus, string> = {
  queued: "bg-[#f0f3f5] text-[#0b191f]",
  running: "bg-[#24B5F8]/15 text-[#0b191f]",
  succeeded: "bg-[#10b981]/15 text-[#065f46]",
  failed: "bg-[#f87171]/15 text-[#991b1b]",
  cancelled: "bg-[#fde68a]/40 text-[#92400e]",
};

const PHASE_LABEL: Record<string, string> = {
  started: "Started",
  fetching_github_token: "Fetching GitHub token",
  cloning_repo: "Cloning repository",
  workspace_ready: "Workspace ready",
  agent_loop_started: "Agent loop started",
  completed: "Completed",
};

function shortSha(sha: string | null | undefined): string {
  if (!sha) return "";
  return sha.length > 8 ? sha.slice(0, 8) : sha;
}

function eventKey(ev: AgentRunEvent): string {
  return `seq-${ev.seq}-${ev.kind}-${ev.created_at}`;
}

/** Pretty-printed args for the activity feed (already truncated server-side). */
function formatArgs(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function EventCard({ ev }: { ev: MergedEvent }) {
  const [expanded, setExpanded] = useState(false);

  const renderHeader = (icon: React.ReactNode, label: string, subtitle?: string) => (
    <div className="min-w-0 flex flex-1 items-start gap-2">
      <div className="mt-0.5 shrink-0 text-[#606d76]">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-[#0b191f]">{label}</p>
        {subtitle ? (
          <p className="truncate text-[12px] text-[#727d83]">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );

  const expandable = (extra: React.ReactNode) => (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-[6px] border border-transparent px-2 py-1 text-[11px] font-medium text-[#606d76] hover:border-[#e9e9e9] hover:text-[#0b191f]"
      aria-label={expanded ? "Collapse" : "Expand"}
    >
      {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      {extra}
    </button>
  );

  switch (ev.kind) {
    case "status": {
      const phase = String(ev.payload.phase ?? "");
      const label = PHASE_LABEL[phase] ?? `Status: ${phase || "update"}`;
      const repo = ev.payload.repo as string | undefined;
      const branch = ev.payload.branch as string | undefined;
      const subtitle = repo && branch ? `${repo} • ${branch}` : undefined;
      return (
        <div className="flex items-start gap-2 rounded-[8px] border border-[#e9e9e9] bg-[#f9fafb] px-3 py-2">
          {renderHeader(<CircleDot size={14} />, label, subtitle)}
        </div>
      );
    }
    case "thinking": {
      const step = ev.payload.step ?? "?";
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-[#727d83]">
          <Loader2 size={12} className="animate-spin" />
          Thinking… (step {String(step)})
        </div>
      );
    }
    case "tool_call": {
      const name = String(ev.payload.name ?? "tool");
      const args = formatArgs(ev.payload.args);
      const compact = args.length > 80;
      return (
        <div className="min-w-0 rounded-[8px] border border-[#e9e9e9] bg-white px-3 py-2">
          <div className="min-w-0 flex items-start gap-2">
            {renderHeader(
              <Terminal size={14} />,
              `Tool: ${name}`,
              compact ? "args (click to expand)" : args,
            )}
            {compact ? expandable("args") : null}
          </div>
          {expanded && compact ? (
            <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-[6px] bg-[#0b191f] p-3 font-mono text-[11px] leading-relaxed text-[#e8eef2]">
              {args}
            </pre>
          ) : null}
        </div>
      );
    }
    case "tool_result": {
      const name = String(ev.payload.name ?? "tool");
      const preview = String(ev.payload.result_preview ?? "");
      const compact = preview.length > 200;
      return (
        <div className="min-w-0 rounded-[8px] border border-[#e9e9e9] bg-white px-3 py-2">
          <div className="min-w-0 flex items-start gap-2">
            {renderHeader(
              <Terminal size={14} className="text-[#10b981]" />,
              `${name} → result`,
              compact ? `${preview.slice(0, 200)}…` : preview,
            )}
            {compact ? expandable("output") : null}
          </div>
          {expanded && compact ? (
            <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-[6px] bg-[#0b191f] p-3 font-mono text-[11px] leading-relaxed text-[#e8eef2]">
              {preview}
            </pre>
          ) : null}
        </div>
      );
    }
    case "shell_stdout": {
      const chunk = String(ev.payload.chunk ?? "");
      return (
        <pre className="overflow-auto rounded-[8px] border border-[#1f2933] bg-[#0b191f] px-3 py-2 font-mono text-[11px] leading-relaxed text-[#e8eef2]">
          {chunk}
        </pre>
      );
    }
    case "commit": {
      const sha = ev.payload.commit_sha as string | null | undefined;
      const branch = ev.payload.branch as string | undefined;
      const prUrl = ev.payload.pr_url as string | null | undefined;
      const message = ev.payload.message as string | undefined;
      return (
        <div className="rounded-[8px] border border-[#10b981]/30 bg-[#10b981]/5 px-3 py-2">
          <div className="flex items-start gap-2">
            {renderHeader(
              <GitCommit size={14} className="text-[#065f46]" />,
              `Commit ${shortSha(sha) || "(pending)"} on ${branch ?? "branch"}`,
              message,
            )}
          </div>
          {prUrl ? (
            <a
              href={prUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-[#0369a1] hover:underline"
            >
              <GitPullRequest size={12} aria-hidden />
              View pull request
              <ExternalLink size={10} aria-hidden />
            </a>
          ) : null}
        </div>
      );
    }
    case "final_message": {
      const text = String(ev.payload.text ?? "");
      return (
        <div className="rounded-[10px] border border-[#24B5F8]/30 bg-[#24B5F8]/5 px-4 py-3">
          <p className="mb-1 text-[12px] font-medium uppercase tracking-wide text-[#0369a1]">
            Agent summary
          </p>
          <PlannerAssistantMarkdown content={text} />
        </div>
      );
    }
    case "error": {
      const error = String(ev.payload.error ?? ev.payload.message ?? "Unknown error");
      const where = String(ev.payload.where ?? "");
      return (
        <div className="rounded-[8px] border border-[#f87171]/40 bg-[#f87171]/10 px-3 py-2">
          {renderHeader(
            <AlertCircle size={14} className="text-[#991b1b]" />,
            where ? `Error in ${where}` : "Error",
            error,
          )}
        </div>
      );
    }
    case "cancelled": {
      return (
        <div className="rounded-[8px] border border-[#fbbf24]/40 bg-[#fde68a]/30 px-3 py-2">
          {renderHeader(<Square size={14} className="text-[#92400e]" />, "Cancelled")}
        </div>
      );
    }
    default:
      return (
        <div className="rounded-[8px] border border-[#e9e9e9] bg-white px-3 py-2 text-[12px] text-[#606d76]">
          {String(ev.kind)}
        </div>
      );
  }
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

  useEffect(() => {
    if (!shouldStream || !runId) return;
    const url = agentRunEventsStreamUrl(taskId, runId, accessToken!);
    const es = new EventSource(url);

    const handleMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (typeof data === "object" && data && "seq" in data) {
          const ev: AgentRunEvent = {
            seq: Number(data.seq) || 0,
            kind: data.kind as AgentEventKind,
            payload: data.payload && typeof data.payload === "object" ? (data.payload as Record<string, unknown>) : {},
            created_at:
              typeof data.created_at === "string"
                ? data.created_at
                : new Date().toISOString(),
          };
          setLiveEvents((prev) => {
            // Dedupe by seq; keep the highest-seq view of an entry.
            const map = new Map<number, AgentRunEvent>();
            for (const x of prev) map.set(x.seq, x);
            map.set(ev.seq, ev);
            return [...map.values()].sort((a, b) => a.seq - b.seq);
          });
        }
      } catch {
        // ignore non-JSON keepalives etc.
      }
    };

    es.addEventListener("message", handleMessage as EventListener);
    es.onerror = () => {
      // Network blip / page navigation. The browser closes the stream and
      // we'll re-open when the modal re-mounts. Avoid noisy logging.
      es.close();
    };

    return () => {
      es.removeEventListener("message", handleMessage as EventListener);
      es.close();
    };
  }, [shouldStream, runId, taskId, accessToken]);

  const merged: MergedEvent[] = useMemo(() => {
    const out = new Map<number, AgentRunEvent>();
    for (const ev of detail?.events ?? []) out.set(ev.seq, ev);
    for (const ev of liveEvents) out.set(ev.seq, ev);
    return [...out.values()]
      .sort((a, b) => a.seq - b.seq)
      .map((ev) => ({ ...ev, _key: eventKey(ev) }));
  }, [detail?.events, liveEvents]);

  const feedRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [merged.length]);

  const handleCancel = useCallback(() => {
    if (!runId) return;
    cancelMutation.mutate(runId);
  }, [cancelMutation, runId]);

  const isTerminal = status ? isAgentRunTerminal(status) : false;
  const isActive = status ? isAgentRunActive(status) : false;

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
              <p className="truncate text-[14px] font-medium text-[#0b191f]">
                Agent build {runId ? `· ${runId.slice(0, 8)}` : ""}
              </p>
              <p className="truncate text-[12px] text-[#727d83]">
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
                className="inline-flex size-8 items-center justify-center rounded-md text-[#606d76] hover:bg-[#f0f3f5] hover:text-[#0b191f]"
                aria-label="Close"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </DialogClose>
          </div>

          {/* Activity feed */}
          <div ref={feedRef} className="z-[2] min-h-0 flex-1 overflow-y-auto bg-background px-5 py-4">
            {detailQuery.isLoading && merged.length === 0 ? (
              <div className="flex items-center gap-2 text-[13px] text-[#727d83]">
                <Loader2 size={14} className="animate-spin" />
                Loading run…
              </div>
            ) : merged.length === 0 ? (
              <p className="text-[13px] text-[#727d83]">
                Waiting for the agent to start…
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {merged.map((ev) => (
                  <li key={ev._key} className="min-w-0">
                    <EventCard ev={ev} />
                  </li>
                ))}
              </ul>
            )}

            {detail?.error && isTerminal && status === "failed" ? (
              <div className="mt-3 rounded-[8px] border border-[#f87171]/40 bg-[#f87171]/10 p-3 text-[13px] text-[#991b1b]">
                <p className="font-medium">Run failed</p>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed">{detail.error}</p>
              </div>
            ) : null}

            {detail?.summary && isTerminal && status === "succeeded" && !merged.some((m) => m.kind === "final_message") ? (
              <div className="mt-3 rounded-[10px] border border-[#24B5F8]/30 bg-[#24B5F8]/5 p-4">
                <p className="mb-1 text-[12px] font-medium uppercase tracking-wide text-[#0369a1]">
                  Agent summary
                </p>
                <PlannerAssistantMarkdown content={detail.summary} />
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="z-[3] flex shrink-0 items-center justify-between gap-3 border-t border-border bg-muted/40 px-5 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-3 text-[12px] text-[#727d83]">
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
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#0369a1] hover:underline"
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
                  className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#f87171]/50 bg-white px-3 text-[13px] font-medium text-[#991b1b] hover:bg-[#fef2f2] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cancelMutation.isPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Square size={13} />
                  )}
                  Cancel run
                </button>
              ) : null}
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
