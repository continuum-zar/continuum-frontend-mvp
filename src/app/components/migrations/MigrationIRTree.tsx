/**
 * Tree view of the parsed IR shown in the left pane of the Preview screen.
 *
 *   Project root (Apollo)
 *   ├── Sprint 12         · 12 tasks · ⚠ 2
 *   │   ├── APL-1 Wire telemetry      [in-progress] [high] [ada]
 *   │   └── APL-2 Prereq              [todo]
 *   └── Unscheduled       · 4 tasks
 *
 * Milestones are `<Collapsible>` rows. Tasks render with the existing
 * `KanbanTaskMetaPills` so the status / priority / assignee chips look
 * identical to the kanban board — same visual idiom, not a new one.
 *
 * Virtualization is intentionally NOT used here yet (per
 * `guidelines/lists.md` — kick in only at >100 rows per group). Real
 * Jira exports rarely have >50 issues per sprint; we'll revisit if the
 * pattern needs it.
 */

import * as React from "react";
import {
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    FolderOpen,
    Inbox,
    ListTree,
} from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/app/components/ui/collapsible";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { cn } from "@/app/components/ui/utils";
import type { CanonicalProjectIR, IRTask, IRWarning } from "@/types/migration";

interface MigrationIRTreeProps {
    ir: CanonicalProjectIR;
    /** When non-null, the task with this ext_id gets a highlight ring. Used
     *  by the warnings list "Fix this" action. */
    focusedTaskExtId?: string | null;
}

interface TaskGroup {
    key: string;
    label: string;
    tasks: IRTask[];
}

function groupTasksByMilestone(ir: CanonicalProjectIR): TaskGroup[] {
    const byMilestone = new Map<string, IRTask[]>();
    const unscheduled: IRTask[] = [];
    for (const t of ir.tasks) {
        if (t.milestone_ext_id) {
            const arr = byMilestone.get(t.milestone_ext_id) ?? [];
            arr.push(t);
            byMilestone.set(t.milestone_ext_id, arr);
        } else {
            unscheduled.push(t);
        }
    }
    const groups: TaskGroup[] = ir.milestones.map((m) => ({
        key: m.ext_id,
        label: m.name,
        tasks: byMilestone.get(m.ext_id) ?? [],
    }));
    // Tasks whose milestone_ext_id doesn't match an IR milestone are
    // surfaced under Unscheduled too — defensive.
    for (const [ext, tasks] of byMilestone.entries()) {
        if (!ir.milestones.some((m) => m.ext_id === ext)) {
            unscheduled.push(...tasks);
        }
    }
    if (unscheduled.length > 0) {
        groups.push({ key: "__unscheduled__", label: "Unscheduled", tasks: unscheduled });
    }
    return groups;
}

function warningsByExtId(warnings: IRWarning[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const w of warnings) {
        if (!w.ext_id) continue;
        counts.set(w.ext_id, (counts.get(w.ext_id) ?? 0) + 1);
    }
    return counts;
}

export function MigrationIRTree({ ir, focusedTaskExtId }: MigrationIRTreeProps) {
    const groups = React.useMemo(() => groupTasksByMilestone(ir), [ir]);
    const warningCounts = React.useMemo(
        () => warningsByExtId(ir.warnings),
        [ir.warnings],
    );

    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col gap-3 p-4">
                <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <FolderOpen className="size-4 text-muted-foreground" aria-hidden="true" />
                        {ir.project.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ListTree className="size-3.5" aria-hidden="true" />
                        {ir.tasks.length} task{ir.tasks.length === 1 ? "" : "s"}
                    </div>
                </header>

                {groups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No tasks found in this export.
                    </p>
                ) : (
                    groups.map((group) => (
                        <MilestoneGroup
                            key={group.key}
                            group={group}
                            warningCounts={warningCounts}
                            focusedTaskExtId={focusedTaskExtId}
                        />
                    ))
                )}
            </div>
        </ScrollArea>
    );
}

interface MilestoneGroupProps {
    group: TaskGroup;
    warningCounts: Map<string, number>;
    focusedTaskExtId?: string | null;
}

function MilestoneGroup({ group, warningCounts, focusedTaskExtId }: MilestoneGroupProps) {
    const containsFocused =
        focusedTaskExtId !== null &&
        focusedTaskExtId !== undefined &&
        group.tasks.some((t) => t.ext_id === focusedTaskExtId);
    const [open, setOpen] = React.useState(true);
    React.useEffect(() => {
        if (containsFocused) setOpen(true);
    }, [containsFocused]);

    const groupWarningCount = group.tasks.reduce(
        (sum, t) => sum + (warningCounts.get(t.ext_id) ?? 0),
        0,
    );

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "group flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium",
                        "hover:bg-muted/60",
                    )}
                >
                    <span className="flex items-center gap-2">
                        {open ? (
                            <ChevronDown
                                className="size-3.5 text-muted-foreground"
                                aria-hidden="true"
                            />
                        ) : (
                            <ChevronRight
                                className="size-3.5 text-muted-foreground"
                                aria-hidden="true"
                            />
                        )}
                        {group.key === "__unscheduled__" ? (
                            <Inbox
                                className="size-3.5 text-muted-foreground"
                                aria-hidden="true"
                            />
                        ) : null}
                        <span>{group.label}</span>
                    </span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                            {group.tasks.length} task{group.tasks.length === 1 ? "" : "s"}
                        </span>
                        {groupWarningCount > 0 ? (
                            <Badge variant="warning" className="px-1.5 py-0">
                                <AlertTriangle className="size-3" aria-hidden="true" />
                                {groupWarningCount}
                            </Badge>
                        ) : null}
                    </span>
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <ul className="mt-1 space-y-1 pl-6">
                    {group.tasks.map((task) => (
                        <TaskRow
                            key={task.ext_id}
                            task={task}
                            warningCount={warningCounts.get(task.ext_id) ?? 0}
                            focused={focusedTaskExtId === task.ext_id}
                        />
                    ))}
                </ul>
            </CollapsibleContent>
        </Collapsible>
    );
}

interface TaskRowProps {
    task: IRTask;
    warningCount: number;
    focused: boolean;
}

function TaskRow({ task, warningCount, focused }: TaskRowProps) {
    return (
        <li
            id={`migration-task-${task.ext_id}`}
            className={cn(
                "flex items-center justify-between gap-3 rounded-sm border border-transparent px-2 py-1 text-sm transition-colors",
                "hover:bg-muted/50",
                focused && "border-primary bg-primary/5 ring-1 ring-primary",
            )}
        >
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                        {task.ext_id}
                    </span>
                    <span className="truncate text-foreground">{task.title}</span>
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                {task.status ? (
                    <Badge variant="outline" className="font-normal">
                        {task.status.replace(/_/g, " ").replace(/-/g, " ")}
                    </Badge>
                ) : null}
                {task.priority ? (
                    <Badge variant="secondary" className="font-normal">
                        {task.priority}
                    </Badge>
                ) : null}
                {warningCount > 0 ? (
                    <Badge variant="warning" className="px-1.5 py-0">
                        <AlertTriangle className="size-3" aria-hidden="true" />
                        {warningCount}
                    </Badge>
                ) : null}
            </div>
        </li>
    );
}
