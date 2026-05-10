import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { INDEXING_PROGRESS_POLL_MS } from '@/lib/queryDefaults';
import type { FileContent } from './planner';

// Dashboard metrics
export interface DashboardHealth {
    overdue_count: number;
    unassigned_count: number;
    hps_ratio: number;
    health_status?: string;
}

export interface DashboardStats {
    total_todo_tasks: number;
    total_in_progress_tasks: number;
    total_completed_tasks: number;
    total_overdue_tasks: number;
    total_tasks?: number;
    completion_percentage?: number;
}

export interface WeeklyVelocityData {
    week_number: number;
    week_start_date: string;
    week_end_date?: string;
    velocity_score: number;
    rolling_avg: number;
    tasks_completed?: number;
    hours_logged?: number;
    commits_count?: number;
}

export interface ProjectVelocityTrend {
    velocity_score?: number;
    change_percentage?: number;
}

export interface ProjectVelocityResponse {
    trend: ProjectVelocityTrend;
    forecast_next_week?: number;
    weeks: WeeklyVelocityData[];
}

export interface DashboardMetricsResponse {
    health: DashboardHealth;
    stats: DashboardStats;
    velocity: ProjectVelocityResponse;
}

// Milestone burndown
export interface MilestoneBurndownPoint {
    date: string;
    remaining_scope_points: number;
    ideal_scope_points?: number;
}

export interface MilestoneBurndownResponse {
    milestone_id: number;
    milestone_name: string;
    total_scope_points: number;
    due_date?: string;
    series: MilestoneBurndownPoint[];
    ideal_series?: MilestoneBurndownPoint[];
}

// User rhythm
export interface UserRhythmDayHourBuckets {
    [day: string]: {
        [hour: string]: number;
    };
}

export interface UserRhythmDayHourResponse {
    day_hour: UserRhythmDayHourBuckets;
}

/** Ongoing work session row from GET /projects/{id}/active-work-sessions (snake_case API). */
export interface ActiveWorkSessionItem {
    session_id: number;
    user_id: number;
    display_name: string;
    first_name: string;
    last_name: string;
    task_id: number | null;
    task_title: string | null;
    started_at: string;
    last_resumed_at: string | null;
    status: string;
}

// Stale work
export interface StaleBranchItem {
    branch: string;
    last_committer_name: string;
    days_inactive?: number;
    last_commit_at?: string;
}

export interface StaleWorkResponse {
    threshold_days: number;
    stale_branches: StaleBranchItem[];
}

// Classification breakdown
export interface ClassificationBreakdown {
    trivial: number;
    incremental: number;
    structural: number;
}

// Client portal
export interface ClientProjectSummary {
    id: number;
    name: string;
    progress_percentage?: number;
}

export interface ClientHealthPie {
    on_track_pct: number;
    at_risk_pct: number;
    blocked_pct: number;
}

export interface ClientRecentActivityItem {
    description: string;
    date: string;
    user_name: string;
    target_title?: string;
    type?: string;
}

export interface ClientPortalProgress {
    project_id: number;
    progress_percentage: number;
    total_hours?: number;
    completed_tasks?: number;
    total_tasks?: number;
    recent_activity: ClientRecentActivityItem[];
    health_pie: ClientHealthPie;
    milestones?: unknown[];
}

// API client functions

export async function fetchProjectDashboard(projectId: number | string): Promise<DashboardMetricsResponse> {
    const { data } = await api.get<DashboardMetricsResponse>(`/projects/${projectId}/dashboard`);
    return data;
}

export async function fetchProjectVelocityReport(
    projectId: number | string,
    weeks = 104,
    granularity: 'weekly' | 'daily' = 'weekly',
): Promise<ProjectVelocityResponse> {
    const { data } = await api.get<ProjectVelocityResponse>(`/projects/${projectId}/velocity-report`, {
        params: { weeks, granularity },
    });
    return data;
}

/** Per-member contributions for Activity / team dashboards (matches API). */
export interface MemberContributionStats {
    user_id: number;
    name: string;
    role: string;
    total_hours: number;
    total_tasks_completed: number;
    total_tasks_in_progress: number;
    total_commits: number;
    classification_breakdown: ClassificationBreakdown;
    last_active_date?: string | null;
}

