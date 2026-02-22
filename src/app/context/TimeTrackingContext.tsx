import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface TimeEntry {
    id: string;
    project: string;
    task: string;
    description?: string;
    duration: number;
    date: string;
}

const initialTimeEntries: TimeEntry[] = [
    { id: '1', project: 'Mobile App Redesign', task: 'Implement dark mode', description: 'Added next-themes, configured dark mode palette, updated root layout.', duration: 180, date: '2026-02-21' },
    { id: '2', project: 'Dashboard v2', task: 'API integration', description: 'Wired up the useQuery hooks for the velocity metrics.', duration: 120, date: '2026-02-21' },
    { id: '3', project: 'Mobile App Redesign', task: 'Design review', duration: 60, date: '2026-02-20' },
    { id: '4', project: 'Marketing Website', task: 'Landing page optimization', duration: 240, date: '2026-02-20' },
    { id: '5', project: 'Dashboard v2', task: 'Database queries', duration: 150, date: '2026-02-19' },
    { id: '6', project: 'Mobile App Redesign', task: 'Component library', duration: 210, date: '2026-02-19' },
];

export const myTasks = [
    { id: 't1', title: 'Implement dark mode toggle', project: 'Mobile App Redesign' },
    { id: 't2', title: 'Refactor Time Tracking widget', project: 'Dashboard v2' },
    { id: 't3', title: 'Write tests for routing logic', project: 'Dashboard v2' },
    { id: 't4', title: 'Deploy staging environment', project: 'Marketing Website' },
    { id: 't5', title: 'Optimize React component renders', project: 'Mobile App Redesign' },
];

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
    entries: TimeEntry[];
    setEntries: React.Dispatch<React.SetStateAction<TimeEntry[]>>;
    sessionState: SessionState;
    setSessionState: React.Dispatch<React.SetStateAction<SessionState>>;
    currentTime: number;
    setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
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
    const [entries, setEntries] = useState<TimeEntry[]>(initialTimeEntries);
    const [sessionState, setSessionState] = useState<SessionState>('idle');
    const [currentTime, setCurrentTime] = useState(0);
    const [selectedTaskId, setSelectedTaskId] = useState(myTasks[0].id);

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
        const activeTask = myTasks.find(t => t.id === selectedTaskId) || myTasks[0];

        const newEntry: TimeEntry = {
            id: `e${Date.now()}`,
            project: activeTask.project,
            task: activeTask.title,
            description: logForm.description,
            duration: Math.max(1, Math.floor(currentTime / 60)), // Convert seconds to minutes, min 1
            date: new Date().toISOString().split('T')[0],
        };

        setEntries([newEntry, ...entries]);
        setIsLoggingModalOpen(false);
        setSessionState('idle');
        setCurrentTime(0);
        setLogForm({ task: '', description: '' });
    };

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

export function useTimeTracking() {
    const context = useContext(TimeTrackingContext);
    if (context === undefined) {
        throw new Error('useTimeTracking must be used within a TimeTrackingProvider');
    }
    return context;
}
