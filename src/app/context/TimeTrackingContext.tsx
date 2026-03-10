import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { useAllTasks } from '@/api/hooks';
import type { TaskOption } from '@/api/projects';
import {
    getActiveWorkSession,
    createWorkSession,
    pauseWorkSession,
    resumeWorkSession,
    stopWorkSession,
    fetchLoggedHours,
    type LoggedHourAPIResponse,
} from '@/api/workSessions';
export interface TimeEntry {
    id: string;
    project: string;
    task: string;
    description?: string;
    duration: number;
    date: string;
}

function mapLoggedHourToEntry(r: LoggedHourAPIResponse): TimeEntry {
    const date = r.date ?? (r.logged_at ? r.logged_at.split('T')[0] : '');
    return {
        id: String(r.id),
        project: r.project_name ?? r.project ?? '',
        task: r.task_title ?? r.task ?? '',
        description: r.description ?? undefined,
        duration: r.duration_minutes ?? r.duration ?? 0,
        date,
    };
}

const initialTimeEntries: TimeEntry[] = [
    { id: '1', project: 'Mobile App Redesign', task: 'Implement dark mode', description: 'Added next-themes, configured dark mode palette, updated root layout.', duration: 180, date: '2026-02-21' },
    { id: '2', project: 'Dashboard v2', task: 'API integration', description: 'Wired up the useQuery hooks for the velocity metrics.', duration: 120, date: '2026-02-21' },
    { id: '3', project: 'Mobile App Redesign', task: 'Design review', duration: 60, date: '2026-02-20' },
    { id: '4', project: 'Marketing Website', task: 'Landing page optimization', duration: 240, date: '2026-02-20' },
    { id: '5', project: 'Dashboard v2', task: 'Database queries', duration: 150, date: '2026-02-19' },
    { id: '6', project: 'Mobile App Redesign', task: 'Component library', duration: 210, date: '2026-02-19' },
];

// eslint-disable-next-line react-refresh/only-export-components
export const weeklyData = [
    { day: 'Mon', hours: 6.5 },
    { day: 'Tue', hours: 7.2 },
    { day: 'Wed', hours: 5.8 },
    { day: 'Thu', hours: 8.1 },
    { day: 'Fri', hours: 6.3 },
    { day: 'Sat', hours: 2.0 },
    { day: 'Sun', hours: 0 },
];

type SessionState = 'idle' | 'running' | 'paused';

interface LogForm {
    task: string;
    description: string;
}

/** Normalize API error to a single message for toasts. */
function getApiErrorMessage(err: unknown, fallback: string): string {
    const data = (err as { response?: { data?: { detail?: string | Array<{ msg?: string }> } } })?.response?.data;
    const detail = data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
        const messages = detail
            .map((d) => (d && typeof d.msg === 'string' ? d.msg : String(d)))
            .filter(Boolean);
        return messages.length > 0 ? messages.join('. ') : fallback;
    }
    return fallback;
}

interface TimeTrackingContextProps {
    entries: TimeEntry[];
    setEntries: React.Dispatch<React.SetStateAction<TimeEntry[]>>;
    sessionState: SessionState;
    setSessionState: React.Dispatch<React.SetStateAction<SessionState>>;
    currentTime: number;
    setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
    /** Current work session id from backend (for pause/resume/stop). */
    activeSessionId: string | null;
    /** Tasks from GET /api/v1/tasks (all user projects). id as string for Select value. */
    tasks: TaskOption[];
    tasksLoading: boolean;
    tasksError: boolean;
    /** Currently selected task for the session; has project_id for WorkSessionCreate. */
    selectedTask: TaskOption | undefined;
    selectedTaskId: string;
    setSelectedTaskId: React.Dispatch<React.SetStateAction<string>>;
    isLoggingModalOpen: boolean;
    setIsLoggingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    logForm: LogForm;
    setLogForm: React.Dispatch<React.SetStateAction<LogForm>>;
    isAiGenerating: boolean;
    simulateAiGeneration: () => void;
    /** Start a new work session (POST work-sessions). */
    handleStart: () => Promise<void>;
    /** Pause the active session (POST work-sessions/{id}/pause). */
    handlePause: () => Promise<void>;
    /** Resume the active session (POST work-sessions/{id}/resume). */
    handleResume: () => Promise<void>;
    handleLogSubmit: () => Promise<void>;
    handleLogCancel: () => void;
    /** Open Log Time Session modal (timer pauses until user logs or cancels). */
    handleStop: () => void;
    /** Whether a start/pause/resume/stop request is in flight. */
    isSessionActionLoading: boolean;
}

const TimeTrackingContext = createContext<TimeTrackingContextProps | undefined>(undefined);

