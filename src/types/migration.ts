/**
 * TypeScript shapes for the /api/v1/migrations endpoints.
 *
 * Mirror of the Pydantic models in
 * ``continuum-backend/backend/app/schemas/migration.py``. Keep field
 * names identical — both sides have a contract test
 * (``test_ir_schema.py``) backing this alignment.
 */

// ---------------------------------------------------------------------------
// State machine + source hints
// ---------------------------------------------------------------------------

export type MigrationStatus =
  | "queued"
  | "parsing"
  | "ready"
  | "applying"
  | "completed"
  | "failed"
  | "canceled";

export type SourceHint = "jira" | "trello" | "asana" | "generic_csv";

/** The select on the upload screen also offers "auto" — when the user picks
 *  it, the UI omits ``source_hint`` from the multipart body and lets the
 *  backend detect (see architecture doc §3.1.a). */
export type SourceHintOption = SourceHint | "auto";

/** Convenience: true when no further state transitions are expected. */
export function isMigrationTerminal(status: MigrationStatus): boolean {
  return status === "completed" || status === "failed" || status === "canceled";
}

// ---------------------------------------------------------------------------
// Canonical IR (matches CanonicalProjectIROut on the backend)
// ---------------------------------------------------------------------------

export interface IRWarning {
  code: string;
  detail: Record<string, unknown>;
  ext_id: string | null;
}

export interface IRMember {
  ext_id: string;
  email: string | null;
  display_name: string | null;
  source_role: string | null;
}

export interface IRLabel {
  name: string;
  color: string | null;
}

export interface IRMilestone {
  ext_id: string;
  name: string;
  /** ISO date string (`YYYY-MM-DD`). */
  due_date: string | null;
  /** ISO date string. */
  start_date: string | null;
  status: string | null;
  description: string | null;
}

export interface IRColumn {
  ext_id: string;
  title: string;
  task_status: string;
}

export interface IRComment {
  ext_id: string;
  body: string;
  author_ext_id: string | null;
  /** ISO datetime string. */
  created_at: string | null;
}

export interface IRAttachment {
  filename: string;
  url: string | null;
  size: number | null;
  mime_type: string | null;
}

export interface IRChecklistItem {
  text: string;
  checked: boolean;
}

export interface IRChecklist {
  title: string;
  items: IRChecklistItem[];
}

export interface IRTask {
  ext_id: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  scope_weight: string | null;
  /** ISO date string. */
  due_date: string | null;
  start_date: string | null;
  milestone_ext_id: string | null;
  column_ext_id: string | null;
  parent_ext_id: string | null;
  assignee_ext_ids: string[];
  label_names: string[];
  depends_on_ext_ids: string[];
  checklists: IRChecklist[];
  comments: IRComment[];
  attachments: IRAttachment[];
  source_extra: Record<string, unknown>;
}

export interface IRProject {
  name: string;
  description: string | null;
  source: string;
  source_id: string | null;
}

export interface CanonicalProjectIR {
  project: IRProject;
  milestones: IRMilestone[];
  columns: IRColumn[];
  members: IRMember[];
  labels: IRLabel[];
  tasks: IRTask[];
  warnings: IRWarning[];
}

// ---------------------------------------------------------------------------
// API request / response shapes
// ---------------------------------------------------------------------------

/** 202 response from POST /migrations/upload. */
export interface MigrationUploadResponse {
  job_id: number;
  status: MigrationStatus;
  source: string;
  source_format: string;
}

