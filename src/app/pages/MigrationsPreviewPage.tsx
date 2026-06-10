/**
 * Step 2 of the migration wizard: preview + mapping.
 *
 * Layout follows the architecture doc §3.7.a:
 *   Left pane:   <MigrationIRTree>
 *   Right pane:  <MigrationMappingPanel kind="status">
 *                <MigrationMappingPanel kind="priority">
 *                <MigrationWarningsList>
 *
 * The Continue button is NEVER disabled. Warnings are a chip in the header.
 *
 * Mapping edits are pushed through useDebouncedMappingPatch (400 ms). The
 * server is the source of truth for warning recomputation; the detail
 * query refreshes on each PATCH success so the panel summaries stay
 * accurate.
 */

import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import { useMigration } from "@/api/migrations";
import { Button } from "@/app/components/ui/button";
import { MigrationIRTree } from "@/app/components/migrations/MigrationIRTree";
import { MigrationMappingPanel } from "@/app/components/migrations/MigrationMappingPanel";
import { MigrationWarningsList } from "@/app/components/migrations/MigrationWarningsList";
import { MigrationsPageHeader } from "@/app/components/migrations/MigrationsPageHeader";
import { MigrationsPageShell } from "@/app/components/migrations/MigrationsPageShell";
import { useDebouncedMappingPatch } from "@/app/components/migrations/useDebouncedMappingPatch";
import { useMigrationEvents } from "@/app/components/migrations/useMigrationEvents";
import { migrationApplyHref, migrationsNewHref } from "@/lib/workspacePaths";
import { isMigrationTerminal } from "@/types/migration";


export default function MigrationsPreviewPage() {
    const navigate = useNavigate();
    const params = useParams<{ jobId?: string }>();
    const jobId = params.jobId ? Number(params.jobId) : undefined;

    const { data, isLoading, error } = useMigration(jobId);
    const overrides = data?.mapping_overrides ?? {};
    const { schedule, flush } = useDebouncedMappingPatch(jobId);

    const [focusedTaskExtId, setFocusedTaskExtId] = useState<string | null>(null);

    useMigrationEvents(jobId, {
        enabled: !!data && !isMigrationTerminal(data.status),
    });

    const warningsCount = data?.warnings.length ?? 0;

    const irPanelEmpty = useMemo(() => {
        if (!data?.ir) return true;
        return data.ir.tasks.length === 0;
    }, [data?.ir]);

    if (jobId === undefined || Number.isNaN(jobId)) {
        return <Navigate to={migrationsNewHref()} replace />;
    }
    if (isLoading || !data) {
        return (
            <MigrationsPageShell>
                <div className="flex flex-1 items-center justify-center gap-3 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Loading preview…
                </div>
            </MigrationsPageShell>
        );
    }
    if (error || !data.ir) {
        return (
            <MigrationsPageShell>
                <MigrationsPageHeader step="preview" title="Preview unavailable" />
                <div className="p-6">
                    <p className="text-sm text-destructive">
                        We couldn't load this import. {data?.error ?? "Try uploading the file again."}
                    </p>
                    <Button
                        className="mt-4"
                        variant="outline"
                        onClick={() => navigate(migrationsNewHref())}
                    >
                        Start over
                    </Button>
                </div>
            </MigrationsPageShell>
        );
    }

    return (
        <MigrationsPageShell>
            <MigrationsPageHeader
                step="preview"
                title="Preview"
                subtitle="Check what's about to be created. Tweak the mappings if anything looks off — you don't have to fix every warning."
                warningsCount={warningsCount}
            />
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div className="min-h-0 rounded-md border border-border bg-card">
                    {irPanelEmpty ? (
                        <div className="flex h-full items-center justify-center px-6 py-10 text-sm text-muted-foreground">
                            This export contained no tasks.
                        </div>
                    ) : (
                        <MigrationIRTree
                            ir={data.ir}
                            focusedTaskExtId={focusedTaskExtId}
                        />
                    )}
                </div>
                <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
                    <MigrationMappingPanel
                        kind="status"
                        ir={data.ir}
                        overrides={overrides}
                        onChange={(raw, value) =>
                            schedule({ status_map: { [raw]: value } })
                        }
                    />
                    <MigrationMappingPanel
                        kind="priority"
                        ir={data.ir}
                        overrides={overrides}
                        onChange={(raw, value) =>
                            schedule({ priority_map: { [raw]: value } })
                        }
                    />
                    <MigrationWarningsList
                        warnings={data.warnings}
                        onJumpTo={(intent) => {
                            if (intent.taskExtId) {
                                setFocusedTaskExtId(intent.taskExtId);
                                const el = document.getElementById(
                                    `migration-task-${intent.taskExtId}`,
                                );
                                if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                            }
                        }}
                    />
                </div>
            </div>
            <div className="flex items-center justify-between border-t border-[#ebedee] px-6 py-3">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate(migrationsNewHref())}
                >
                    <ArrowLeft aria-hidden="true" />
                    Back
                </Button>
                <Button
                    type="button"
                    onClick={() => {
                        flush();
                        navigate(migrationApplyHref(jobId));
                    }}
                >
                    Continue
                    <ArrowRight aria-hidden="true" />
                </Button>
            </div>
        </MigrationsPageShell>
    );
}
