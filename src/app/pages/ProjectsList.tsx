import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import {
    Plus,
    FolderOpen,
    Calendar,
    Users,
    MoreVertical,
    ArrowRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const initialProjects = [
    {
        id: 'p1',
        title: 'Mobile App Redesign',
        description: 'Complete overhaul of the iOS and Android applications including new design system implementation.',
        status: 'active',
        progress: 45,
        dueDate: '2026-05-15',
        teamSize: 6,
        lastActive: '2 hours ago'
    },
    {
        id: 'p2',
        title: 'Client Portal Migration',
        description: 'Migrating legacy client tools into the new React-based portal architecture.',
        status: 'active',
        progress: 15,
        dueDate: '2026-08-01',
        teamSize: 4,
        lastActive: '5 hours ago'
    },
    {
        id: 'p3',
        title: 'Q1 Marketing Site',
        description: 'Launch the new marketing landing pages for the Q1 ad campaign.',
        status: 'completed',
        progress: 100,
        dueDate: '2026-01-30',
        teamSize: 3,
        lastActive: '3 weeks ago'
    }
];

export function ProjectsList() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState(initialProjects);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newProject, setNewProject] = useState({ title: '', desc: '', date: '' });

    const getProgressColor = (progress: number) => {
        if (progress < 40) return "bg-red-500";
        if (progress < 75) return "bg-blue-500";
        return "bg-green-500";
    };

    const handleCreateProject = () => {
        if (!newProject.title) return;

        const newP = {
            id: `p${Date.now()}`,
            title: newProject.title,
            description: newProject.desc || 'No description provided.',
            status: 'active',
            progress: 0,
            dueDate: newProject.date || 'No Date',
            teamSize: 1, // Defaulting to 1 (creator)
            lastActive: 'Just now'
        };

        setProjects([newP, ...projects]);
        setIsAddOpen(false);
        setNewProject({ title: '', desc: '', date: '' });
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl mb-2 flex items-center gap-2">
                        <FolderOpen className="h-6 w-6 text-primary" />
                        Projects Hub
                    </h1>
                    <p className="text-muted-foreground">Manage your active projects and track high-level progress.</p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Project
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create New Project</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Project Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Q3 Platform Audit"
                                    value={newProject.title}
                                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date">Target Delivery Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={newProject.date}
                                    onChange={(e) => setNewProject({ ...newProject, date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="desc">Description</Label>
                                <Textarea
                                    id="desc"
                                    placeholder="High level project goals..."
                                    value={newProject.desc}
                                    onChange={(e) => setNewProject({ ...newProject, desc: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateProject} disabled={!newProject.title}>Initialize Project</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-card border border-border rounded-lg p-6 flex flex-col items-center justify-center text-center">
                    <div className="text-3xl font-bold mb-1">{projects.length}</div>
                    <div className="text-sm text-muted-foreground">Total Projects</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-6 flex flex-col items-center justify-center text-center">
                    <div className="text-3xl font-bold mb-1">{projects.filter(p => p.status === 'active').length}</div>
                    <div className="text-sm text-muted-foreground">Active</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-6 flex flex-col items-center justify-center text-center">
                    <div className="text-3xl font-bold mb-1">{projects.filter(p => p.status === 'completed').length}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                </div>
            </div>

            {/* Project Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {projects.map((project, index) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="group bg-card border border-border rounded-lg p-6 cursor-pointer hover:border-foreground/50 transition-all hover:shadow-md relative overflow-hidden"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="pr-8">
                                <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">{project.title}</h3>
                                <Badge variant={project.status === 'completed' ? 'secondary' : 'default'} className="font-mono text-[10px] tracking-wider uppercase">
                                    {project.status}
                                </Badge>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 -m-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Edit Details</DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-destructive">Archive Project</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <p className="text-sm text-muted-foreground mb-6 line-clamp-2 min-h-[40px]">
                            {project.description}
                        </p>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium text-foreground">Progress</span>
                                    <span className="text-muted-foreground">{project.progress}%</span>
                                </div>
                                <Progress value={project.progress} className="h-1.5" indicatorClassName={getProgressColor(project.progress)} />
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        <Calendar className="w-3 h-3 mr-1.5" />
                                        {project.dueDate}
                                    </div>
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        <Users className="w-3 h-3 mr-1.5" />
                                        {project.teamSize}
                                    </div>
                                </div>

                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                                    <ArrowRight className="w-3 h-3 text-primary group-hover:text-primary-foreground" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
