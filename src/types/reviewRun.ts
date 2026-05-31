export type ReviewRunStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type ReviewVerdict = 'ready_to_merge' | 'issues_found';

export type ReviewDeliveryTarget = 'github_pr_comment' | 'task_comment';

export type ReviewIssueSeverity = 'critical' | 'major' | 'minor';

export interface ReviewIssue {
  severity: ReviewIssueSeverity;
  title: string;
  detail: string;
  file?: string | null;
  line?: number | null;
}

export interface ReviewRun {
  id: string;
  build_run_id: string;
  task_id: number;
  project_id: number;
  created_by: number | null;
  status: ReviewRunStatus;
  verdict: ReviewVerdict | null;
  summary: string | null;
  issues: ReviewIssue[];
  delivery_target: ReviewDeliveryTarget;
  github_comment_url: string | null;
  task_comment_id: number | null;
  tokens_used: number | null;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewRunListResponse {
  reviews: ReviewRun[];
  total: number;
}

export const REVIEW_RUN_TERMINAL_STATUSES: ReadonlySet<ReviewRunStatus> = new Set([
  'succeeded',
  'failed',
  'cancelled',
]);

export function isReviewRunTerminal(status: ReviewRunStatus): boolean {
  return REVIEW_RUN_TERMINAL_STATUSES.has(status);
}
