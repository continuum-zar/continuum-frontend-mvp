import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useAllTasks, useLoggedHours } from '@/api/hooks';
import type { TaskOption } from '@/api/projects';

export interface TimeEntry {
    id: string;
    project: string;
    task: string;
    description?: string;
    duration: number;
    date: string;
}

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
    handleLogSubmit: () => void;
    handleLogCancel: () => void;
    handleStop: () => void;
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
    const [selectedTaskId, setSelectedTaskId] = useState('');

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

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (sessionState === 'running') {
            interval = setInterval(() => {
                setCurrentTime((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [sessionState]);

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

    const handleLogSubmit = () => {
        const activeTask = selectedTask ?? tasks[0];
        if (!activeTask) return;

        setIsLoggingModalOpen(false);
        setSessionState('idle');
        setCurrentTime(0);
        setLogForm({ task: '', description: '' });
        refetchEntries();
    };

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
                handleLogSubmit,
                handleLogCancel,
                handleStop,
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
