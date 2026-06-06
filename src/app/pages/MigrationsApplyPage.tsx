/**
 * Step 3 of the migration wizard: confirm + apply.
 *
 * The page is a small state machine driven by `data.status`:
 *
 *   ready              → confirm view (target picker + summary + start CTA)
 *   applying           → live progress (SSE-driven counters)
 *   completed          → success card + 'View project' CTA
 *   failed             → destructive alert + Retry
 *   queued/parsing     → loading
 *   canceled           → terminal panel
 *
 * Apply runs server-side as a background task. We open the SSE stream while
 * we're applying so per-batch progress events arrive without polling. Per
 * arch doc §3.5, progress is purely informational — the canonical detail
 * GET is what we render on terminal events.
 */

import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    Loader2,
    RotateCcw,
    XCircle,
} from "lucide-react";

import { useApplyMigration, useMigration } from "@/api/migrations";
import { projectKeys } from "@/api/projects";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/app/components/ui/card";
import {
    ApplyTarget,
    MigrationApplyTargetCard,
} from "@/app/components/migrations/MigrationApplyTargetCard";
import { MigrationApplyProgress } from "@/app/components/migrations/MigrationApplyProgress";
import { MigrationApplySummary } from "@/app/components/migrations/MigrationApplySummary";
import { MigrationsPageHeader } from "@/app/components/migrations/MigrationsPageHeader";
import { MigrationsPageShell } from "@/app/components/migrations/MigrationsPageShell";
import { useMigrationEvents } from "@/app/components/migrations/useMigrationEvents";
import {
    migrationPreviewHref,
    migrationsNewHref,
} from "@/lib/workspacePaths";
import { isMigrationTerminal } from "@/types/migration";

interface ProgressState {
    batchIndex: number;
    tasksDone: number;
    tasksTotal: number;
}

export default function MigrationsApplyPage() {
    const navigate = useNavigate();
    const params = useParams<{ jobId?: string }>();
    const jobId = params.jobId ? Number(params.jobId) : undefined;

    const { data, isLoading } = useMigration(jobId);
    const apply = useApplyMigration(jobId);
    const qc = useQueryClient();

    const [target, setTarget] = useState<ApplyTarget>({ kind: "new" });
    const [progress, setProgress] = useState<ProgressState | null>(null);

    // Belt-and-braces: when the page itself sees the status flip to
    // 'completed' (e.g. after a refetch when Redis SSE isn't available),
    // invalidate the projects list so the imported project lands in the
    // sidebar without a hard refresh. The SSE consumer
    // (useMigrationEvents) does the same on migration.apply.done — this
    // covers the no-Redis case.
    useEffect(() => {
        if (data?.status === "completed") {
            qc.invalidateQueries({ queryKey: projectKeys.list() });
        }
    }, [data?.status, qc]);

    useMigrationEvents(jobId, {
        enabled: !!data && !isMigrationTerminal(data.status),
        onApplyStart: (e) =>
            setProgress({
                batchIndex: 0,
                tasksDone: 0,
                // Seed total from start event so the bar shows "0 / N" right
                // away; fall back to IR length if the server payload is empty.
                tasksTotal: e.tasks_total ?? data?.ir?.tasks.length ?? 0,
            }),
        onApplyProgress: (e) =>
            setProgress({
                batchIndex: e.batch_index,
                tasksDone: e.tasks_done,
                tasksTotal: e.tasks_total,
            }),
        onApplyDone: () => setProgress(null),
        onError: () => setProgress(null),
    });

    const suggestedProjectName = useMemo(
        () => data?.ir?.project.name ?? "Imported project",
        [data?.ir?.project.name],
    );
    const targetTaskCount = data?.ir?.tasks.length ?? 0;
    const targetMilestoneCount = data?.ir?.milestones.length ?? 0;

    if (jobId === undefined || Number.isNaN(jobId)) {
        return <Navigate to={migrationsNewHref()} replace />;
    }
    if (isLoading || !data) {
        return (
            <MigrationsPageShell>
                <div className="flex flex-1 items-center justify-center gap-3 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Loading…
                </div>
            </MigrationsPageShell>
        );
    }

    const status = data.status;

    const projectHref = data.target_project_id
        ? `/workspace/sprint?project=${data.target_project_id}`
        : null;

    const fireApply = () => {
        if (target.kind === "merge" && !target.projectId) return;
        apply.mutate({
            target_project_id: target.kind === "merge" ? target.projectId : null,
            dry_run: false,
        });
    };

    return (
        <MigrationsPageShell>
            <MigrationsPageHeader
                step="apply"
                title="Confirm import"
                subtitle="Pick where the imported project should land, then start the import."
                warningsCount={data.warnings.length}
            />
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
                <div className="mx-auto w-full max-w-3xl space-y-6">
                    {status === "ready" || status === "failed" ? (
                        <>
                            <MigrationApplyTargetCard
                                target={target}
                                onChange={setTarget}
                                suggestedProjectName={suggestedProjectName}
                                disabled={apply.isPending}
                            />
                            <Card>
                                <CardHeader>
                                    <CardTitle>Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                                        <div>
                                            <dt className="text-xs text-muted-foreground">Tasks</dt>
                                            <dd className="font-medium">
                                                {targetTaskCount.toLocaleString()}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-muted-foreground">
                                                Milestones
                                            </dt>
                                            <dd className="font-medium">{targetMilestoneCount}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-muted-foreground">Warnings</dt>
                                            <dd className="font-medium">{data.warnings.length}</dd>
                                        </div>
                                    </dl>
                                </CardContent>
                            </Card>
                            {status === "failed" ? (
                                <Alert variant="destructive">
                                    <XCircle aria-hidden="true" />
                                    <AlertTitle>Last import failed</AlertTitle>
                                    <AlertDescription>
                                        {data.error ?? "We rolled the import back. Nothing was written."}
                                    </AlertDescription>
                                </Alert>
                            ) : null}
                            <div className="flex items-center justify-between">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => navigate(migrationPreviewHref(jobId))}
                                    disabled={apply.isPending}
                                >
                                    <ArrowLeft aria-hidden="true" />
                                    Back to preview
                                </Button>
                                <Button
                                    type="button"
                                    onClick={fireApply}
                                    disabled={apply.isPending}
                                >
                                    {status === "failed" ? (
                                        <>
                                            <RotateCcw aria-hidden="true" />
                                            Retry import
                                        </>
                                    ) : apply.isPending ? (
                                        <>
                                            <Loader2 className="animate-spin" aria-hidden="true" />
                                            Starting…
                                        </>
                                    ) : (
                                        "Start import"
                                    )}
                                </Button>
                            </div>
                        </>
                    ) : null}

                    {status === "applying" ? (
                        <MigrationApplyProgress
                            tasksDone={progress?.tasksDone ?? 0}
                            tasksTotal={progress?.tasksTotal ?? targetTaskCount}
                            batchIndex={progress?.batchIndex ?? 0}
                        />
                    ) : null}

                    {status === "completed" ? (
                        <MigrationApplySummary stats={data.stats} projectHref={projectHref} />
                    ) : null}

                    {(status === "queued" || status === "parsing") ? (
                        <div className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" />
                            Still preparing your import. We'll refresh automatically.
                        </div>
                    ) : null}

                    {status === "canceled" ? (
                        <Alert>
                            <AlertTitle>Import canceled</AlertTitle>
                            <AlertDescription>
                                Nothing was written. You can start a fresh import from the upload screen.
                            </AlertDescription>
                        </Alert>
                    ) : null}
                </div>
            </div>
        </MigrationsPageShell>
    );
}
