import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { useAllTasks, useLoggedHours } from '@/api/hooks';
import type { TaskOption } from '@/api/projects';
import {
    fetchActiveWorkSession,
    startWorkSession,
    pauseWorkSession,
    resumeWorkSession,
    stopWorkSession,
} from '@/api/workSessions';
export interface TimeEntry {
    id: string;
    project: string;
    task: string;
    description?: string;
    duration: number;
    date: string;
}

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
    /** Recent entries from GET /api/v1/logged-hours (filtered by project when set). */
    entries: TimeEntry[];
    entriesLoading: boolean;
    entriesError: boolean;
    refetchEntries: () => void;
    /** Project filter for Recent Entries: 'all' or project id. */
    projectFilterId: string;
    setProjectFilterId: React.Dispatch<React.SetStateAction<string>>;
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

    const [projectFilterId, setProjectFilterId] = useState<string>('all');
    const { data: entriesData, isLoading: entriesLoading, isError: entriesError, refetch: refetchEntries } = useLoggedHours(projectFilterId, { limit: 50 });
    const entries = (entriesData ?? []) as TimeEntry[];

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

    // On mount: fetch active work session and restore state; entries come from useLoggedHours
    useEffect(() => {
        let cancelled = false;
        fetchActiveWorkSession()
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
            fetchActiveWorkSession()
                .then((session) => {
                if (session?.id === activeSessionId && session.status === 'ACTIVE') {
                    setCurrentTime(session.current_duration_seconds ?? 0);
                }
            })
                .catch(() => {});
        }, 30_000);
        return () => clearInterval(syncInterval);
    }, [sessionState, activeSessionId]);

    const handleStart = useCallback(async () => {
        const task = selectedTask ?? tasks[0];
        if (!task?.project_id) {
            toast.error('Select a task with a project to start a session.');
            return;
        }
        setIsSessionActionLoading(true);
        try {
            const taskIdNum = task.id ? Number(task.id) : NaN;
            const data = await startWorkSession({
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
                entriesLoading,
                entriesError,
                refetchEntries,
                projectFilterId,
                setProjectFilterId,
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
