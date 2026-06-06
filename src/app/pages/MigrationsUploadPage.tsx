/**
 * Step 1 of the migration wizard: upload + parse.
 *
 * Lifecycle:
 *   1. User drops a CSV/JSON and picks a source hint (optional) + skip-done.
 *   2. POST /migrations/upload (uploadMigration). The backend parses inline
 *      and returns a job whose status is already 'ready' or 'failed'.
 *   3. If the response says 'ready' we navigate straight to the preview
 *      page. If 'failed' (e.g. binary file) we render the error inline
 *      and let the user pick a different file.
 *   4. SSE isn't strictly needed here (parse is synchronous) but we still
 *      open it after the upload returns so future async paths (e.g. very
 *      large files queued in the background) Just Work.
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import { useUploadMigration } from "@/api/migrations";
import { Button } from "@/app/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import { MigrationDropzone } from "@/app/components/migrations/MigrationDropzone";
import { MigrationsPageHeader } from "@/app/components/migrations/MigrationsPageHeader";
import { MigrationsPageShell } from "@/app/components/migrations/MigrationsPageShell";
import { MigrationsSourceHintSelect } from "@/app/components/migrations/MigrationsSourceHintSelect";
import {
    migrationPreviewHref,
} from "@/lib/workspacePaths";
import type { SourceHintOption } from "@/types/migration";


export default function MigrationsUploadPage() {
    const navigate = useNavigate();
    const upload = useUploadMigration();

    const [file, setFile] = useState<File | null>(null);
    const [sourceHint, setSourceHint] = useState<SourceHintOption>("auto");
    const [skipDone, setSkipDone] = useState(false);
    // Default ON for Trello / Asana / generic CSV (no native sprints).
    // Jira CSVs already carry Sprint columns so the catch-all rarely fires;
    // the user can still flip it on if they want LLM grouping on top.
    const [autoGroupMilestones, setAutoGroupMilestones] = useState(true);
    const [parseError, setParseError] = useState<string | null>(null);

    const isUploading = upload.isPending;

    const handleContinue = async () => {
        if (!file || isUploading) return;
        setParseError(null);
        try {
            const result = await upload.mutateAsync({
                file,
                sourceHint,
                autoGroupMilestones,
            });
            if (result.status === "failed") {
                setParseError(
                    "We couldn't read this file. Double-check it's the original export, then try again.",
                );
                return;
            }
            // skip_done lands as a mapping override BEFORE the user reaches
            // the apply screen — keeps the toggle's intent intact even if
            // they go back and tweak mappings.
            if (skipDone) {
                // Fire-and-forget — usePatchMigrationMapping is wired up the
                // moment the preview page mounts useDebouncedMappingPatch, but
                // we don't have a job-scoped hook here, so we PATCH inline.
                const { patchMigrationMapping } = await import("@/api/migrations");
                try {
                    await patchMigrationMapping(result.job_id, { skip_done: true });
                } catch {
                    // Non-fatal — user can re-toggle on the preview screen.
                }
            }
            navigate(migrationPreviewHref(result.job_id));
        } catch {
            // Errors are surfaced via toast inside useUploadMigration.
        }
    };

    return (
        <MigrationsPageShell>
            <MigrationsPageHeader
                step="upload"
                title="Import projects"
                subtitle="Bring your work over from Jira, Trello, or Asana. We'll show you a preview before anything lands in Continuum."
            />
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
                <div className="mx-auto w-full max-w-2xl space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Choose your export</CardTitle>
                            <CardDescription>
                                CSV (Jira, Asana, generic) or JSON (Trello). Up to 50 MB.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <MigrationDropzone
                                file={file}
                                onFileChosen={(f) => {
                                    setFile(f);
                                    setParseError(null);
                                }}
                                onCleared={() => {
                                    setFile(null);
                                    setParseError(null);
                                }}
                                disabled={isUploading}
                                busyLabel={isUploading ? "Reading export…" : undefined}
                            />
                            {parseError ? (
                                <p className="mt-3 text-sm text-destructive" role="alert">
                                    {parseError}
                                </p>
                            ) : null}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>2. Tell us a bit about it</CardTitle>
                            <CardDescription>
                                Both options are optional.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="migration-source-hint">
                                    Source tool
                                </Label>
                                <MigrationsSourceHintSelect
                                    id="migration-source-hint"
                                    value={sourceHint}
                                    onChange={setSourceHint}
                                    disabled={isUploading}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Pick a tool if auto-detection guesses wrong.
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="migration-skip-done"
                                    checked={skipDone}
                                    onCheckedChange={(v) => setSkipDone(v === true)}
                                    disabled={isUploading}
                                />
                                <div className="space-y-0.5">
                                    <Label htmlFor="migration-skip-done">
                                        Skip tasks already marked done
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Keeps your imported project clean of closed history. You can change this on the next screen.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="migration-auto-group"
                                    checked={autoGroupMilestones}
                                    onCheckedChange={(v) =>
                                        setAutoGroupMilestones(v === true)
                                    }
                                    disabled={isUploading}
                                />
                                <div className="space-y-0.5">
                                    <Label htmlFor="migration-auto-group">
                                        Auto-organize tasks into milestones
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Groups your imported tasks into a small number of themed milestones (e.g. &ldquo;Onboarding flow&rdquo;, &ldquo;Cleanup&rdquo;) so the new project has structure on day one. You can rename, split, or remove them in the preview.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-between">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => navigate(-1)}
                            disabled={isUploading}
                        >
                            <ArrowLeft aria-hidden="true" />
                            Back
                        </Button>
                        <Button
                            type="button"
                            onClick={handleContinue}
                            disabled={!file || isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="animate-spin" aria-hidden="true" />
                                    Reading export…
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight aria-hidden="true" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </MigrationsPageShell>
    );
}
