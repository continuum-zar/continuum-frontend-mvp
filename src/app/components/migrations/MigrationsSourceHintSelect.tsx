/**
 * Source hint dropdown used on the Upload screen.
 *
 * "Auto" is the default and means the UI omits ``source_hint`` from the
 * multipart body — backend sniffers pick the adapter. Explicit options
 * are surfaced for two reasons (per arch doc §3.7):
 *   1. The user knows their source better than the sniffer when the export
 *      is heavily customised or partial.
 *   2. A confidence-loss event (LOW_CONFIDENCE_DETECTION) can be avoided
 *      up front by picking explicitly.
 */

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select";
import type { SourceHintOption } from "@/types/migration";

interface MigrationsSourceHintSelectProps {
    value: SourceHintOption;
    onChange: (value: SourceHintOption) => void;
    disabled?: boolean;
    id?: string;
}

const OPTIONS: { value: SourceHintOption; label: string; hint?: string }[] = [
    { value: "auto", label: "Auto-detect", hint: "Recommended" },
    { value: "jira", label: "Jira (CSV export)" },
    { value: "trello", label: "Trello (JSON export)" },
    { value: "asana", label: "Asana (CSV export)" },
    { value: "generic_csv", label: "Generic CSV" },
];

export function MigrationsSourceHintSelect({
    value,
    onChange,
    disabled,
    id,
}: MigrationsSourceHintSelectProps) {
    return (
        <Select
            value={value}
            onValueChange={(v) => onChange(v as SourceHintOption)}
            disabled={disabled}
        >
            <SelectTrigger id={id} className="w-full sm:w-72">
                <SelectValue placeholder="Auto-detect" />
            </SelectTrigger>
            <SelectContent>
                {OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">
                            <span>{opt.label}</span>
                            {opt.hint ? (
                                <span className="text-muted-foreground text-xs">
                                    {opt.hint}
                                </span>
                            ) : null}
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
