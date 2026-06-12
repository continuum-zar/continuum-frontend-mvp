/**
 * Status-driven entry point for `/workspace/migrations/:jobId` (no step).
 *
 *   queued / parsing  → loading panel (we'll be reloaded by SSE invalidation)
 *   ready             → /preview
 *   applying / completed / failed / canceled → /apply
 *
 * Lets the user share or bookmark a single URL per job; the page picks the
 * right step automatically.
 */

import { Navigate, useParams } from "react-router";
import { Loader2 } from "lucide-react";

import { useMigration } from "@/api/migrations";
import { MigrationsPageShell } from "@/app/components/migrations/MigrationsPageShell";
import {
    migrationApplyHref,
    migrationPreviewHref,
    migrationsNewHref,
} from "@/lib/workspacePaths";

export default function MigrationsJobRedirect() {
    const params = useParams<{ jobId?: string }>();
    const jobId = params.jobId ? Number(params.jobId) : undefined;
    const { data, isLoading } = useMigration(jobId);

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

    switch (data.status) {
        case "ready":
            return <Navigate to={migrationPreviewHref(jobId)} replace />;
        case "queued":
        case "parsing":
            // Detail will flip via SSE → query invalidation → this redirect re-evaluates.
            return (
                <MigrationsPageShell>
                    <div className="flex flex-1 items-center justify-center gap-3 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        Still preparing your import…
                    </div>
                </MigrationsPageShell>
            );
        case "applying":
        case "completed":
        case "failed":
        case "canceled":
        default:
            return <Navigate to={migrationApplyHref(jobId)} replace />;
    }
}
