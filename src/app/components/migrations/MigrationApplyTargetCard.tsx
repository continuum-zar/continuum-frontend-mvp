/**
 * Radio choice on the Apply screen: create a new project from the IR, or
 * merge into an existing one.
 *
 * "Merge into existing" reveals a project picker driven by the same
 * `useProjects()` hook the rest of the app uses, so the list of projects
 * matches what the user sees in the sidebar / Kanban.
 */

import { Folder, FolderPlus } from "lucide-react";

import { useProjects } from "@/api/hooks";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import {
    RadioGroup,
    RadioGroupItem,
} from "@/app/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select";

export type ApplyTarget =
    | { kind: "new" }
    | { kind: "merge"; projectId: number };

interface MigrationApplyTargetCardProps {
    target: ApplyTarget;
    onChange: (target: ApplyTarget) => void;
    suggestedProjectName: string;
    disabled?: boolean;
}

export function MigrationApplyTargetCard({
    target,
    onChange,
    suggestedProjectName,
    disabled,
}: MigrationApplyTargetCardProps) {
    const projects = useProjects();
    const mergeProjectId = target.kind === "merge" ? target.projectId : undefined;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Where should the import go?</CardTitle>
            </CardHeader>
            <CardContent>
                <RadioGroup
                    value={target.kind}
                    onValueChange={(v) => {
                        if (v === "new") onChange({ kind: "new" });
                        else if (v === "merge") {
                            // Pre-pick first project if available, else 0 → user must pick.
                            const first = projects.data?.[0]?.apiId ?? 0;
                            onChange({ kind: "merge", projectId: first });
                        }
                    }}
                    disabled={disabled}
                    className="space-y-2"
                >
                    <Label
                        htmlFor="migration-target-new"
                        className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-muted/30"
                    >
                        <RadioGroupItem
                            id="migration-target-new"
                            value="new"
                            className="mt-1"
                        />
                        <div className="space-y-0.5">
                            <p className="flex items-center gap-2 text-sm font-medium">
                                <FolderPlus className="size-4 text-muted-foreground" />
                                Create a new project
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Named &ldquo;{suggestedProjectName}&rdquo; based on the export.
                            </p>
                        </div>
                    </Label>

                    <Label
                        htmlFor="migration-target-merge"
                        className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-muted/30"
                    >
                        <RadioGroupItem
                            id="migration-target-merge"
                            value="merge"
                            className="mt-1"
                        />
                        <div className="space-y-2 w-full">
                            <div className="space-y-0.5">
                                <p className="flex items-center gap-2 text-sm font-medium">
                                    <Folder className="size-4 text-muted-foreground" />
                                    Merge into an existing project
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Matching tasks update in place; new tasks land alongside.
                                </p>
                            </div>
                            {target.kind === "merge" ? (
                                <Select
                                    value={mergeProjectId ? String(mergeProjectId) : ""}
                                    onValueChange={(v) =>
                                        onChange({ kind: "merge", projectId: Number(v) })
                                    }
                                    disabled={disabled || !projects.data?.length}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue
                                            placeholder={
                                                projects.isLoading
                                                    ? "Loading projects…"
                                                    : "Pick a project"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(projects.data ?? []).map((p) => (
                                            <SelectItem key={p.apiId} value={String(p.apiId)}>
                                                {p.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : null}
                        </div>
                    </Label>
                </RadioGroup>
            </CardContent>
        </Card>
    );
}
