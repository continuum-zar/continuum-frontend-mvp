import { motion } from 'motion/react';
import { Link } from 'react-router';
import { WORKSPACE_BASE } from '@/lib/workspacePaths';
import {
    CheckCircle2,
    Clock,
    ArrowRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';

// --- MOCK DATA ---
const clientProjectStats = {
    name: 'Mobile App Redesign',
    overallProgress: 65,
    completedTasks: 42,
    totalTasks: 65,
    loggedHours: 124.5,
};

const currentMilestone = {
    name: 'Phase 2: Development',
    progress: 45,
    dueDate: '2026-03-15',
};

// Curated feed ignoring trivial commits
const curatedActivity = [
    { id: 1, type: 'milestone', title: 'Phase 1: Design Completed', date: 'Feb 15, 2026', icon: CheckCircle2, color: 'text-success' },
    { id: 2, type: 'structural', title: 'Database schema migration to support user profiles', date: 'Feb 18, 2026', desc: 'Core infrastructure update', icon: ArrowRight, color: 'text-primary' },
    { id: 3, type: 'task', title: 'Task Completed: Implement authentication flow', date: 'Feb 20, 2026', desc: 'Logged 8.5 hours', icon: CheckCircle2, color: 'text-success' },
    { id: 4, type: 'structural', title: 'Initial Dashboard API endpoints deployed', date: 'Feb 21, 2026', desc: 'Backend architecture', icon: ArrowRight, color: 'text-primary' },
];

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function ClientPortal() {
    return (
        <div className="p-8 pb-20 max-w-5xl mx-auto">
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-light mb-2">Project Progress</h1>
                <p className="text-muted-foreground">{clientProjectStats.name}</p>
            </div>

            <motion.div
                className="space-y-8"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {/* Big Picture Progress */}
                <motion.div variants={item} className="bg-card border border-border rounded-xl p-8 shadow-sm">
                    <h2 className="text-xl mb-6 font-medium">Overall Status</h2>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="font-medium">Project Completion</span>
                                <span className="text-2xl font-bold">{clientProjectStats.overallProgress}%</span>
                            </div>
                            <Progress value={clientProjectStats.overallProgress} className="h-4 bg-muted [&>div]:bg-primary" />
                            <div className="flex justify-between text-sm text-muted-foreground mt-2">
                                <span>{clientProjectStats.completedTasks} / {clientProjectStats.totalTasks} Tasks</span>
                                <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {clientProjectStats.loggedHours} hrs logged</span>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-border">
                            <div className="flex justify-between items-end mb-2">
                                <span className="font-medium text-muted-foreground">Current Milestone: {currentMilestone.name}</span>
                                <span className="text-lg font-bold">{currentMilestone.progress}%</span>
                            </div>
                            <Progress value={currentMilestone.progress} className="h-2 bg-muted [&>div]:bg-success" />
                            <div className="text-right text-sm text-muted-foreground mt-2">
                                Target: {currentMilestone.dueDate}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Curated Activity Feed */}
                <motion.div variants={item} className="bg-card border border-border rounded-xl p-8 shadow-sm">
                    <h2 className="text-xl mb-6 font-medium">Recent Highlights</h2>

                    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                        {curatedActivity.map((activity) => (
                            <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                {/* Timeline Marker */}
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-card bg-muted shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow flex-shrink-0 z-10 ${activity.color}`}>
                                    <activity.icon className="w-4 h-4" />
                                </div>

                                {/* Content Card */}
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-border bg-card shadow-sm">
                                    <div className="flex items-center justify-between space-x-2 mb-1">
                                        <div className="font-bold text-foreground">{activity.title}</div>
                                        <time className="text-xs font-medium text-muted-foreground whitespace-nowrap">{activity.date}</time>
                                    </div>
                                    {activity.desc && (
                                        <div className="text-sm text-muted-foreground">{activity.desc}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 text-center pt-8 border-t border-border">
                        <Link to={WORKSPACE_BASE}>
                            <Button variant="outline">Back to overview</Button>
                        </Link>
                    </div>
                </motion.div>

            </motion.div>
        </div>
    );
}
