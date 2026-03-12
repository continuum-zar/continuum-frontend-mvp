import api from '@/lib/api';

/** Backend work session status */
export type WorkSessionStatus = 'ACTIVE' | 'PAUSED';

/** Active work session from GET /api/v1/work-sessions/active (and pause/resume responses). */
export interface ActiveWorkSessionResponse {
    id: string;
    status: WorkSessionStatus;
    current_duration_seconds: number;
    project_id?: number;
    task_id?: number | null;
    note?: string | null;
}

/** Alias for work session from API (active or create response). */
export type WorkSessionOut = ActiveWorkSessionResponse | WorkSessionCreateResponse;

/** Response from POST /api/v1/work-sessions (create) */
export interface WorkSessionCreateResponse {
    id: string;
    status: WorkSessionStatus;
    current_duration_seconds: number;
    project_id?: number;
    task_id?: number | null;
}

/** Body for POST /api/v1/work-sessions */
export interface WorkSessionCreateBody {
    project_id: number;
    task_id?: number | null;
    note?: string | null;
}

/** Body for POST /api/v1/work-sessions/{id}/stop */
export interface WorkSessionStopBody {
    note?: string | null;
}

/**
 * GET /api/v1/work-sessions/active
 * Returns the current user's active work session, or 404 if none.
 */
export async function fetchActiveWorkSession(): Promise<ActiveWorkSessionResponse | null> {
    try {
        const { data } = await api.get<ActiveWorkSessionResponse>('/work-sessions/active');
        return data;
    } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) return null;
        throw err;
    }
}

/**
 * POST /api/v1/work-sessions
 * Start a new work session. Fails if user already has an active session.
 */
export async function startWorkSession(body: WorkSessionCreateBody): Promise<WorkSessionCreateResponse> {
    const { data } = await api.post<WorkSessionCreateResponse>('/work-sessions/', {
        project_id: body.project_id,
        ...(body.task_id != null && { task_id: body.task_id }),
        ...(body.note != null && body.note !== '' && { note: body.note }),
    });
    return data;
}

/**
 * POST /api/v1/work-sessions/{id}/pause
 */
export async function pauseWorkSession(sessionId: string): Promise<ActiveWorkSessionResponse> {
    const { data } = await api.post<ActiveWorkSessionResponse>(`/work-sessions/${sessionId}/pause`);
    return data;
}

/**
 * POST /api/v1/work-sessions/{id}/resume
 */
export async function resumeWorkSession(sessionId: string): Promise<ActiveWorkSessionResponse> {
    const { data } = await api.post<ActiveWorkSessionResponse>(`/work-sessions/${sessionId}/resume`);
    return data;
}

/**
 * POST /api/v1/work-sessions/{id}/stop
 * Stops the session and creates a LoggedHour with the given note.
 */
export async function stopWorkSession(sessionId: string, body: WorkSessionStopBody): Promise<void> {
    await api.post(`/work-sessions/${sessionId}/stop`, {
        note: body.note ?? null,
    });
}

/** @deprecated Use fetchActiveWorkSession. */
export const getActiveWorkSession = fetchActiveWorkSession;

/** @deprecated Use startWorkSession. */
export const createWorkSession = startWorkSession;
