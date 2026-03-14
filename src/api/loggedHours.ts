import api from '@/lib/api';
import { fetchAllTasks } from './tasks';

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
    /** Backend may serialize the note field as "description" (Pydantic) or "note". */
    note?: string | null;
    description?: string | null;
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
        description: row.note ?? row.description ?? undefined,
        duration: Math.round((row.hours ?? 0) * 60),
        date: dateOnly || new Date().toISOString().split('T')[0],
    };
}

/** GET /api/v1/logged-hours. Defaults to current user; optional project_id, start_date, end_date, limit (e.g. 50). */
export async function fetchLoggedHours(params?: FetchLoggedHoursParams): Promise<LoggedHourEntry[]> {
    const { data } = await api.get<LoggedHourResponse[]>('/logged-hours/', {
        params: {
            ...(params?.project_id != null && params.project_id !== '' && { project_id: params.project_id }),
            ...(params?.start_date && { start_date: params.start_date }),
            ...(params?.end_date && { end_date: params.end_date }),
            ...(params?.limit != null && { limit: params.limit }),
        },
    });
    return (data ?? []).map(mapLoggedHourToTimeEntry);
}

/** Body for creating a logged hour (POST /api/v1/logged-hours). Manual entry: project_id + optional task_id; timer flow may use task_id only. Provide either hours or duration_minutes. */
export interface CreateLoggedHourBody {
    project_id?: number | string;
    task_id?: number | string;
    /** Duration in hours. Omit if using duration_minutes. */
    hours?: number;
    /** Duration in minutes; if set, hours is derived as duration_minutes/60 (backend may accept either). */
    duration_minutes?: number;
    /** Description/note for the entry (optional). */
    description?: string | null;
    /** Date (ISO date string YYYY-MM-DD); backend may default to today. */
    date?: string;
}

/** POST /api/v1/logged-hours. Creates a logged hour for the current user; refetch list after success. Backend validates project/task access (403 if forbidden). */
export async function createLoggedHour(body: CreateLoggedHourBody): Promise<LoggedHourResponse> {
    const hours = body.duration_minutes != null ? body.duration_minutes / 60 : (body.hours ?? 0);
    if (!Number.isFinite(hours) || hours <= 0) throw new Error('Provide either hours or duration_minutes (positive).');
    const payload: Record<string, unknown> = {
        hours,
        ...(body.project_id != null && body.project_id !== '' && { project_id: body.project_id }),
        ...(body.task_id != null && body.task_id !== '' && { task_id: body.task_id }),
        ...(body.description != null && body.description !== '' && { note: body.description }),
        ...(body.date && { date: body.date }),
    };
    const { data } = await api.post<LoggedHourResponse>('/logged-hours/', payload);
    return data;
}

/**
 * GET /api/v1/logged-hours?format=csv. Downloads CSV with same filters (project_id, start_date, end_date).
 * Uses response blob and Content-Disposition filename; triggers file download. Throws on error.
 */
export async function downloadLoggedHoursCsv(params?: FetchLoggedHoursParams): Promise<void> {
    const { data: blob, headers } = await api.get<Blob>('/logged-hours/', {
        params: {
            format: 'csv',
            ...(params?.project_id != null && params.project_id !== '' && { project_id: params.project_id }),
            ...(params?.start_date && { start_date: params.start_date }),
            ...(params?.end_date && { end_date: params.end_date }),
            ...(params?.limit != null && { limit: params.limit }),
        },
        responseType: 'blob',
    });

    const contentDisposition = headers?.['content-disposition'];
    let filename = 'logged-hours.csv';
    if (typeof contentDisposition === 'string') {
        const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"'\s;]+)["']?/i)
            ?? contentDisposition.match(/filename=["']?([^"'\s;]+)["']?/i);
        if (match?.[1]) filename = decodeURIComponent(match[1].trim());
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/** Tasks for time log dropdown (reuses GET /api/v1/tasks/ list). */
export async function fetchTasksForTimeLog() {
    return fetchAllTasks();
}
