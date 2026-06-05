/**
 * One mapping panel (status / priority / users). Collapsed by default with
 * a one-line summary; expanded view lists every source value that was
 * auto-mapped or flagged unknown, with a `<Select>` per row.
 *
 * Edits are pushed through `useDebouncedMappingPatch` (400 ms). The server
 * is the source of truth for warning recomputation; this panel reflects
 * the latest detail (re-fetched via TanStack Query invalidation).
 *
 * Architecture doc §3.7.a is the source for the collapsed-by-default UX
 * and the one-line summary copy. Per §3.3, unmapped source values fall
 * back to a safe default (status -> "todo", priority -> "medium") so
 * "Continue" never blocks.
 */

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/app/components/ui/collapsible";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select";
import { cn } from "@/app/components/ui/utils";
import type {
    CanonicalProjectIR,
    MigrationMappingOverrides,
} from "@/types/migration";

const CANONICAL_STATUSES = ["todo", "in_progress", "done"];
const CANONICAL_PRIORITIES = ["high", "medium", "low", "info"];

const STATUS_FALLBACK = "todo";
const PRIORITY_FALLBACK = "medium";

export type MappingKind = "status" | "priority";

interface MigrationMappingPanelProps {
    kind: MappingKind;
    ir: CanonicalProjectIR;
    overrides: MigrationMappingOverrides;
    onChange: (rawSourceValue: string, canonicalValue: string) => void;
    defaultOpen?: boolean;
}

interface MappingRow {
    raw: string;
    /** When true, this row came from an UNKNOWN_* warning — the user is
     *  expected to remap it (or accept the fallback). When false, the
     *  adapter LUT matched cleanly. */
    needsAttention: boolean;
    /** True if currently mapped via an LLM suggestion (future flag — see
     *  arch doc §3.3.a). For Phase 1 always false; the UI plumbing exists
     *  but no IR carries this marker yet. */
    llmSuggested: boolean;
}

function buildRows(
    kind: MappingKind,
    ir: CanonicalProjectIR,
): MappingRow[] {
    const warnCode = kind === "status" ? "UNKNOWN_STATUS" : "UNKNOWN_PRIORITY";
    const seen = new Map<string, MappingRow>();
    for (const w of ir.warnings) {
        if (w.code !== warnCode) continue;
        const raw = (w.detail as { raw?: string })?.raw;
        if (typeof raw !== "string" || !raw) continue;
        if (!seen.has(raw)) {
            seen.set(raw, { raw, needsAttention: true, llmSuggested: false });
        }
    }
    return [...seen.values()].sort((a, b) => a.raw.localeCompare(b.raw));
}

function summaryLine(
    kind: MappingKind,
    rows: MappingRow[],
    overrides: MigrationMappingOverrides,
): string {
    const map = kind === "status" ? overrides.status_map : overrides.priority_map;
    const fallback = kind === "status" ? STATUS_FALLBACK : PRIORITY_FALLBACK;
    const noun = kind === "status" ? "statuses" : "priorities";
    if (rows.length === 0) {
        return `All source ${noun} mapped automatically.`;
    }
    const remapped = rows.filter((r) => map?.[r.raw]).length;
    const remaining = rows.length - remapped;
    if (remaining === 0) {
        return `${remapped} of ${rows.length} source ${noun} remapped.`;
    }
    return `${remapped} of ${rows.length} remapped · ${remaining} will import as "${fallback}".`;
}

const HEADINGS: Record<MappingKind, { title: string; subtitle: string }> = {
    status: {
        title: "Status mapping",
        subtitle: "How source statuses translate to Continuum statuses.",
    },
    priority: {
        title: "Priority mapping",
        subtitle: "How source priorities translate to Continuum priorities.",
    },
};

export function MigrationMappingPanel({
    kind,
    ir,
    overrides,
    onChange,
    defaultOpen = false,
}: MigrationMappingPanelProps) {
    const rows = useMemo(() => buildRows(kind, ir), [kind, ir]);
    const summary = useMemo(
        () => summaryLine(kind, rows, overrides),
        [kind, rows, overrides],
    );
    const [open, setOpen] = useState(defaultOpen);

    const canonical = kind === "status" ? CANONICAL_STATUSES : CANONICAL_PRIORITIES;
    const fallback = kind === "status" ? STATUS_FALLBACK : PRIORITY_FALLBACK;
    const map = kind === "status" ? overrides.status_map : overrides.priority_map;
    const heading = HEADINGS[kind];

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className="rounded-md border border-border bg-card"
        >
            <CollapsibleTrigger asChild>
                <button
                    type="button"
                    className="flex w-full items-start justify-between gap-3 rounded-md px-4 py-3 text-left hover:bg-muted/30"
                >
                    <div className="space-y-0.5">
                        <p className="text-sm font-medium text-foreground">
                            {heading.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{summary}</p>
                    </div>
                    <span className="mt-0.5 text-muted-foreground">
                        {open ? (
                            <ChevronDown className="size-4" aria-hidden="true" />
                        ) : (
                            <ChevronRight className="size-4" aria-hidden="true" />
                        )}
                    </span>
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="space-y-3 border-t border-border px-4 py-3">
                    <p className="text-xs text-muted-foreground">{heading.subtitle}</p>
                    {rows.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Nothing to remap — everything matched a Continuum value.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {rows.map((row) => (
                                <MappingRowItem
                                    key={row.raw}
                                    row={row}
                                    value={map?.[row.raw] ?? fallback}
                                    canonical={canonical}
                                    onChange={(v) => onChange(row.raw, v)}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

interface MappingRowItemProps {
    row: MappingRow;
    value: string;
    canonical: string[];
    onChange: (value: string) => void;
}

function MappingRowItem({ row, value, canonical, onChange }: MappingRowItemProps) {
    return (
        <li
            className={cn(
                "flex flex-wrap items-center justify-between gap-3 rounded-sm px-2 py-1.5",
                row.needsAttention && "bg-warning/5",
            )}
        >
            <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-mono text-foreground">
                    {row.raw}
                </span>
                {row.llmSuggested ? (
                    <Badge
                        variant="outline"
                        className="border-info/40 text-info"
                        aria-label="LLM-suggested mapping"
                    >
                        <Sparkles className="size-3" aria-hidden="true" />
                        LLM
                    </Badge>
                ) : null}
            </div>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-40">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {canonical.map((c) => (
                        <SelectItem key={c} value={c}>
                            {c.replace(/_/g, " ")}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </li>
    );
}