export function TimeTrackingProvider({ children }: { children: ReactNode }) {
    const { data: tasksData, isLoading: tasksLoading, isError: tasksError } = useAllTasks();
    const tasks = tasksData ?? [];

    const [entries, setEntries] = useState<TimeEntry[]>(initialTimeEntries);
    const [sessionState, setSessionState] = useState<SessionState>('idle');
    const [currentTime, setCurrentTime] = useState(0);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [selectedTaskId, setSelectedTaskId] = useState('');
    const [isSessionActionLoading, setIsSessionActionLoading] = useState(false);

    // Default to first task when tasks load and none selected
    useEffect(() => {
        if (!tasksLoading && tasks.length > 0 && !selectedTaskId) {
            setSelectedTaskId(tasks[0].id);
        }
    }, [tasksLoading, tasks, selectedTaskId]);

    const selectedTask = useMemo(
        () => tasks.find((t) => t.id === selectedTaskId),
        [tasks, selectedTaskId]
    );

    // Logging Modal State
    const [isLoggingModalOpen, setIsLoggingModalOpen] = useState(false);
    const [logForm, setLogForm] = useState<LogForm>({ task: '', description: '' });
    const [isAiGenerating, setIsAiGenerating] = useState(false);

    // On mount: fetch active work session and restore state; load entries from API
    useEffect(() => {
        let cancelled = false;
        getActiveWorkSession()
            .then((session) => {
                if (cancelled || !session) return;
                setActiveSessionId(session.id);
                setSessionState(session.status === 'ACTIVE' ? 'running' : 'paused');
                setCurrentTime(session.current_duration_seconds ?? 0);
                if (session.task_id != null && session.task_id !== undefined) {
                    setSelectedTaskId(String(session.task_id));
                }
            })
            .catch(() => {});
        fetchLoggedHours()
            .then((list) => {
                if (!cancelled && list.length > 0) {
                    setEntries(list.map(mapLoggedHourToEntry));
                }
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);

    // Local timer: increment every second when running
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (sessionState === 'running') {
            interval = setInterval(() => {
                setCurrentTime((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [sessionState]);

    // Periodic sync with backend when running (avoid drift)
    useEffect(() => {
        if (sessionState !== 'running' || !activeSessionId) return;
        const syncInterval = setInterval(() => {
            getActiveWorkSession()
                .then((session) => {
                if (session?.id === activeSessionId && session.status === 'ACTIVE') {
                    setCurrentTime(session.current_duration_seconds ?? 0);
                }
            })
                .catch(() => {});
        }, 30_000);
        return () => clearInterval(syncInterval);
    }, [sessionState, activeSessionId]);

    const refetchEntries = useCallback(() => {
        fetchLoggedHours()
            .then((list) => {
                if (list.length > 0) {
                    setEntries(list.map(mapLoggedHourToEntry));
                }
            })
            .catch(() => {});
    }, []);

    const handleStart = useCallback(async () => {
        const task = selectedTask ?? tasks[0];
        if (!task?.project_id) {
            toast.error('Select a task with a project to start a session.');
            return;
        }
        setIsSessionActionLoading(true);
        try {
            const taskIdNum = task.id ? Number(task.id) : NaN;
            const data = await createWorkSession({
                project_id: task.project_id,
                ...(Number.isFinite(taskIdNum) && { task_id: taskIdNum }),
                note: undefined,
            });
            setActiveSessionId(data.id);
            setSessionState('running');
            setCurrentTime(data.current_duration_seconds ?? 0);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to start session. You may already have an active session.'));
        } finally {
            setIsSessionActionLoading(false);
        }
    }, [selectedTask, tasks]);

    const handlePause = useCallback(async () => {
        if (!activeSessionId) return;
        setIsSessionActionLoading(true);
        try {
            const data = await pauseWorkSession(activeSessionId);
            setSessionState('paused');
            setCurrentTime(data.current_duration_seconds ?? 0);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to pause session.'));
        } finally {
            setIsSessionActionLoading(false);
        }
    }, [activeSessionId]);

    const handleResume = useCallback(async () => {
        if (!activeSessionId) return;
        setIsSessionActionLoading(true);
        try {
            const data = await resumeWorkSession(activeSessionId);
            setSessionState('running');
            setCurrentTime(data.current_duration_seconds ?? 0);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to resume session.'));
        } finally {
            setIsSessionActionLoading(false);
        }
    }, [activeSessionId]);

    const handleStop = () => {
        setSessionState('paused'); // Pause the timer while logging
        setIsLoggingModalOpen(true);
    };

    const simulateAiGeneration = () => {
        setIsAiGenerating(true);
        setTimeout(() => {
            setLogForm((prev) => ({
                ...prev,
                description: "Implemented Time Tracking Session Logging feature. Added modal overlay state management, configured AI Generator button to spoof commit history parsing, updated mock DB schema to accept descriptions, and wired form submission to native state append."
            }));
            setIsAiGenerating(false);
        }, 1500); // 1.5s simulated backend delay
    };

    const handleLogSubmit = useCallback(async () => {
        if (!activeSessionId) {
            toast.error('No active session to log.');
            return;
        }
        setIsSessionActionLoading(true);
        try {
            await stopWorkSession(activeSessionId, { note: logForm.description || undefined });
            setIsLoggingModalOpen(false);
            setSessionState('idle');
            setCurrentTime(0);
            setActiveSessionId(null);
            setLogForm({ task: '', description: '' });
            refetchEntries();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to log session.'));
        } finally {
            setIsSessionActionLoading(false);
        }
    }, [activeSessionId, logForm.description, refetchEntries]);

    const handleLogCancel = () => {
        setIsLoggingModalOpen(false);
        // Timer remains paused, user can resume or stop again
    };

    return (
        <TimeTrackingContext.Provider
            value={{
                entries,
                setEntries,
                sessionState,
                setSessionState,
                currentTime,
                setCurrentTime,
                activeSessionId,
                tasks,
                tasksLoading,
                tasksError,
                selectedTask,
                selectedTaskId,
                setSelectedTaskId,
                isLoggingModalOpen,
                setIsLoggingModalOpen,
                logForm,
                setLogForm,
                isAiGenerating,
                simulateAiGeneration,
                handleStart,
                handlePause,
                handleResume,
                handleLogSubmit,
                handleLogCancel,
                handleStop,
                isSessionActionLoading,
            }}
        >
            {children}
        </TimeTrackingContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTimeTracking() {
    const context = useContext(TimeTrackingContext);
    if (context === undefined) {
        throw new Error('useTimeTracking must be used within a TimeTrackingProvider');
    }
    return context;
}