/** Compact view for list endpoints. */
export interface MigrationJobOut {
  id: number;
  status: MigrationStatus;
  source: string;
  source_format: string;
  original_filename: string | null;
  target_project_id: number | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

/** Full detail — what GET /{job_id} returns. */
export interface MigrationJobDetail extends MigrationJobOut {
  ir: CanonicalProjectIR | null;
  mapping_overrides: MigrationMappingOverrides;
  warnings: IRWarning[];
  stats: MigrationStats;
}

/** The blob stored in ``MigrationJob.mapping_overrides``. Server-side shape
 *  is intentionally loose so future override kinds can land without a
 *  schema migration — keep this shape as a superset that survives extra
 *  keys. */
export interface MigrationMappingOverrides {
  /** raw source status string → canonical Continuum status. */
  status_map?: Record<string, string>;
  /** raw source priority string → canonical Continuum priority. */
  priority_map?: Record<string, string>;
  /** member ext_id → existing user_id (number) OR email (string). */
  user_map?: Record<string, number | string>;
  /** Drop tasks whose status resolves to "done" before Apply. */
  skip_done?: boolean;
  // Forward-compat: tolerate unknown keys without a TS error.
  [key: string]: unknown;
}

/** PATCH body for /migrations/{id}/mapping. All fields optional and merged
 *  shallowly server-side. ``extra=forbid`` on the Pydantic side, so do NOT
 *  add unknown keys here. */
export interface MigrationMappingPatch {
  status_map?: Record<string, string>;
  priority_map?: Record<string, string>;
  user_map?: Record<string, number | string>;
  skip_done?: boolean;
}

/** POST body for /migrations/{id}/apply. */
export interface MigrationApplyRequest {
  /** When set, IR is merged into this project (upserts by source pair).
   *  When null, a new project is created from IR.project. */
  target_project_id?: number | null;
  /** Run validate + resolve and produce a preview without writing. */
  dry_run?: boolean;
}

/** 202 response from POST /apply — Apply runs as a background task. */
export interface MigrationApplyResult {
  job_id: number;
  status: MigrationStatus;
}

/** Recent-jobs listing. */
export interface MigrationListResponse {
  items: MigrationJobOut[];
  next_cursor: string | null;
}

/** Counters surfaced on the post-Apply summary screen — matches
 *  ``ApplyStats.as_dict()`` on the backend. */
export interface MigrationStats {
  project_id?: number;
  project_created?: boolean;
  milestones_created?: number;
  milestones_updated?: number;
  tasks_created?: number;
  tasks_updated?: number;
  labels?: number;
  assignees?: number;
  comments?: number;
  dependencies?: number;
  invitations?: number;
  columns_added?: number;
  batches?: number;
  /** Set by the dry-run path. */
  dry_run?: boolean;
  // Forward-compat for future counters / LLM blurb.
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// SSE events (event payloads delivered on /migrations/{id}/events)
// ---------------------------------------------------------------------------

export type MigrationEventType =
  | "migration.parse.ready"
  | "migration.parse.failed"
  | "migration.apply.start"
  | "migration.apply.progress"
  | "migration.apply.done"
  | "migration.apply.dry_run_done"
  | "migration.error";

export interface MigrationParseReadyEvent {
  type: "migration.parse.ready";
  warnings: number;
}

export interface MigrationParseFailedEvent {
  type: "migration.parse.failed";
  error: string;
}

export interface MigrationApplyStartEvent {
  type: "migration.apply.start";
  /** Total task count being applied. Lets the UI render "0 / N" right when
   *  apply kicks off — without it the progress bar would sit at "0 / 0"
   *  until the first batch event lands. */
  tasks_total?: number;
  milestones_total?: number;
}

export interface MigrationApplyProgressEvent {
  type: "migration.apply.progress";
  batch_index: number;
  tasks_done: number;
  tasks_total: number;
}

export interface MigrationApplyDoneEvent {
  type: "migration.apply.done";
  stats: MigrationStats;
}

export interface MigrationApplyDryRunDoneEvent {
  type: "migration.apply.dry_run_done";
}

export interface MigrationErrorEvent {
  type: "migration.error";
  error: string;
}

export type MigrationEvent =
  | MigrationParseReadyEvent
  | MigrationParseFailedEvent
  | MigrationApplyStartEvent
  | MigrationApplyProgressEvent
  | MigrationApplyDoneEvent
  | MigrationApplyDryRunDoneEvent
  | MigrationErrorEvent;
