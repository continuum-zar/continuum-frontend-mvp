import type { AgentRunEvent } from "@/types/agentRun";
import type { ReviewPhase, ReviewRunEvent } from "@/types/reviewRun";

import type { LoaderStep, LoaderStepState } from "./ui/multi-step-loader";

/**
 * Translates the raw agent / review event streams into the friendly,
 * human-readable steps shown in the multi-step loader. The goal is to surface
 * *what the AI is doing* — not the terminal noise (shell stdout, raw tool args,
 * tool results) which we deliberately drop here.
 */

const BUILD_PHASE_LABEL: Record<string, string> = {
  started: "Starting up",
  fetching_github_token: "Connecting to GitHub",
  cloning_repo: "Cloning the repository",
  workspace_ready: "Workspace ready",
  agent_loop_started: "Reading the task",
  codex_plan: "Planning the work",
  completed: "Done",
};

/** First meaningful line of a longer block of text, trimmed for a step label. */
function firstLine(text: string, max = 110): string {
  const cleaned = text
    .replace(/[`*_#>]/g, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!cleaned) return "";
  return cleaned.length > max ? `${cleaned.slice(0, max - 1).trimEnd()}…` : cleaned;
}

/** Pull file names out of an apply_patch args preview (best-effort). */
function patchSummary(args: unknown): string {
  if (typeof args !== "string") return "Editing files";
  // args is a (truncated) preview — could be JSON list or a path-ish string.
  try {
    const parsed = JSON.parse(args);
    const files = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.files)
        ? parsed.files
        : Array.isArray(parsed?.paths)
          ? parsed.paths
          : null;
    if (files && files.length) {
      const names = files
        .map((f: unknown) =>
          typeof f === "string" ? f : (f as { path?: string })?.path ?? "",
        )
        .filter(Boolean);
      if (names.length === 1) return `Editing ${names[0]}`;
      if (names.length > 1) return `Editing ${names.length} files`;
    }
  } catch {
    // not JSON — fall through
  }
  const trimmed = args.trim();
  return trimmed ? `Editing ${firstLine(trimmed, 80)}` : "Editing files";
}

/** Friendly label for a tool call. `null` means "don't surface this event". */
function buildEventLabel(ev: AgentRunEvent): string | null {
  switch (ev.kind) {
    case "status": {
      const phase = String(ev.payload.phase ?? "");
      return BUILD_PHASE_LABEL[phase] ?? `Working: ${phase || "update"}`;
    }
    case "thinking": {
      const text = firstLine(String(ev.payload.text ?? ""));
      return text || "Thinking through the next step";
    }
    case "tool_call": {
      const name = String(ev.payload.name ?? "tool");
      if (name === "shell") {
        const cmd = firstLine(String(ev.payload.args ?? ""), 90);
        return cmd ? `Running ${cmd}` : "Running a command";
      }
      if (name === "apply_patch") return patchSummary(ev.payload.args);
      return `Using ${name}`;
    }
    case "commit":
      return "Committing changes";
    case "final_message":
      return "Wrapping up";
    case "error":
      return `Error: ${firstLine(
        String(ev.payload.error ?? ev.payload.message ?? "something went wrong"),
      )}`;
    case "cancelled":
      return "Run cancelled";
    // Deliberately hidden — terminal/raw output the user doesn't want to see.
    case "tool_result":
    case "shell_stdout":
    default:
      return null;
  }
}

function stepState(
  isLast: boolean,
  isActive: boolean,
  isError: boolean,
): LoaderStepState {
  if (isError) return "error";
  if (isLast && isActive) return "active";
  return "done";
}

export function deriveBuildSteps(
  events: AgentRunEvent[],
  isActive: boolean,
): LoaderStep[] {
  const labelled = events
    .map((ev, i) => {
      const text = buildEventLabel(ev);
      if (text == null) return null;
      return {
        id: `${ev.seq}-${ev.kind}-${i}`,
        text,
        isError: ev.kind === "error" || ev.kind === "cancelled",
      };
    })
    .filter((s): s is { id: string; text: string; isError: boolean } => s != null);

  return labelled.map((s, i) => ({
    id: s.id,
    text: s.text,
    state: stepState(i === labelled.length - 1, isActive, s.isError),
  }));
}

// ---------------------------------------------------------------------------
// Review steps
// ---------------------------------------------------------------------------

const REVIEW_PHASE_LABEL: Record<ReviewPhase, string> = {
  started: "Starting the review",
  minting_token: "Connecting to GitHub",
  fetching_diff: "Fetching the diff",
  diff_loaded: "Reading the changes",
  calling_llm: "Analysing against the task requirements",
  verdict_received: "Forming a verdict",
  posting_comment: "Posting the review",
  completed: "Done",
};

function reviewEventLabel(ev: ReviewRunEvent): string | null {
  const payload = (ev.payload ?? {}) as Record<string, unknown>;

  if (ev.kind === "error") {
    const msg = firstLine(String(payload.message ?? "something went wrong"));
    return `Error: ${msg}`;
  }

  if (ev.kind === "status") {
    const phase = String(payload.phase ?? "");
    const base = (REVIEW_PHASE_LABEL as Record<string, string>)[phase];
    if (!base) return phase ? `Working: ${phase}` : null;

    if (phase === "diff_loaded") {
      const files = Number(payload.file_count ?? 0);
      return `Reading the changes (${files} file${files === 1 ? "" : "s"})`;
    }
    if (phase === "verdict_received") {
      const verdict = String(payload.verdict ?? "");
      const issues = Number(payload.issue_count ?? 0);
      const v = verdict === "ready_to_merge" ? "Ready to merge" : "Issues found";
      return `${v} · ${issues} issue${issues === 1 ? "" : "s"}`;
    }
    return base;
  }

  const msg = String(payload.message ?? "");
  return msg ? firstLine(msg) : null;
}

export function deriveReviewSteps(
  events: ReviewRunEvent[],
  isActive: boolean,
): LoaderStep[] {
  const labelled = events
    .map((ev, i) => {
      const text = reviewEventLabel(ev);
      if (text == null) return null;
      return { id: `${ev.seq}-${ev.kind}-${i}`, text, isError: ev.kind === "error" };
    })
    .filter((s): s is { id: string; text: string; isError: boolean } => s != null);

  return labelled.map((s, i) => ({
    id: s.id,
    text: s.text,
    state: stepState(i === labelled.length - 1, isActive, s.isError),
  }));
}
