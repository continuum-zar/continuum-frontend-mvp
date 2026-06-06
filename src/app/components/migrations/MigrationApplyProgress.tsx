/**
 * Live progress UI on the Apply screen. Stateless — driven by the
 * `migration.apply.progress` SSE event payload held in the page's local
 * state.
 *
 *   ▰▰▰▰▰▱▱▱▱▱   1,500 / 3,200 tasks · batch 3 / 7
 */

import { Loader2 } from "lucide-react";

import { Progress } from "@/app/components/ui/progress";

interface MigrationApplyProgressProps {
    tasksDone: number;
    tasksTotal: number;
    batchIndex: number;
    /** Optional. When undefined we render `batch N` without the total. */
    batchTotal?: number;
}

export function MigrationApplyProgress({
    tasksDone,
    tasksTotal,
    batchIndex,
    batchTotal,
}: MigrationApplyProgressProps) {
    const pct = tasksTotal === 0 ? 0 : Math.min(100, (tasksDone / tasksTotal) * 100);
    return (
        <div className="space-y-3 rounded-md border border-border bg-card p-4">
            <div className="flex items-center gap-3">
                <Loader2 className="size-4 animate-spin text-primary" />
                <p className="text-sm font-medium text-foreground">
                    Importing your project…
                </p>
            </div>
            <Progress
                value={pct}
                aria-valuetext={`${tasksDone.toLocaleString()} of ${tasksTotal.toLocaleString()} tasks`}
                // Slightly slower than the default 150 ms so consecutive
                // SSE ticks (one per 50-task batch ≈ every 100-300 ms) blend
                // into a continuous motion instead of snapping.
                indicatorClassName="bg-primary transition-all duration-300 ease-out"
            />
            <p className="text-xs text-muted-foreground tabular-nums">
                {tasksDone.toLocaleString()} / {tasksTotal.toLocaleString()} tasks
                {batchTotal
                    ? ` · batch ${batchIndex + 1} / ${batchTotal}`
                    : ` · batch ${batchIndex + 1}`}
            </p>
        </div>
    );
}
