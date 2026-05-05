import { useLocation } from 'react-router';
import { motion } from 'motion/react';
import { Play, Pause, Square, Loader2 } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from './dialog';
import { useTimeTracking } from '../../context/TimeTrackingContext';
import { isTimeTrackingRoutePath } from '@/lib/timeTrackingPaths';

const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export function GlobalActiveSession({ showSessionChip = true }: { showSessionChip?: boolean } = {}) {
    const location = useLocation();
    const {
        sessionState,
        currentTime,
        selectedTask,
        isLoggingModalOpen,
        setIsLoggingModalOpen,
        logForm,
        setLogForm,
        isAiGenerating,
        simulateAiGeneration,
        handlePause,
        handleResume,
        handleLogSubmit,
        handleLogCancel,
        handleStop,
        isSessionActionLoading,
    } = useTimeTracking();

    // Hide on full time views or if idle and modal is not open
    if (isTimeTrackingRoutePath(location.pathname) || (sessionState === 'idle' && !isLoggingModalOpen)) {
        return null;
    }

    const activeTask = selectedTask;

    return (
        <>
            {showSessionChip && sessionState !== 'idle' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group flex items-center bg-card border border-border rounded-full px-4 py-1.5 shadow-sm"
                >
                    <div className={`text-sm font-mono font-medium ${sessionState === 'running' ? 'text-primary' : 'text-muted-foreground'} w-[70px]`}>
                        {formatTime(currentTime)}
                    </div>

                    <div className="relative h-6 flex items-center ml-2 w-[180px] overflow-hidden">
                        {/* Normal State - Hidden on Group Hover */}
                        <div className="absolute left-0 flex items-center space-x-2 transition-opacity duration-200 opacity-100 group-hover:opacity-0 group-hover:pointer-events-none">
                            <span className="text-xs font-medium max-w-[100px] truncate" title={activeTask?.title}>
                                {activeTask?.title ?? 'No task'}
                            </span>
                            {sessionState === 'running' ? (
                                <div className="flex items-center text-[10px] text-primary uppercase font-bold tracking-wider">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full mr-1.5 animate-pulse" />
                                    Tracking
                                </div>
                            ) : (
                                <div className="flex items-center text-[10px] text-warning uppercase font-bold tracking-wider">
                                    <div className="w-1.5 h-1.5 bg-warning rounded-full mr-1.5" />
                                    Paused
                                </div>
                            )}
                        </div>

                        {/* Hover State - Shown on Group Hover */}
                        <div className="absolute left-0 flex items-center space-x-1 transition-opacity duration-200 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
                            {sessionState === 'running' && (
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handlePause} disabled={isSessionActionLoading}>
                                    <Pause className="mr-1 h-3 w-3" /> Pause
                                </Button>
                            )}
                            {sessionState === 'paused' && (
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary" onClick={handleResume} disabled={isSessionActionLoading}>
                                    <Play className="mr-1 h-3 w-3" /> Resume
                                </Button>
                            )}
                            <Button variant="destructive" size="sm" className="h-6 px-2 text-xs" onClick={handleStop} disabled={isSessionActionLoading}>
                                <Square className="mr-1 h-3 w-3" /> Stop
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Session Logging Modal */}
            <Dialog open={isLoggingModalOpen} onOpenChange={setIsLoggingModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Log Time Session</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label>Project</Label>
                                <Input value={activeTask?.project ?? ''} disabled className="bg-muted/50" />
                            </div>
                            <div className="grid grid-cols-[1fr,auto] gap-4">
                                <div className="space-y-2">
                                    <Label>Task</Label>
                                    <Input value={activeTask?.title ?? ''} disabled className="bg-muted/50 truncate" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Time Tracked</Label>
                                    <Input value={formatTime(currentTime)} disabled className="font-mono bg-muted/50 w-[120px] text-center" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 relative mt-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="desc">Work Description</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10 -mr-2"
                                    onClick={simulateAiGeneration}
                                    disabled={isAiGenerating}
                                >
                                    {isAiGenerating ? (
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    ) : null}
                                    AI Fill from Commits
                                </Button>
                            </div>
                            <Textarea
                                id="desc"
                                className="min-h-[100px] resize-none"
                                placeholder="Describe the work completed during this session..."
                                value={logForm.description}
                                onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleLogCancel} disabled={isSessionActionLoading}>Cancel</Button>
                        <Button onClick={() => void handleLogSubmit()} disabled={isSessionActionLoading}>
                            {isSessionActionLoading ? (
                                <>
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    Logging...
                                </>
                            ) : (
                                'Log Session'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
