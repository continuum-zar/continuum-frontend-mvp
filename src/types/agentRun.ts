export type AgentRunMode = 'direct_push' | 'open_pr';

export type AgentRunStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type AgentEventKind =
  | 'status'
  | 'thinking'
  | 'tool_call'
  | 'tool_result'
  | 'shell_stdout'
  | 'commit'
  | 'final_message'
  | 'error'
  | 'cancelled';

export interface AgentRunEvent {
  /** Monotonic per-run sequence; events arriving out of order should be sorted by this. */
  seq: number;
  kind: AgentEventKind;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface AgentRun {
  id: string;
  task_id: number;
  project_id: number;
  created_by: number | null;
  linked_repo: string;
  linked_branch: string;
  linked_branch_full_ref: string | null;
  mode: AgentRunMode;
  instructions: string | null;
  status: AgentRunStatus;
  started_at: string | null;
  finished_at: string | null;
  error: string | null;
  agent_branch: string | null;
  commit_sha: string | null;
  pr_url: string | null;
  summary: string | null;
  iterations: number | null;
  tokens_used: number | null;
  cost_usd: number | null;
  created_at: string;
  updated_at: string;
}

export interface AgentRunDetail extends AgentRun {
  events: AgentRunEvent[];
}

export interface AgentRunListResponse {
  runs: AgentRun[];
  total: number;
}

export interface StartAgentRunBody {
  linked_repo: string;
  linked_branch: string;
  mode: AgentRunMode;
  instructions?: string | null;
}

export const AGENT_RUN_TERMINAL_STATUSES: ReadonlySet<AgentRunStatus> = new Set([
  'succeeded',
  'failed',
  'cancelled',
]);

export function isAgentRunTerminal(status: AgentRunStatus): boolean {
  return AGENT_RUN_TERMINAL_STATUSES.has(status);
}

export function isAgentRunActive(status: AgentRunStatus): boolean {
  return status === 'queued' || status === 'running';
}