export async function fetchMemberContributions(projectId: number | string): Promise<MemberContributionStats[]> {
    const { data } = await api.get<MemberContributionStats[]>(`/projects/${projectId}/member-contributions`);
    return data ?? [];
}

export async function fetchMilestoneBurndown(milestoneId: number | string): Promise<MilestoneBurndownResponse> {
    const { data } = await api.get<MilestoneBurndownResponse>(`/milestones/${milestoneId}/burndown`);
    return data;
}

export async function fetchUserRhythm(userId: number | string, dayHour = true): Promise<UserRhythmDayHourResponse> {
    const { data } = await api.get<UserRhythmDayHourResponse>(`/users/${userId}/rhythm`, {
        params: { day_hour: dayHour },
    });
    return data;
}

export async function fetchProjectActiveWorkSessions(projectId: number | string): Promise<ActiveWorkSessionItem[]> {
    const { data } = await api.get<ActiveWorkSessionItem[]>(`/projects/${projectId}/active-work-sessions`);
    return data ?? [];
}

export async function fetchProjectStaleWork(projectId: number | string, thresholdDays?: number): Promise<StaleWorkResponse> {
    const { data } = await api.get<StaleWorkResponse>(`/projects/${projectId}/stale-work`, {
        params: thresholdDays != null ? { threshold_days: thresholdDays } : undefined,
    });
    return data;
}

export interface ProjectHealthResponse {
    project_id: number;
    hps_ratio: number;
    health_status: string;
    overdue_count?: number;
    unassigned_count?: number;
}

export async function fetchProjectHealth(projectId: number | string): Promise<ProjectHealthResponse> {
    const { data } = await api.get<ProjectHealthResponse>(`/projects/${projectId}/health`);
    return data;
}

export async function fetchClassificationBreakdown(projectId: number | string): Promise<ClassificationBreakdown> {
    const { data } = await api.get<ClassificationBreakdown>(`/projects/${projectId}/contributions/classification-breakdown`);
    return data;
}

/** Project stats (project-wide or filtered by member). Used for Team Task Snapshot. */
export interface ProjectStatsResponse {
    total_todo_tasks: number;
    total_in_progress_tasks: number;
    total_completed_tasks: number;
    total_overdue_tasks: number;
    total_tasks?: number;
    progress_percentage?: number;
    completed_weight?: number;
    total_weight?: number;
}

export async function fetchProjectStats(
    projectId: number | string,
    memberId?: number | null
): Promise<ProjectStatsResponse> {
    const params = memberId != null ? { member_id: memberId } : undefined;
    const { data } = await api.get<ProjectStatsResponse>(`/projects/${projectId}/stats`, { params });
    return data;
}

export async function fetchClientProjects(): Promise<ClientProjectSummary[]> {
    const { data } = await api.get<ClientProjectSummary[]>('/users/me/client-projects');
    return data ?? [];
}

export async function fetchClientProjectProgress(projectId: number | string): Promise<ClientPortalProgress> {
    const { data } = await api.get<ClientPortalProgress>(`/users/me/client-projects/${projectId}/progress`);
    return data;
}

export interface ProjectQueryRequest {
    query: string;
    /** When true (default), backend includes semantic retrieval over indexed project content. */
    use_rag?: boolean;
    /** Optional uploaded file extracts (same shape as planner/wiki). */
    file_contents?: FileContent[];
}

/** Structured signal sources returned with project query answers (matches API). */
export interface ProjectQuerySource {
    type: 'progress' | 'hps' | 'structural_commits' | 'health';
    data: Record<string, unknown>;
}

export interface ProjectQueryResponse {
    answer: string;
    confidence?: number;
    sources?: ProjectQuerySource[];
}

export async function postProjectQuery(
    projectId: number | string,
    body: ProjectQueryRequest,
    options?: { signal?: AbortSignal },
): Promise<ProjectQueryResponse> {
    const { data } = await api.post<ProjectQueryResponse>(`/projects/${projectId}/query`, body, {
        signal: options?.signal,
        timeout: 600_000,
    });
    return data;
}

