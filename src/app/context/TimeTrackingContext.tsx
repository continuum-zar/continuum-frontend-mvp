import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAllTasks, useLoggedHours, getApiErrorMessage } from '@/api/hooks';
import type { TaskOption } from '@/api';
import {
    fetchActiveWorkSession,
    startWorkSession,
    pauseWorkSession,
    resumeWorkSession,
    stopWorkSession,
    suggestSessionDescription,
} from '@/api/workSessions';
import { isTimeTrackingRoutePath } from '@/lib/timeTrackingPaths';
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



const SESSION_HINT_KEY = 'continuum_active_session_hint';

interface TimeTrackingContextProps {
    /** Activate the provider (triggers data fetching). Called automatically on /time or when a session hint exists. */
    activate: () => void;
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
    handleLogSubmit: (noteOverride?: string) => Promise<void>;
    handleLogCancel: () => void;
    /** Open Log Time Session modal; pauses backend session first when needed. */
    handleStop: () => Promise<void>;
    /** Whether a start/pause/resume/stop request is in flight. */
    isSessionActionLoading: boolean;
}

const TimeTrackingContext = createContext<TimeTrackingContextProps | undefined>(undefined);

export function TimeTrackingProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    // Lazy-activation gate: time logs URL, legacy /time target, or active-session hint. SPA navigations
    // to time logs should call `activate()` from that view (provider sits above RouterProvider).
    const [isActivated, setIsActivated] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            if (window.localStorage.getItem(SESSION_HINT_KEY) === 'true') return true;
            if (isTimeTrackingRoutePath(window.location.pathname)) return true;
        }
        return false;
    });

    const activate = useCallback(() => setIsActivated(true), []);

    const invalidateMyActiveWorkSession = useCallback(() => {
        console.debug('[TimeTracking] invalidating session queries', {
            keys: ['my-active-work-session', 'project-active-work-sessions'],
        });
        void queryClient.invalidateQueries({ queryKey: ['my-active-work-session'] });
        void queryClient.invalidateQueries({ queryKey: ['project-active-work-sessions'] });
    }, [queryClient]);

    const { data: tasksData, isLoading: tasksLoading, isError: tasksError } = useAllTasks({ enabled: isActivated });
    const tasks = useMemo(() => tasksData ?? [], [tasksData]);

    const [projectFilterId, setProjectFilterId] = useState<string>('all');
    const { data: entriesData, isLoading: entriesLoading, isError: entriesError, refetch: refetchEntries } = useLoggedHours(projectFilterId, { limit: 50, enabled: isActivated });
    const entries = useMemo(() => (entriesData ?? []) as TimeEntry[], [entriesData]);

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

    // Only fetch active work session when the provider is activated
    const hasRestoredSession = useRef(false);
    useEffect(() => {
        if (!isActivated || hasRestoredSession.current) return;
        hasRestoredSession.current = true;
        let cancelled = false;
        fetchActiveWorkSession()
            .then((session) => {
                if (cancelled || !session) return;
                setActiveSessionId(String(session.id));
                setSessionState(session.status === 'ACTIVE' ? 'running' : 'paused');
                setCurrentTime(session.current_duration_seconds ?? 0);
                if (session.task_id != null && session.task_id !== undefined) {
                    setSelectedTaskId(String(session.task_id));
                }
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [isActivated]);

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
                if (session != null && String(session.id) === activeSessionId && session.status === 'ACTIVE') {
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
            console.debug('[TimeTracking] start session response', {
                sessionId: data.id,
                status: data.status,
                projectId: data.project_id,
                taskId: data.task_id ?? null,
            });
            setActiveSessionId(String(data.id));
            setSessionState('running');
            setCurrentTime(data.current_duration_seconds ?? 0);
            invalidateMyActiveWorkSession();
            // Set localStorage hint so next page load activates the provider immediately
            try { localStorage.setItem(SESSION_HINT_KEY, 'true'); } catch { /* noop */ }
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to start session. You may already have an active session.'));
        } finally {
            setIsSessionActionLoading(false);
        }
    }, [selectedTask, tasks, invalidateMyActiveWorkSession]);

    const handlePause = useCallback(async () => {
        if (!activeSessionId) return;
        setIsSessionActionLoading(true);
        try {
            const data = await pauseWorkSession(activeSessionId);
            setSessionState('paused');
            setCurrentTime(data.current_duration_seconds ?? 0);
            invalidateMyActiveWorkSession();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to pause session.'));
        } finally {
            setIsSessionActionLoading(false);
        }
    }, [activeSessionId, invalidateMyActiveWorkSession]);

    const handleResume = useCallback(async () => {
        if (!activeSessionId) return;
        setIsSessionActionLoading(true);
        try {
            const data = await resumeWorkSession(activeSessionId);
            setSessionState('running');
            setCurrentTime(data.current_duration_seconds ?? 0);
            invalidateMyActiveWorkSession();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to resume session.'));
        } finally {
            setIsSessionActionLoading(false);
        }
    }, [activeSessionId, invalidateMyActiveWorkSession]);

    const handleStop = useCallback(async () => {
        if (!activeSessionId) {
            toast.error('No active session to stop.');
            return;
        }
        setIsSessionActionLoading(true);
        try {
            // Keep backend and UI in sync: stop-flow starts from a paused session.
            if (sessionState === 'running') {
                const data = await pauseWorkSession(activeSessionId);
                setSessionState('paused');
                setCurrentTime(data.current_duration_seconds ?? 0);
                invalidateMyActiveWorkSession();
            } else if (sessionState !== 'paused') {
                const session = await fetchActiveWorkSession();
                if (!session) {
                    toast.error('No active session to stop.');
                    return;
                }
                if (session.status === 'ACTIVE') {
                    const data = await pauseWorkSession(String(session.id));
                    setSessionState('paused');
                    setCurrentTime(data.current_duration_seconds ?? 0);
                } else {
                    setSessionState('paused');
                    setCurrentTime(session.current_duration_seconds ?? 0);
                }
                setActiveSessionId(String(session.id));
                invalidateMyActiveWorkSession();
            }
            setIsLoggingModalOpen(true);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to prepare session for logging.'));
        } finally {
            setIsSessionActionLoading(false);
        }
    }, [activeSessionId, sessionState, invalidateMyActiveWorkSession]);

    const simulateAiGeneration = useCallback(async () => {
        if (!activeSessionId) {
            toast.error('Start a session first to use AI Fill from Commits.');
            return;
        }
        setIsAiGenerating(true);
        try {
            const res = await suggestSessionDescription(activeSessionId);
            const text = res?.suggested_description?.trim();
            if (text) {
                setLogForm((prev) => ({ ...prev, description: text }));
            } else {
                toast.error('No description suggested. There may be no recent commits for this project.');
            }
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'AI Fill from Commits failed. Try again or enter a description manually.'));
        } finally {
            setIsAiGenerating(false);
        }
    }, [activeSessionId]);

    const handleLogSubmit = useCallback(async (noteOverride?: string) => {
        if (!activeSessionId) {
            toast.error('No active session to log.');
            return;
        }
        setIsSessionActionLoading(true);
        try {
            const finalNote = noteOverride ?? logForm.description;
            await stopWorkSession(activeSessionId, { note: finalNote || undefined });
            setIsLoggingModalOpen(false);
            setSessionState('idle');
            setCurrentTime(0);
            setActiveSessionId(null);
            setLogForm({ task: '', description: '' });
            // Clear localStorage hint since session is over
            try { localStorage.removeItem(SESSION_HINT_KEY); } catch { /* noop */ }
            invalidateMyActiveWorkSession();
            refetchEntries();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Failed to log session.'));
        } finally {
            setIsSessionActionLoading(false);
        }
    }, [activeSessionId, logForm.description, refetchEntries, invalidateMyActiveWorkSession]);

    const handleLogCancel = useCallback(() => {
        setIsLoggingModalOpen(false);
        // Timer remains paused, user can resume or stop again
    }, []);

    const contextValue = useMemo<TimeTrackingContextProps>(
        () => ({
            activate,
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
        }),
        [
            activate,
            entries,
            entriesLoading,
            entriesError,
            refetchEntries,
            projectFilterId,
            sessionState,
            currentTime,
            activeSessionId,
            tasks,
            tasksLoading,
            tasksError,
            selectedTask,
            selectedTaskId,
            isLoggingModalOpen,
            logForm,
            isAiGenerating,
            simulateAiGeneration,
            handleStart,
            handlePause,
            handleResume,
            handleLogSubmit,
            handleLogCancel,
            handleStop,
            isSessionActionLoading,
        ]
    );

    return (
        <TimeTrackingContext.Provider value={contextValue}>
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
