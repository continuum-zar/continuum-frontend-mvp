import api from '@/lib/api';

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

export async function fetchProjectVelocityReport(projectId: number | string): Promise<ProjectVelocityResponse> {
    const { data } = await api.get<ProjectVelocityResponse>(`/projects/${projectId}/velocity-report`);
    return data;
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

export async function fetchProjectStaleWork(projectId: number | string, thresholdDays?: number): Promise<StaleWorkResponse> {
    const { data } = await api.get<StaleWorkResponse>(`/projects/${projectId}/stale-work`, {
        params: thresholdDays != null ? { threshold_days: thresholdDays } : undefined,
    });
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
}

export interface ProjectQueryResponse {
    answer: string;
    confidence?: number;
    sources?: string[];
}

export async function postProjectQuery(projectId: number | string, body: ProjectQueryRequest): Promise<ProjectQueryResponse> {
    const { data } = await api.post<ProjectQueryResponse>(`/projects/${projectId}/query`, body);
    return data;
}