/** RAG chunk indexing progress (`GET /api/v1/indexing/progress`). */
export interface IndexingProgressResponse {
    project_id: number;
    scanned: number;
    total: number;
    status: 'idle' | 'running' | 'complete' | 'error';
    error_message?: string | null;
}

export const indexingProgressKeys = {
    all: ['indexing-progress'] as const,
    project: (projectId: number | string) => [...indexingProgressKeys.all, projectId] as const,
};

export async function fetchIndexingProgress(projectId: number | string): Promise<IndexingProgressResponse> {
    const { data } = await api.get<IndexingProgressResponse>('/indexing/progress', {
        params: { project_id: projectId },
    });
    return data;
}

/**
 * Polls embedding-index progress while `enabled` is true (e.g. during a long
 * `postProjectQuery` request so the UI can update in parallel).
 */
export function useIndexingProgressPoll(projectId: number | string | undefined | null, enabled: boolean) {
    const id = projectId != null && projectId !== '' ? projectId : null;
    return useQuery({
        queryKey: id != null ? indexingProgressKeys.project(id) : ['indexing-progress', 'disabled'],
        queryFn: () => fetchIndexingProgress(id!),
        enabled: Boolean(id != null && enabled),
        staleTime: INDEXING_PROGRESS_POLL_MS,
        refetchInterval: (query) => {
            if (id == null || !enabled) return false;
            const status = query.state.data?.status;
            return status === 'complete' || status === 'error' ? false : INDEXING_PROGRESS_POLL_MS;
        },
    });
}

/** Daily CFD series (todo / in_progress / done). */
export interface CumulativeFlowDataPoint {
    date: string;
    todo: number;
    in_progress: number;
    done: number;
}

export interface CumulativeFlowResponse {
    project_id: number;
    days: number;
    series: CumulativeFlowDataPoint[];
}

export async function fetchProjectCumulativeFlow(
    projectId: number | string,
    days = 90,
): Promise<CumulativeFlowResponse> {
    const { data } = await api.get<CumulativeFlowResponse>(`/projects/${projectId}/cumulative-flow`, {
        params: { days },
    });
    return data;
}

export interface LeadTimeHistogramBin {
    label: string;
    min_days: number;
    max_days?: number | null;
    count: number;
}

export interface LeadTimeDistributionResponse {
    project_id: number;
    weeks: number;
    tasks_included: number;
    lead_time_bins: LeadTimeHistogramBin[];
    cycle_time_bins: LeadTimeHistogramBin[];
    tasks_with_cycle_sample: number;
}

export async function fetchProjectLeadTimeDistribution(
    projectId: number | string,
    weeks = 52,
): Promise<LeadTimeDistributionResponse> {
    const { data } = await api.get<LeadTimeDistributionResponse>(
        `/projects/${projectId}/lead-time-distribution`,
        { params: { weeks } },
    );
    return data;
}

/** GET /projects/{id}/history — progress % and hours over time. */
export interface ProjectSnapshotHistoryPoint {
    id: number;
    project_id: number;
    date: string;
    total_hours: number;
    progress_percentage: number;
    active_task_count: number;
}

export async function fetchProjectHistory(
    projectId: number | string,
): Promise<ProjectSnapshotHistoryPoint[]> {
    const { data } = await api.get<ProjectSnapshotHistoryPoint[]>(`/projects/${projectId}/history`);
    return data ?? [];
}

/** GET /projects/{id}/velocity — weekly HPS timeseries (matches HpsDataPoint). */
export interface HpsVelocityPoint {
    week: string;
    hps: number | null;
    hours_logged: number;
    scope_points: number;
    tasks_completed: number;
}

export async function fetchProjectHpsVelocity(
    projectId: number | string,
    weeks = 24,
): Promise<HpsVelocityPoint[]> {
    const { data } = await api.get<HpsVelocityPoint[]>(`/projects/${projectId}/velocity`, {
        params: { weeks },
    });
    return data ?? [];
}
