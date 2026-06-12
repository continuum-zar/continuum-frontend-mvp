/**
 * Grouped warnings panel on the Preview screen.
 *
 *   ⚠ Unresolved assignee (3)
 *      m-u-7 (no email) — tasks: APL-1, APL-3
 *
 *   ⚠ Unknown status (1)
 *      "Awaiting QA" — tasks: APL-6
 *
 * Each row has a "Fix this" button that scrolls the IR tree to the related
 * task and opens the matching mapping panel. The wiring lives on the
 * preview page; this component just emits the intent via `onJumpTo`.
 *
 * Per arch doc §3.7.a, warnings are NEVER blocking — they're informational.
 * The Continue button stays enabled regardless.
 */

import { useMemo } from "react";
import { AlertTriangle, Info } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";
import type { IRWarning } from "@/types/migration";

interface MigrationWarningsListProps {
    warnings: IRWarning[];
    onJumpTo?: (intent: {
        kind: "status" | "priority" | "user" | "task";
        taskExtId?: string | null;
        raw?: string | null;
    }) => void;
}

interface WarningGroup {
    code: string;
    label: string;
    description: string;
    /** "info" rows are LLM-informational, not problems — render in info, not warning. */
    severity: "warning" | "info";
    intent?: "status" | "priority" | "user" | "task";
    items: IRWarning[];
}

const LABELS: Record<
    string,
    Pick<WarningGroup, "label" | "description" | "severity" | "intent">
> = {
    UNKNOWN_STATUS: {
        label: "Unknown status",
        description: "Will import as \"todo\" unless remapped.",
        severity: "warning",
        intent: "status",
    },
    UNKNOWN_PRIORITY: {
        label: "Unknown priority",
        description: "Will import as \"medium\" unless remapped.",
        severity: "warning",
        intent: "priority",
    },
    UNRESOLVED_ASSIGNEE: {
        label: "Unresolved assignee",
        description: "No matching email or override — task will import unassigned.",
        severity: "warning",
        intent: "user",
    },
    UNRESOLVED_PARENT: {
        label: "Unresolved parent",
        description: "Parent task referenced but not found in this export.",
        severity: "warning",
        intent: "task",
    },
    CIRCULAR_DEPENDENCY: {
        label: "Circular dependency",
        description: "Cycle broken: one edge dropped per cycle.",
        severity: "warning",
    },
    DROPPED_DEPENDENCY_EDGE: {
        label: "Dropped dependency edge",
        description: "Resolved by the cycle break above.",
        severity: "warning",
    },
    DUPLICATE_EXT_ID: {
        label: "Duplicate ID",
        description: "First occurrence kept; duplicates dropped.",
        severity: "warning",
    },
    MISSING_REQUIRED_FIELD: {
        label: "Missing required field",
        description: "Row skipped because a required field was empty.",
        severity: "warning",
    },
    INVALID_DATE: {
        label: "Invalid date",
        description: "Date couldn't be parsed; will import as empty.",
        severity: "warning",
    },
    LABEL_TRUNCATED: {
        label: "Label truncated",
        description: "Labels longer than 64 characters were shortened.",
        severity: "warning",
    },
    LOW_CONFIDENCE_DETECTION: {
        label: "Low-confidence detection",
        description: "The source was identified using your dropdown hint.",
        severity: "warning",
    },
    UNKNOWN_SOURCE: {
        label: "Unknown source",
        description: "Falling back to the generic CSV adapter.",
        severity: "warning",
    },
    SKIPPED_DONE_TASK: {
        label: "Tasks already done (skipped)",
        description: "Skipped because you toggled \"Skip tasks already marked done\".",
        severity: "info",
    },
    IMPORTED_TO_DEFAULT_MILESTONE: {
        label: "Grouped under a catch-all milestone",
        description:
            "Continuum tasks live inside milestones. Tasks without a sprint or section in the source were grouped together — you can rename or split this milestone after the import.",
        severity: "info",
    },
    LLM_MAPPED: {
        label: "AI-suggested mappings",
        description: "Continuum used an AI hint for these source values.",
        severity: "info",
    },
    LLM_GROUPING_FAILED: {
        label: "Auto-organize couldn't run",
        description:
            "The AI couldn't group these tasks into milestones (often an LLM rate-limit or quota issue). Your tasks will land under the catch-all milestone — you can split them up after import.",
        severity: "warning",
    },
};

function groupWarnings(warnings: IRWarning[]): WarningGroup[] {
    const byCode = new Map<string, IRWarning[]>();
    for (const w of warnings) {
        const arr = byCode.get(w.code) ?? [];
        arr.push(w);
        byCode.set(w.code, arr);
    }
    const out: WarningGroup[] = [];
    for (const [code, items] of byCode.entries()) {
        const meta = LABELS[code] ?? {
            label: code.replace(/_/g, " ").toLowerCase(),
            description: "",
            severity: "warning" as const,
            intent: undefined,
        };
        out.push({ code, ...meta, items });
    }
    // Severity ascending = warnings first, then info.
    out.sort((a, b) => {
        if (a.severity !== b.severity) return a.severity === "warning" ? -1 : 1;
        return a.label.localeCompare(b.label);
    });
    return out;
}

export function MigrationWarningsList({
    warnings,
    onJumpTo,
}: MigrationWarningsListProps) {
    const groups = useMemo(() => groupWarnings(warnings), [warnings]);

    if (groups.length === 0) {
        return (
            <div className="rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                No warnings — everything in this export looks clean.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {groups.map((g) => (
                <WarningGroupCard key={g.code} group={g} onJumpTo={onJumpTo} />
            ))}
        </div>
    );
}

function WarningGroupCard({
    group,
    onJumpTo,
}: {
    group: WarningGroup;
    onJumpTo?: MigrationWarningsListProps["onJumpTo"];
}) {
    const Icon = group.severity === "info" ? Info : AlertTriangle;
    return (
        <div
            className={cn(
                "rounded-md border px-4 py-3",
                group.severity === "info"
                    ? "border-info/20 bg-info/5"
                    : "border-warning/20 bg-warning/5",
            )}
        >
            <div className="flex items-start gap-3">
                <Icon
                    aria-hidden="true"
                    className={cn(
                        "mt-0.5 size-4 shrink-0",
                        group.severity === "info" ? "text-info" : "text-warning",
                    )}
                />
                <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground">
                        {group.label}{" "}
                        <span className="text-muted-foreground font-normal">
                            ({group.items.length})
                        </span>
                    </p>
                    {group.description ? (
                        <p className="text-xs text-muted-foreground">{group.description}</p>
                    ) : null}
                    {group.items.slice(0, 5).length > 0 ? (
                        <ul className="space-y-1 pt-1">
                            {group.items.slice(0, 5).map((item, index) => {
                                const raw = (item.detail as { raw?: string })?.raw;
                                return (
                                    <li
                                        key={`${item.ext_id ?? index}-${index}`}
                                        className="flex items-center justify-between gap-3 text-xs text-foreground"
                                    >
                                        <span className="font-mono text-muted-foreground">
                                            {item.ext_id ?? raw ?? "—"}
                                        </span>
                                        {onJumpTo && group.intent ? (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    onJumpTo({
                                                        kind: group.intent!,
                                                        taskExtId: item.ext_id ?? null,
                                                        raw: raw ?? null,
                                                    })
                                                }
                                            >
                                                Fix this
                                            </Button>
                                        ) : null}
                                    </li>
                                );
                            })}
                            {group.items.length > 5 ? (
                                <li className="text-xs text-muted-foreground">
                                    +{group.items.length - 5} more
                                </li>
                            ) : null}
                        </ul>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
