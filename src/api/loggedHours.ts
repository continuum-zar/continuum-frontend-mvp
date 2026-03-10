import api from '@/lib/api';

/** Table row shape for Recent Entries (matches TimeEntry in TimeTrackingContext). */
export interface LoggedHourEntry {
    id: string;
    project: string;
    task: string;
    description?: string;
    duration: number;
    date: string;
}

/** Backend response for a single logged hour entry (GET /api/v1/logged-hours). */
export interface LoggedHourResponse {
    id: number | string;
    project_name: string;
    task_title: string;
    hours: number;
    note?: string | null;
    /** Date of the log; backend may use `date` or `logged_at`. */
    date?: string;
    logged_at?: string;
}

export interface FetchLoggedHoursParams {
    project_id?: number | string;
    start_date?: string;
    end_date?: string;
    limit?: number;
}

/**
 * Map API response to table shape. Duration is stored in minutes for display (formatDuration).
 * Backend returns hours; we convert to minutes for consistency with existing UI.
 */
function mapLoggedHourToTimeEntry(row: LoggedHourResponse): LoggedHourEntry {
    const dateStr = row.date ?? row.logged_at ?? '';
    const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    return {
        id: String(row.id),
        project: row.project_name ?? '',
        task: row.task_title ?? '',
        description: row.note ?? undefined,
        duration: Math.round((row.hours ?? 0) * 60),
        date: dateOnly || new Date().toISOString().split('T')[0],
    };
}

/** GET /api/v1/logged-hours. Defaults to current user; optional project_id, start_date, end_date, limit (e.g. 50). */
export async function fetchLoggedHours(params?: FetchLoggedHoursParams): Promise<LoggedHourEntry[]> {
    const { data } = await api.get<LoggedHourResponse[]>('/logged-hours', {
        params: {
            ...(params?.project_id != null && params.project_id !== '' && { project_id: params.project_id }),
            ...(params?.start_date && { start_date: params.start_date }),
            ...(params?.end_date && { end_date: params.end_date }),
            ...(params?.limit != null && { limit: params.limit }),
        },
    });
    return (data ?? []).map(mapLoggedHourToTimeEntry);
}

/** Body for creating a logged hour (POST /api/v1/logged-hours). */
export interface CreateLoggedHourBody {
    task_id: number | string;
    hours: number;
    note?: string | null;
    /** Optional date (YYYY-MM-DD); backend may default to today. */
    date?: string;
}

/** POST /api/v1/logged-hours. Creates a logged hour for the current user; refetch list after success. */
export async function createLoggedHour(body: CreateLoggedHourBody): Promise<LoggedHourResponse> {
    const { data } = await api.post<LoggedHourResponse>('/logged-hours', {
        task_id: body.task_id,
        hours: body.hours,
        ...(body.note != null && body.note !== '' && { note: body.note }),
        ...(body.date && { date: body.date }),
    });
    return data;
}
