/**
 * Final card shown on the Apply screen after a successful import.
 *
 *   ┌────────────────────────────────────────────┐
 *   │ ✓ Import complete                          │
 *   │                                            │
 *   │ Created 187 tasks · 4 milestones           │
 *   │ Sent 5 invitations · 3 warnings remaining  │
 *   │                                            │
 *   │ [ View project → ]                         │
 *   └────────────────────────────────────────────┘
 */

import { Link } from "react-router";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import type { MigrationStats } from "@/types/migration";

interface MigrationApplySummaryProps {
    stats: MigrationStats;
    /** When set, the "View project" button links here. */
    projectHref?: string | null;
}

function fmt(value: number | undefined): string {
    return (value ?? 0).toLocaleString();
}

export function MigrationApplySummary({ stats, projectHref }: MigrationApplySummaryProps) {
    const tasks = (stats.tasks_created ?? 0) + (stats.tasks_updated ?? 0);
    const milestones =
        (stats.milestones_created ?? 0) + (stats.milestones_updated ?? 0);
    const invitations = stats.invitations ?? 0;

    return (
        <Card className="border-success/30">
            <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                    <CheckCircle2
                        aria-hidden="true"
                        className="size-5 text-success"
                    />
                    <p className="text-lg font-medium text-foreground">Import complete</p>
                </div>

                <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                        <dt className="text-xs text-muted-foreground">Tasks</dt>
                        <dd className="font-medium">{fmt(tasks)}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-muted-foreground">Milestones</dt>
                        <dd className="font-medium">{fmt(milestones)}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-muted-foreground">Labels</dt>
                        <dd className="font-medium">{fmt(stats.labels)}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-muted-foreground">Invitations</dt>
                        <dd className="font-medium">{fmt(invitations)}</dd>
                    </div>
                </dl>

                {projectHref ? (
                    <div className="pt-2">
                        <Button asChild>
                            <Link to={projectHref}>View project</Link>
                        </Button>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
